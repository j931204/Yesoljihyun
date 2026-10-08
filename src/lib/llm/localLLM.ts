/**
 * In-Browser Local LLM Service (WebLLM / WebGPU)
 * Integrates 3-Stage Hybrid Rule Retrieval, Deterministic Fallbacks,
 * Post-Processing Validation, and Full Debug Telemetry.
 */

import { CreateMLCEngine, MLCEngineInterface } from '@mlc-ai/web-llm';
import {
  DEFAULT_MODEL_ID,
  FALLBACK_MODEL_ID,
  checkWebGPUSupport,
  WebGPUStatus,
} from './modelLoader';
import { buildSystemPrompt, buildUserPrompt } from './prompt';
import { GuideChunk } from '../storage/languageGuideDB';
import { PastCorrectionCase } from '../storage/correctionHistoryDB';
import { ScoredChunk } from '../rag/search';
import { StructuredGuideRule, DebugInspectionData } from '../../types';
import { hybridRetrieveRules } from '../rag/hybridSearch';
import {
  validateCorrectionResult,
  applyDeterministicReplacements,
  normalizeCopy,
} from './validator';

export type LLMStage =
  | 'idle'
  | 'checking_gpu'
  | 'unsupported_gpu'
  | 'loading_model'
  | 'initializing'
  | 'ready'
  | 'inspecting'
  | 'error';

export interface LLMProgressReport {
  stage: LLMStage;
  progressPercent: number; // 0 to 100
  statusMessage: string;
  loadedModelId?: string;
  error?: string;
}

export interface LocalInspectionViolation {
  rule: string;
  originalPart: string;
  suggestion: string;
  reason: string;
  ruleOrigin?: 'guide' | 'general';
  sourceText?: string;
}

export interface LocalInspectionResult {
  needsRevision: boolean;
  original: string;
  revised: string;
  violations: LocalInspectionViolation[];
  summary: string;
  appliedRules: string[];
  relevantChunks: ScoredChunk[];
  usedPastCases: PastCorrectionCase[];
  isLocalLLM: boolean;
  modelName: string;
  debugData?: DebugInspectionData;
}

export class LocalLLMManager {
  private static instance: LocalLLMManager;
  private engine: MLCEngineInterface | null = null;
  private stage: LLMStage = 'idle';
  private progressPercent = 0;
  private statusMessage = '대기 중';
  private currentModelId = DEFAULT_MODEL_ID;
  private listeners: Array<(report: LLMProgressReport) => void> = [];
  private gpuStatus: WebGPUStatus | null = null;
  private initPromise: Promise<boolean> | null = null;

  private constructor() {}

  public static getInstance(): LocalLLMManager {
    if (!LocalLLMManager.instance) {
      LocalLLMManager.instance = new LocalLLMManager();
    }
    return LocalLLMManager.instance;
  }

  public subscribe(fn: (report: LLMProgressReport) => void): () => void {
    this.listeners.push(fn);
    fn(this.getProgressReport());
    return () => {
      this.listeners = this.listeners.filter((l) => l !== fn);
    };
  }

  private notify() {
    const report = this.getProgressReport();
    this.listeners.forEach((l) => l(report));
  }

  public getProgressReport(): LLMProgressReport {
    return {
      stage: this.stage,
      progressPercent: this.progressPercent,
      statusMessage: this.statusMessage,
      loadedModelId: this.currentModelId,
    };
  }

  public getGPUStatus(): WebGPUStatus | null {
    return this.gpuStatus;
  }

  public isReady(): boolean {
    return this.stage === 'ready' && this.engine !== null;
  }

  /**
   * Initializes local WebLLM engine with WebGPU
   */
  public async initEngine(preferredModelId = DEFAULT_MODEL_ID): Promise<boolean> {
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      this.stage = 'checking_gpu';
      this.progressPercent = 5;
      this.statusMessage = '브라우저 WebGPU 가속 기능 확인 중...';
      this.notify();

      this.gpuStatus = await checkWebGPUSupport();
      if (!this.gpuStatus.supported) {
        this.stage = 'unsupported_gpu';
        this.progressPercent = 0;
        this.statusMessage =
          'WebGPU를 지원하지 않는 브라우저 또는 환경입니다. 확정 규칙 엔진(Deterministic Rule Engine)으로 자동 전환됩니다.';
        this.notify();
        return false;
      }

      this.currentModelId = preferredModelId;
      this.stage = 'loading_model';
      this.progressPercent = 15;
      this.statusMessage = `로컬 AI 모델(${this.currentModelId}) 로딩 준비 중...`;
      this.notify();

      try {
        const initProgressCallback = (report: any) => {
          const rawText = report.text || '';
          let percent = 20;

          const match = rawText.match(/(\d+)%/);
          if (match) {
            percent = Math.min(95, Math.max(15, parseInt(match[1], 10)));
          } else if (rawText.includes('Loading model')) {
            percent = 40;
          } else if (rawText.includes('Loading tokenizer')) {
            percent = 80;
          } else if (rawText.includes('Finish loading')) {
            percent = 95;
          }

          this.progressPercent = percent;
          this.statusMessage = `AI 모델 온디바이스 로딩 중: ${rawText || `${percent}%`}`;
          this.notify();
        };

        this.engine = await CreateMLCEngine(this.currentModelId, {
          initProgressCallback,
          logLevel: 'WARN',
        });

        this.stage = 'ready';
        this.progressPercent = 100;
        this.statusMessage = `로컬 AI 모델(${this.currentModelId}) 브라우저 로딩 완료`;
        this.notify();
        return true;
      } catch (err: any) {
        console.warn(`[LocalLLM] Primary model (${this.currentModelId}) failed to load:`, err);

        // Fallback model trial
        if (this.currentModelId !== FALLBACK_MODEL_ID) {
          try {
            console.log(`[LocalLLM] Attempting fallback model: ${FALLBACK_MODEL_ID}`);
            this.currentModelId = FALLBACK_MODEL_ID;
            this.statusMessage = `경량형 AI 모델(${FALLBACK_MODEL_ID})로 전환 로딩 중...`;
            this.notify();

            this.engine = await CreateMLCEngine(FALLBACK_MODEL_ID, {
              initProgressCallback: (report: any) => {
                this.statusMessage = `경량형 모델 로딩 중: ${report.text || ''}`;
                this.notify();
              },
              logLevel: 'WARN',
            });

            this.stage = 'ready';
            this.progressPercent = 100;
            this.statusMessage = `경량형 AI 모델(${FALLBACK_MODEL_ID}) 준비 완료`;
            this.notify();
            return true;
          } catch (fallbackErr: any) {
            console.error('[LocalLLM] Fallback model also failed:', fallbackErr);
          }
        }

        this.stage = 'error';
        this.statusMessage = `로컬 AI 로딩 실패: ${err?.message || '메모리 또는 WebGPU 오류'}`;
        this.notify();
        return false;
      } finally {
        this.initPromise = null;
      }
    })();

    return this.initPromise;
  }

  /**
   * Alias for model initialization
   */
  public async initializeModel(modelId?: string): Promise<boolean> {
    return this.initEngine(modelId || this.currentModelId);
  }

  /**
   * Run local inference on input sentence using 3-stage hybrid RAG rules and validation layer
   */
  public async inspectSentence(params: {
    inputSentence: string;
    guideTitle: string;
    guideVersion: string;
    componentType: string;
    service: string;
    context: string;
    toneLevel: number;
    allChunks: GuideChunk[];
    structuredRules?: StructuredGuideRule[];
    pastCases: PastCorrectionCase[];
  }): Promise<LocalInspectionResult> {
    const {
      inputSentence,
      guideTitle,
      guideVersion,
      componentType,
      service,
      context,
      toneLevel,
      allChunks,
      structuredRules = [],
      pastCases,
    } = params;

    // Detect button component
    let effectiveComponentType = componentType;
    if (
      inputSentence.includes('버튼') ||
      inputSentence.startsWith('[버튼') ||
      inputSentence.endsWith('하기') ||
      inputSentence.includes('예약해주세요') ||
      inputSentence.includes('신청해주세요') ||
      inputSentence.includes('결제해주세요') ||
      inputSentence.includes('확인해주세요')
    ) {
      if (componentType === 'general' || !componentType) {
        effectiveComponentType = 'button';
      }
    }

    // 1. 3-Stage Hybrid Rule Retrieval
    const hybridResult = hybridRetrieveRules(
      inputSentence,
      structuredRules,
      allChunks,
      {
        componentType: effectiveComponentType,
        limitSemantic: 6,
      }
    );

    const { exactMatchRules, regexMatchRules, semanticChunks, debugScores } = hybridResult;
    const selectedPastCases = pastCases.slice(0, 3);
    const appliedRules = [
      ...exactMatchRules.map((r) => r.category || r.id),
      ...semanticChunks.map((s) => s.chunk.title),
    ];

    // 2. Check if engine is available
    if (!this.engine || this.stage !== 'ready') {
      console.log('[LocalLLM] Engine not ready, executing deterministic hybrid rule engine.');
      return this.runDeterministicRuleEngine({
        inputSentence,
        exactMatchRules,
        regexMatchRules,
        semanticChunks,
        selectedPastCases,
        componentType: effectiveComponentType,
        toneLevel,
        modelName: 'Deterministic Hybrid Rule Engine (온디바이스)',
        debugScores,
        guideTitle,
        guideVersion,
      });
    }

    // 3. WebLLM Inference with Prompt Structuring
    const systemPrompt = buildSystemPrompt(guideTitle, guideVersion);
    const userPrompt = buildUserPrompt({
      inputSentence,
      guideTitle,
      guideVersion,
      componentType: effectiveComponentType,
      service,
      context,
      toneLevel,
      exactMatchRules,
      relevantRules: semanticChunks,
      pastCases: selectedPastCases,
    });

    let rawLLMResponse = '';
    let parsedLLM: any = null;

    try {
      this.stage = 'inspecting';
      this.statusMessage = '로컬 AI 모델이 가이드를 기반으로 문구를 분석 중입니다...';
      this.notify();

      // Generation configuration: low temperature (0.15) for consistency, top_p: 0.8
      const completion = await this.engine.chat.completions.create({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.15,
        top_p: 0.8,
        max_tokens: 600,
        response_format: { type: 'json_object' },
      });

      this.stage = 'ready';
      this.statusMessage = '교정 완료';
      this.notify();

      rawLLMResponse = completion.choices[0]?.message?.content || '{}';
      parsedLLM = this.parseJsonSafely(rawLLMResponse);

      // 4. Post-processing Validation Layer (Conditions A ~ E + Deterministic Guidance)
      let validation = validateCorrectionResult(
        inputSentence,
        parsedLLM || { needsRevision: false, revised: inputSentence, violations: [] },
        exactMatchRules
      );

      // If validation signaled retry need
      if (validation.needRetry && validation.retryReason) {
        console.warn(`[LocalLLM] Validation retry triggered: ${validation.retryReason}`);
        try {
          const retryPrompt = buildUserPrompt({
            inputSentence,
            guideTitle,
            guideVersion,
            componentType: effectiveComponentType,
            service,
            context,
            toneLevel,
            exactMatchRules,
            relevantRules: semanticChunks,
            pastCases: selectedPastCases,
            retryReason: validation.retryReason,
          });

          const retryCompletion = await this.engine.chat.completions.create({
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: retryPrompt },
            ],
            temperature: 0.1,
            top_p: 0.8,
            max_tokens: 600,
            response_format: { type: 'json_object' },
          });

          const retryRaw = retryCompletion.choices[0]?.message?.content || '{}';
          const retryParsed = this.parseJsonSafely(retryRaw);
          if (retryParsed) {
            rawLLMResponse = retryRaw;
            parsedLLM = retryParsed;
            validation = validateCorrectionResult(inputSentence, retryParsed, exactMatchRules);
          }
        } catch (retryErr) {
          console.error('[LocalLLM] Retry generation failed:', retryErr);
        }
      }

      // If exact avoid terms STILL remain after retry, apply deterministic replacement
      let finalRevised = validation.revised;
      let finalViolations = validation.violations;
      let finalNeedsRevision = validation.needsRevision;
      let finalSummary = validation.summary;

      if (exactMatchRules.length > 0 && validation.unresolvedAvoidTerms.length > 0) {
        console.warn('[LocalLLM] Applying deterministic rule replacement for unhandled avoid terms.');
        const deterministic = applyDeterministicReplacements(inputSentence, exactMatchRules);
        finalRevised = deterministic.revised;
        finalViolations = deterministic.appliedViolations;
        finalNeedsRevision = deterministic.appliedViolations.length > 0;
        finalSummary = '가이드 규칙에 따른 확정 권장 표현으로 정밀 교정했습니다.';
      }

      // Ensure every violation has sourceText and origin
      const enrichedViolations: LocalInspectionViolation[] = finalViolations.map((v) => {
        const matchingExact = exactMatchRules.find(
          (r) => r.avoid.some((a) => normalizeCopy(a) === normalizeCopy(v.originalPart))
        );
        return {
          ...v,
          ruleOrigin: matchingExact ? 'guide' : (v.ruleOrigin || 'general'),
          sourceText: matchingExact?.sourceText || v.sourceText || undefined,
        };
      });

      const debugData: DebugInspectionData = {
        modelId: this.currentModelId,
        webLLMVersion: '@mlc-ai/web-llm v0.2.85',
        temperature: 0.15,
        top_p: 0.8,
        enableThinking: false,
        inputSentence,
        exactMatchRules,
        regexMatchRules,
        semanticTopK: semanticChunks.map((s) => ({
          id: s.chunk.ruleId,
          title: s.chunk.title,
          score: s.score,
          reason: s.matchReasons.join(', '),
        })),
        promptPassedGuides: exactMatchRules.map((r) => `${r.avoid.join(', ')} -> ${r.preferred.join(', ')}`).join(' | '),
        finalPrompt: userPrompt,
        rawLLMResponse,
        parsedResponse: parsedLLM,
        validatorRemovedItems: validation.removedSameWordViolations,
        validationApplied: true,
        finalResult: {
          needsRevision: finalNeedsRevision,
          revised: finalRevised,
          violations: enrichedViolations,
          summary: finalSummary,
        },
      };

      return {
        needsRevision: finalNeedsRevision,
        original: inputSentence,
        revised: finalNeedsRevision ? finalRevised : inputSentence,
        violations: finalNeedsRevision ? enrichedViolations : [],
        summary: finalSummary,
        appliedRules,
        relevantChunks: semanticChunks,
        usedPastCases: selectedPastCases,
        isLocalLLM: true,
        modelName: this.currentModelId,
        debugData,
      };
    } catch (err: any) {
      console.error('[LocalLLM] Inference error, falling back to deterministic hybrid engine:', err);
      this.stage = 'ready';
      this.notify();
      return this.runDeterministicRuleEngine({
        inputSentence,
        exactMatchRules,
        regexMatchRules,
        semanticChunks,
        selectedPastCases,
        componentType: effectiveComponentType,
        toneLevel,
        modelName: 'Deterministic Hybrid Rule Engine (Fallback)',
        debugScores,
        guideTitle,
        guideVersion,
      });
    }
  }

  private parseJsonSafely(raw: string): any {
    try {
      return JSON.parse(raw);
    } catch {
      const match = raw.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          return JSON.parse(match[0]);
        } catch {
          return null;
        }
      }
      return null;
    }
  }

  /**
   * Deterministic Rule Engine
   * Executes exact matches, button regulations, and terminology substitutions without LLM hallucinations.
   */
  public runDeterministicRuleEngine(params: {
    inputSentence: string;
    exactMatchRules: StructuredGuideRule[];
    regexMatchRules: StructuredGuideRule[];
    semanticChunks: ScoredChunk[];
    selectedPastCases: PastCorrectionCase[];
    componentType: string;
    toneLevel: number;
    modelName: string;
    debugScores: Array<{ id: string; title: string; score: number; reason: string }>;
    guideTitle: string;
    guideVersion: string;
  }): LocalInspectionResult {
    const {
      inputSentence,
      exactMatchRules,
      regexMatchRules,
      semanticChunks,
      selectedPastCases,
      componentType,
      modelName,
      debugScores,
    } = params;

    let revised = inputSentence.trim();
    const violations: LocalInspectionViolation[] = [];

    // Helper for applying rule replacements
    const applyRulesList = (rulesList: StructuredGuideRule[]) => {
      for (const rule of rulesList) {
        const preferred = rule.preferred[0]?.trim();
        if (!preferred) continue;

        for (const rawAvoid of rule.avoid) {
          const avoid = rawAvoid?.trim();
          if (!avoid || avoid === preferred) continue;

          let target = '';
          if (revised.includes(avoid)) {
            target = avoid;
          } else {
            const strippedAvoid = avoid.replace(/[.!?~,\s]+$/, '');
            if (strippedAvoid && revised.includes(strippedAvoid)) {
              target = strippedAvoid;
            }
          }

          if (target && target !== preferred) {
            violations.push({
              rule: `[${rule.id}] ${rule.category}`,
              originalPart: target,
              suggestion: preferred,
              reason: rule.description || '사내 공식 언어가이드 확정 적용 규칙',
              ruleOrigin: 'guide',
              sourceText: rule.sourceText,
            });
            revised = revised.replaceAll(target, preferred);
            break;
          }
        }
      }
    };

    // 1. Apply Confirmed Exact Match Rules
    applyRulesList(exactMatchRules);

    // 2. Apply Regex Match Rules
    applyRulesList(regexMatchRules);

    // 3. Apply explicit before/after pairs from retrieved Semantic Chunks
    for (const sc of semanticChunks) {
      const chunk = sc.chunk;
      const before = (chunk.beforeExample || chunk.prohibitedPattern || '').trim();
      const after = (chunk.afterExample || chunk.recommendedPattern || '').trim();
      if (before && after && before !== after) {
        let target = '';
        if (revised.includes(before)) {
          target = before;
        } else {
          const strippedBefore = before.replace(/[.!?~,\s]+$/, '');
          if (strippedBefore && revised.includes(strippedBefore)) {
            target = strippedBefore;
          }
        }

        if (target && target !== after && !violations.some((v) => v.originalPart === target)) {
          violations.push({
            rule: `[${chunk.ruleId}] ${chunk.title}`,
            originalPart: target,
            suggestion: after,
            reason: chunk.description || '사내 가이드 세부 규정 준수',
            ruleOrigin: 'guide',
            sourceText: `${target} -> ${after}`,
          });
          revised = revised.replaceAll(target, after);
        }
      }
    }

    // 4. Button Component Rules
    const isButton =
      componentType === 'button' ||
      inputSentence.includes('버튼') ||
      inputSentence.startsWith('[버튼') ||
      inputSentence.endsWith('하기') ||
      inputSentence.includes('예약해주세요') ||
      inputSentence.includes('신청해주세요');

    if (isButton) {
      const buttonMap: Record<string, string> = {
        '예약해주세요': '예약하기',
        '예약해 주세요': '예약하기',
        '신청해주세요': '신청하기',
        '신청해 주세요': '신청하기',
        '결제해주세요': '결제하기',
        '결제해 주세요': '결제하기',
        '확인해주세요': '확인하기',
        '확인해 주세요': '확인하기',
        '조회해주세요': '조회하기',
        '등록해주세요': '등록하기',
        '구매해주세요': '구매하기',
        '가입해주세요': '가입하기',
        '다운로드해주세요': '다운로드하기',
        '문의해주세요': '문의하기',
        '선택해주세요': '선택하기',
        '변경해주세요': '변경하기',
        '취소해주세요': '취소하기',
        '이용해주세요': '이용하기',
      };

      for (const [bad, good] of Object.entries(buttonMap)) {
        if (revised.includes(bad)) {
          violations.push({
            rule: "[W-201] 버튼 표기 원칙 (대화체 '~해주세요' 지양, 행동형 '~하기' 권장)",
            originalPart: bad,
            suggestion: good,
            reason: "사내 UX Writing 가이드(W-201)에 따라 버튼에는 대화체 문장형 서술어('~해주세요')를 사용하지 않고, 사용자의 행동을 명확하게 유도하는 액션형('~하기')으로 제시해야 합니다.",
            ruleOrigin: 'guide',
            sourceText: "W-201: 버튼에는 대화체 서술어(~해주세요)를 쓰지 않으며 액션 CTA(~하기)를 권장합니다.",
          });
          revised = revised.replaceAll(bad, good);
          break;
        }
      }

      // Generalized polite ending regex in buttons
      const politeMatch = revised.match(/^(.*?)(?:을|를)?\s*(?:해\s*주세요|해주세요|해줘|하세요|하십시오|바랍니다)$/);
      if (politeMatch && politeMatch[1].trim()) {
        const root = politeMatch[1].trim();
        const suggested = `${root}하기`;
        if (suggested !== revised && !violations.some((v) => v.rule.includes('W-201'))) {
          violations.push({
            rule: "[W-201] 버튼 표기 원칙 (대화체 '~해주세요' 지양, 행동형 '~하기' 권장)",
            originalPart: revised,
            suggestion: suggested,
            reason: "사내 UX Writing 가이드에 따라 버튼에는 대화체 문장형 서술어를 사용하지 않고 액션형(~하기)을 권장합니다.",
            ruleOrigin: 'guide',
          });
          revised = suggested;
        }
      }
    }

    // 5. Terminology dictionary fallback
    const termDict: Record<string, { term: string; rule: string; reason: string }> = {
      금일: { term: '오늘', rule: '[W-301] 어려운 한자어 순화', reason: "공공언어 권고에 따라 '금일'을 쉬운 일상어 '오늘'로 순화합니다." },
      익일: { term: '다음 날', rule: '[W-301] 어려운 한자어 순화', reason: "'익일' 대신 직관적인 '다음 날'을 사용합니다." },
      기재: { term: '입력', rule: '[W-301] 어려운 한자어 순화', reason: "행정 용어 '기재'를 직관적인 '입력'으로 변경합니다." },
      수취: { term: '받기', rule: '[W-301] 어려운 한자어 순화', reason: "어려운 '수취' 대신 '받기'를 사용합니다." },
      회귀: { term: '돌아가기', rule: '[W-301] 직관적 행동 지시어', reason: "시스템 용어 '회귀'를 사용자 행동 중심의 '돌아가기'로 순화합니다." },
      상이: { term: '다름', rule: '[W-301] 직관성 제고', reason: "어려운 한자어 '상이' 대신 '다름'을 권장합니다." },
      송부: { term: '보내기', rule: '[W-301] 쉬운 일상어', reason: "행정어 '송부'를 직관적인 '보내기'로 순화합니다." },
      스트리밍: { term: '실시간 재생', rule: '[W-302] 외래어 순화', reason: '불필요한 외래어를 쉬운 우리말로 변경합니다.' },
      패스워드: { term: '비밀번호', rule: '[W-302] 표준 고객언어', reason: '표준 고객언어에 따라 비밀번호로 통일합니다.' },
      컨펌: { term: '확인', rule: '[W-302] 표준 우리말', reason: '직관적인 표준어 확인을 사용합니다.' },
      리셋: { term: '초기화', rule: '[W-302] 표준 우리말', reason: '직관적인 표준어 초기화를 사용합니다.' },
      되어집니다: { term: '됩니다', rule: '[W-204] 서비스 능동태 원칙', reason: '불필요한 이중 피동 표현(~되어집니다)을 배제하고 능동태로 서술합니다.' },
      소멸되어집니다: { term: '사라집니다', rule: '[W-204] 서비스 능동태 원칙', reason: '피동 표현을 고객 중심의 능동태로 변경합니다.' },
      지급되어집니다: { term: '지급됩니다', rule: '[W-204] 서비스 능동태 원칙', reason: '이중 피동을 단일 능동태로 정돈합니다.' },
      요망합니다: { term: '해 주세요', rule: '[W-303] 표준 친절 어미', reason: '권압적인 어미 대신 친절한 표준 해요체를 적용합니다.' },
    };

    for (const [bad, info] of Object.entries(termDict)) {
      if (revised.includes(bad) && bad !== info.term) {
        violations.push({
          rule: info.rule,
          originalPart: bad,
          suggestion: info.term,
          reason: info.reason,
          ruleOrigin: 'guide',
        });
        revised = revised.replaceAll(bad, info.term);
      }
    }

    // 6. Run Validation Layer
    const validation = validateCorrectionResult(
      inputSentence,
      {
        needsRevision: violations.length > 0 || revised !== inputSentence.trim(),
        revised,
        violations,
      },
      exactMatchRules
    );

    const debugData: DebugInspectionData = {
      modelId: 'Deterministic Rule Engine',
      webLLMVersion: 'N/A (Rule Engine Fallback)',
      temperature: 0,
      top_p: 0,
      enableThinking: false,
      inputSentence,
      exactMatchRules,
      regexMatchRules,
      semanticTopK: semanticChunks.map((s) => ({
        id: s.chunk.ruleId,
        title: s.chunk.title,
        score: s.score,
        reason: s.matchReasons.join(', '),
      })),
      promptPassedGuides: exactMatchRules.map((r) => `${r.avoid.join(', ')} -> ${r.preferred.join(', ')}`).join(' | '),
      finalPrompt: 'N/A (Rule Engine Mode)',
      rawLLMResponse: 'N/A',
      parsedResponse: null,
      validatorRemovedItems: validation.removedSameWordViolations,
      validationApplied: true,
      finalResult: {
        needsRevision: validation.needsRevision,
        revised: validation.revised,
        violations: validation.violations,
        summary: validation.summary,
      },
    };

    return {
      needsRevision: validation.needsRevision,
      original: inputSentence,
      revised: validation.needsRevision ? validation.revised : inputSentence,
      violations: validation.needsRevision ? validation.violations : [],
      summary: validation.summary,
      appliedRules: exactMatchRules.map((r) => r.category || r.id),
      relevantChunks: semanticChunks,
      usedPastCases: selectedPastCases,
      isLocalLLM: false,
      modelName,
      debugData,
    };
  }
}

export const localLLM = LocalLLMManager.getInstance();
