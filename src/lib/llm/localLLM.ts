/**
 * In-Browser Local LLM Service (WebLLM / WebGPU)
 * Executes inference 100% on the client GPU with zero external API calls or server costs.
 */

import { CreateMLCEngine, MLCEngineInterface } from '@mlc-ai/web-llm';
import {
  DEFAULT_MODEL_ID,
  FALLBACK_MODEL_ID,
  checkWebGPUSupport,
  WebGPUStatus,
} from './modelLoader';
import { buildSystemPrompt, buildUserPrompt, PromptPayload } from './prompt';
import { GuideChunk } from '../storage/languageGuideDB';
import { PastCorrectionCase } from '../storage/correctionHistoryDB';
import { searchRelevantGuideRules, ScoredChunk } from '../rag/search';

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
}

type ProgressListener = (report: LLMProgressReport) => void;

function cleanPunct(str: string): string {
  return (str || '').replace(/[.!?~,'"`·\s]+$/g, '').trim();
}

class LocalLLMManager {
  private static instance: LocalLLMManager | null = null;
  private engine: MLCEngineInterface | null = null;
  private currentModelId: string = DEFAULT_MODEL_ID;
  private stage: LLMStage = 'idle';
  private progressPercent: number = 0;
  private statusMessage: string = 'AI 모델 준비 대기 중';
  private listeners: Set<ProgressListener> = new Set();
  private initPromise: Promise<boolean> | null = null;
  private webGPUStatus: WebGPUStatus | null = null;

  private constructor() {}

  public static getInstance(): LocalLLMManager {
    if (!LocalLLMManager.instance) {
      LocalLLMManager.instance = new LocalLLMManager();
    }
    return LocalLLMManager.instance;
  }

  public subscribe(listener: ProgressListener): () => void {
    this.listeners.add(listener);
    listener(this.getProgressReport());
    return () => {
      this.listeners.delete(listener);
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
      loadedModelId: this.engine ? this.currentModelId : undefined,
    };
  }

  public isReady(): boolean {
    return this.stage === 'ready' && this.engine !== null;
  }

  public getStage(): LLMStage {
    return this.stage;
  }

  /**
   * Initializes the in-browser WebLLM engine with one-time model caching
   */
  public async initializeModel(preferredModelId?: string): Promise<boolean> {
    if (this.isReady()) return true;
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      // 1. Check WebGPU Support
      this.stage = 'checking_gpu';
      this.statusMessage = '브라우저 WebGPU 지원 여부 확인 중...';
      this.notify();

      this.webGPUStatus = await checkWebGPUSupport();
      if (!this.webGPUStatus.supported) {
        this.stage = 'unsupported_gpu';
        this.statusMessage = this.webGPUStatus.reason || 'WebGPU를 사용할 수 없습니다.';
        this.notify();
        return false;
      }

      // 2. Select Model (Default Qwen2.5 1.5B)
      const targetModel = preferredModelId || this.currentModelId || DEFAULT_MODEL_ID;
      this.currentModelId = targetModel;

      this.stage = 'loading_model';
      this.statusMessage = 'AI 모델 확인 및 다운로드 준비 중... (첫 1회만 다운로드되며 브라우저에 캐시됩니다)';
      this.progressPercent = 0;
      this.notify();

      try {
        this.engine = await CreateMLCEngine(targetModel, {
          initProgressCallback: (report) => {
            const pct = Math.round(report.progress * 100);
            this.progressPercent = isNaN(pct) ? 0 : Math.min(100, pct);

            if (report.text.includes('Loading model from cache') || report.text.includes('cache')) {
              this.statusMessage = `브라우저 캐시에서 AI 모델 로드 중... (${this.progressPercent}%)`;
            } else if (report.text.includes('Fetch') || report.text.includes('download')) {
              this.statusMessage = `로컬 AI 모델 다운로드 중... (${this.progressPercent}%)`;
            } else {
              this.statusMessage = report.text || 'AI 엔진 초기화 중...';
            }

            if (this.progressPercent >= 99) {
              this.stage = 'initializing';
            } else {
              this.stage = 'loading_model';
            }
            this.notify();
          },
        });

        this.stage = 'ready';
        this.progressPercent = 100;
        this.statusMessage = `로컬 AI 모델(${targetModel}) 준비 완료 (100% 온디바이스 추론)`;
        this.notify();
        return true;
      } catch (err: any) {
        console.warn(`[LocalLLM] Failed loading ${targetModel}:`, err);

        // Fallback to lighter model (0.5B) if 1.5B fails
        if (targetModel !== FALLBACK_MODEL_ID) {
          try {
            console.log(`[LocalLLM] Attempting fallback to lightweight model: ${FALLBACK_MODEL_ID}`);
            this.currentModelId = FALLBACK_MODEL_ID;
            this.statusMessage = '경량형 모델로 전환 중...';
            this.notify();

            this.engine = await CreateMLCEngine(FALLBACK_MODEL_ID, {
              initProgressCallback: (report) => {
                const pct = Math.round(report.progress * 100);
                this.progressPercent = isNaN(pct) ? 0 : pct;
                this.statusMessage = `경량형 AI 모델 로딩 중... (${this.progressPercent}%)`;
                this.notify();
              },
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
   * Run local inference on input sentence using client-side RAG rules and past few-shot cases
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
      pastCases,
    } = params;

    // Detect if input sentence mentions button or is a button phrase
    let effectiveComponentType = componentType;
    if (
      inputSentence.includes('버튼') ||
      inputSentence.startsWith('[버튼') ||
      inputSentence.endsWith('하기') ||
      inputSentence.includes('예약해주세요') ||
      inputSentence.includes('신청해주세요') ||
      inputSentence.includes('결제해주세요')
    ) {
      if (componentType === 'general' || !componentType) {
        effectiveComponentType = 'button';
      }
    }

    // 1. RAG Search: Retrieve Top 5~10 most relevant guide rules
    const relevantRules = searchRelevantGuideRules(inputSentence, allChunks, {
      componentType: effectiveComponentType,
      limit: 8,
    });

    // 2. Few-shot Selection: Retrieve top 2~3 past correction cases
    const selectedPastCases = pastCases.slice(0, 3);
    const appliedRules = relevantRules.map((r) => r.chunk.title);

    // 3. If Local LLM engine is not initialized or still downloading, run high-precision client heuristic rule engine
    if (!this.engine || this.stage !== 'ready') {
      console.log('[LocalLLM] Engine not ready, running client-side RAG heuristic engine.');
      return this.runClientHeuristicFallback({
        inputSentence,
        relevantRules,
        selectedPastCases,
        componentType: effectiveComponentType,
        toneLevel,
        modelName: 'Client RAG Rule Engine (온디바이스)',
        allChunks,
      });
    }

    // 4. Build Prompts for WebLLM
    const systemPrompt = buildSystemPrompt(guideTitle, guideVersion);
    const userPrompt = buildUserPrompt({
      inputSentence,
      guideTitle,
      guideVersion,
      componentType: effectiveComponentType,
      service,
      context,
      toneLevel,
      relevantRules,
      pastCases: selectedPastCases,
    });

    try {
      this.stage = 'inspecting';
      this.statusMessage = '로컬 AI 모델이 가이드를 기반으로 문구를 분석 중입니다...';
      this.notify();

      const completion = await this.engine.chat.completions.create({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.15,
        max_tokens: 800,
        response_format: { type: 'json_object' },
      });

      this.stage = 'ready';
      this.statusMessage = '교정 완료';
      this.notify();

      const content = completion.choices[0]?.message?.content || '{}';
      const parsed = this.parseJsonSafely(content);

      // Verify and guarantee guide enforcement
      const heuristicValidation = this.runClientHeuristicFallback({
        inputSentence,
        relevantRules,
        selectedPastCases,
        componentType: effectiveComponentType,
        toneLevel,
        modelName: this.currentModelId,
        allChunks,
      });

      if (parsed && typeof parsed.needsRevision === 'boolean') {
        let finalRevised = parsed.revised || inputSentence;
        let finalViolations = Array.isArray(parsed.violations) ? parsed.violations : [];
        let finalNeedsRevision = parsed.needsRevision;

        // If heuristic found guide violations that LLM missed (e.g. uploaded guide exact match), enforce heuristic
        if (heuristicValidation.needsRevision) {
          finalRevised = heuristicValidation.revised;
          finalNeedsRevision = true;
          const existingRuleTitles = new Set(finalViolations.map((v) => v.rule));
          heuristicValidation.violations.forEach((hv) => {
            if (!existingRuleTitles.has(hv.rule)) {
              finalViolations.unshift(hv);
            }
          });
        }

        return {
          needsRevision: finalNeedsRevision,
          original: parsed.original || inputSentence,
          revised: finalRevised,
          violations: finalViolations,
          summary: parsed.summary || heuristicValidation.summary || '사내 언어가이드 기준 정밀 교정이 완료되었습니다.',
          appliedRules,
          relevantChunks: relevantRules,
          usedPastCases: selectedPastCases,
          isLocalLLM: true,
          modelName: this.currentModelId,
        };
      }

      // If LLM returned unparsable response, use heuristic output
      return heuristicValidation;
    } catch (err: any) {
      console.error('[LocalLLM] Inference error, falling back to local heuristic:', err);
      this.stage = 'ready';
      this.notify();
      return this.runClientHeuristicFallback({
        inputSentence,
        relevantRules,
        selectedPastCases,
        componentType: effectiveComponentType,
        toneLevel,
        modelName: 'Client RAG Rule Engine (Fallback)',
        allChunks,
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
   * Client-side Heuristic Engine Fallback
   * Enforces uploaded guide chunks, button rules, and terminology dynamically.
   */
  private runClientHeuristicFallback(params: {
    inputSentence: string;
    relevantRules: ScoredChunk[];
    selectedPastCases: PastCorrectionCase[];
    componentType: string;
    toneLevel: number;
    modelName: string;
    allChunks?: GuideChunk[];
  }): LocalInspectionResult {
    const {
      inputSentence,
      relevantRules,
      selectedPastCases,
      componentType,
      toneLevel,
      modelName,
      allChunks,
    } = params;

    let revised = inputSentence.trim();
    const violations: LocalInspectionViolation[] = [];

    // Strip button quotes / prefixes if present e.g. 버튼 "예약해주세요" or [버튼] 예약해주세요
    let prefix = '';
    const prefixMatch = revised.match(/^(\[(?:버튼|확인\s*버튼|취소\s*버튼|CTA|Action)\]|\b버튼\b\s*[:：]?\s*)(["'“‘]?)(.*?)(["'”’]?)$/i);
    let innerText = revised;
    if (prefixMatch) {
      prefix = prefixMatch[1];
      innerText = prefixMatch[3].trim();
    } else {
      const quoteMatch = revised.match(/^["'“‘](.*?)["'”’]$/);
      if (quoteMatch) {
        innerText = quoteMatch[1].trim();
      }
    }

    // 0. Check Past Correction Cases from IndexedDB (Few-Shot memory)
    if (selectedPastCases && selectedPastCases.length > 0) {
      for (const pc of selectedPastCases) {
        if (
          pc.original &&
          (pc.original.trim() === inputSentence.trim() || pc.original.trim() === innerText) &&
          pc.finalRevision
        ) {
          revised = prefix ? `${prefix} ${pc.finalRevision}` : pc.finalRevision;
          violations.push({
            rule: `[과거 채택 학습] ${pc.appliedRules.join(', ') || '가이드 표준 준수'}`,
            originalPart: pc.original,
            suggestion: pc.finalRevision,
            reason: '과거에 사용자가 최종 채택하거나 직접 수정한 모범 사례(Few-Shot Memory)를 학습하여 동일하게 반영했습니다.',
          });
          break;
        }
      }
    }

    // 1. DYNAMIC GUIDE RULE MATCHING (From Active Uploaded Guide Chunks & RAG)
    // Gather all candidate chunks from uploaded guide and top search results
    const activeRuleChunks = allChunks && allChunks.length > 0 ? allChunks : relevantRules.map((r) => r.chunk);

    for (const chunk of activeRuleChunks) {
      // Build paired (bad, good) lists from chunk
      const pairs: Array<{ bad: string; good: string; rule: string; reason: string }> = [];

      // Extract from beforeExample / afterExample
      if (chunk.beforeExample && chunk.afterExample && chunk.beforeExample !== chunk.afterExample) {
        const befores = chunk.beforeExample.split(/[\/\n|]+/).map((b) => b.trim()).filter((b) => b.length >= 2);
        const afters = chunk.afterExample.split(/[\/\n|]+/).map((a) => a.trim()).filter((a) => a.length >= 1);
        if (befores.length === afters.length && befores.length > 1) {
          befores.forEach((b, idx) => {
            pairs.push({
              bad: b,
              good: afters[idx],
              rule: `[${chunk.ruleId}] ${chunk.title}`,
              reason: chunk.description || '사내 언어가이드 권장 표현을 적용합니다.',
            });
          });
        } else {
          befores.forEach((b) => {
            pairs.push({
              bad: b,
              good: afters[0] || chunk.afterExample.trim(),
              rule: `[${chunk.ruleId}] ${chunk.title}`,
              reason: chunk.description || '사내 언어가이드 권장 표현을 적용합니다.',
            });
          });
        }
      }

      // Extract from prohibitedPattern / recommendedPattern
      if (chunk.prohibitedPattern && chunk.recommendedPattern && chunk.prohibitedPattern !== chunk.recommendedPattern) {
        const probs = chunk.prohibitedPattern.split(/[\/\n|]+/).map((b) => b.trim()).filter((b) => b.length >= 2);
        const recos = chunk.recommendedPattern.split(/[\/\n|]+/).map((a) => a.trim()).filter((a) => a.length >= 1);
        if (probs.length === recos.length && probs.length > 1) {
          probs.forEach((p, idx) => {
            pairs.push({
              bad: p,
              good: recos[idx],
              rule: `[${chunk.ruleId}] ${chunk.title}`,
              reason: chunk.description || '사내 언어가이드 권장 표현을 적용합니다.',
            });
          });
        } else {
          probs.forEach((p) => {
            pairs.push({
              bad: p,
              good: recos[0] || chunk.recommendedPattern.trim(),
              rule: `[${chunk.ruleId}] ${chunk.title}`,
              reason: chunk.description || '사내 언어가이드 권장 표현을 적용합니다.',
            });
          });
        }
      }

      // Check each pair against revised and innerText
      for (const pair of pairs) {
        const badClean = cleanPunct(pair.bad);
        const goodClean = pair.good.trim();
        const revisedClean = cleanPunct(revised);
        const innerClean = cleanPunct(innerText);

        // Exact match (with or without punctuation)
        if (revisedClean === badClean || innerClean === badClean) {
          violations.push({
            rule: pair.rule,
            originalPart: innerText || revised,
            suggestion: goodClean,
            reason: pair.reason,
          });
          revised = prefix ? `${prefix} ${goodClean}` : goodClean;
          break;
        }

        // Substring match
        if (badClean.length >= 3 && revised.includes(badClean)) {
          violations.push({
            rule: pair.rule,
            originalPart: badClean,
            suggestion: goodClean,
            reason: pair.reason,
          });
          revised = revised.replaceAll(badClean, goodClean);
          break;
        }

        // Check if bad without period matches revised without period
        if (badClean.length >= 3 && revisedClean.includes(badClean)) {
          violations.push({
            rule: pair.rule,
            originalPart: badClean,
            suggestion: goodClean,
            reason: pair.reason,
          });
          const trailingPeriod = revised.endsWith('.') ? '.' : '';
          revised = revisedClean.replace(badClean, goodClean) + (goodClean.endsWith('.') ? '' : trailingPeriod);
          break;
        }
      }
    }

    // 2. Button Component Rules (핵심: 대화체/문장형 ~해주세요 금지 -> 행동형 ~하기 권장)
    const isButton =
      componentType === 'button' ||
      inputSentence.includes('버튼') ||
      inputSentence.startsWith('[버튼') ||
      inputSentence.endsWith('하기') ||
      prefix !== '';

    if (isButton) {
      // Direct high-frequency button mappings
      const directButtonMap: Record<string, string> = {
        '예약해주세요': '예약하기',
        '예약해 주세요': '예약하기',
        '예약하세요': '예약하기',
        '예약바랍니다': '예약하기',
        '예약해 주십시오': '예약하기',
        '신청해주세요': '신청하기',
        '신청해 주세요': '신청하기',
        '신청하세요': '신청하기',
        '신청바랍니다': '신청하기',
        '결제해주세요': '결제하기',
        '결제해 주세요': '결제하기',
        '결제하세요': '결제하기',
        '결제바랍니다': '결제하기',
        '확인해주세요': '확인하기',
        '확인해 주세요': '확인하기',
        '확인하세요': '확인하기',
        '확인바랍니다': '확인하기',
        '조회해주세요': '조회하기',
        '조회해 주세요': '조회하기',
        '등록해주세요': '등록하기',
        '등록해 주세요': '등록하기',
        '구매해주세요': '구매하기',
        '가입해주세요': '가입하기',
        '가입해 주세요': '가입하기',
        '다운로드해주세요': '다운로드하기',
        '문의해주세요': '문의하기',
        '선택해주세요': '선택하기',
        '선택해 주세요': '선택하기',
        '변경해주세요': '변경하기',
        '변경해 주세요': '변경하기',
        '취소해주세요': '취소하기',
        '이용해주세요': '이용하기',
        '이용해 주세요': '이용하기',
        '참여해주세요': '참여하기',
      };

      for (const [badBtn, goodBtn] of Object.entries(directButtonMap)) {
        if (revised.includes(badBtn) || innerText.includes(badBtn)) {
          const original = innerText.includes(badBtn) ? badBtn : revised;
          violations.push({
            rule: "[W-201] 버튼 표기 원칙 (대화체 '~해주세요' 지양, 행동형 '~하기' 권장)",
            originalPart: original,
            suggestion: goodBtn,
            reason: "사내 UX Writing 가이드(W-201)에 따라 버튼에는 대화체 문장형 서술어('~해주세요')를 사용하지 않고, 사용자의 행동을 명확하게 유도하는 액션형('~하기')으로 제시해야 합니다.",
          });
          if (prefix) {
            revised = `${prefix} ${goodBtn}`;
          } else if (revised.match(/^["'“‘].*?["'”’]$/)) {
            revised = goodBtn;
          } else {
            revised = revised.replaceAll(badBtn, goodBtn);
          }
          break;
        }
      }

      // Generalized regex for any Korean verb in buttons: [어간] + 해 주세요 / 해주세요 / 하세요 / 바랍니다
      const cleanBtn = cleanPunct(innerText || revised);
      const politeButtonMatch = cleanBtn.match(
        /^(.*?)(?:을|를)?\s*(?:해\s*주세요|해주세요|해줘|하세요|하십시오|바랍니다|해\s*바랍니다)$/
      );
      if (politeButtonMatch) {
        const root = politeButtonMatch[1].trim();
        if (root && root !== revised) {
          const suggested = `${root}하기`;
          const existingViolation = violations.some((v) => v.rule.includes('W-201'));
          if (!existingViolation) {
            violations.push({
              rule: "[W-201] 버튼 표기 원칙 (대화체 '~해주세요' 지양, 행동형 '~하기' 권장)",
              originalPart: cleanBtn,
              suggestion: suggested,
              reason: "사내 UX Writing 가이드(W-201)에 따라 버튼에는 대화체 문장형 서술어('~해주세요')를 사용하지 않고, 사용자의 행동을 명확하게 유도하는 액션형('~하기')으로 제시해야 합니다.",
            });
          }
          revised = prefix ? `${prefix} ${suggested}` : suggested;
        }
      }

      // Check if button text has redundant filler like "버튼을 클릭하세요", "버튼을 눌러주세요"
      if (revised.includes('버튼을') && (revised.includes('눌러') || revised.includes('클릭'))) {
        const simplified = revised
          .replace(/\s*버튼을\s*(?:눌러주세요|클릭하세요|클릭해 주세요|누르세요)\s*$/, '')
          .trim();
        if (simplified) {
          revised = simplified.endsWith('하기') ? simplified : `${simplified}하기`;
        }
      }
    }

    // 3. Prohibited terms and administrative words dictionary
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
      if (revised.includes(bad)) {
        violations.push({
          rule: info.rule,
          originalPart: bad,
          suggestion: info.term,
          reason: info.reason,
        });
        revised = revised.replaceAll(bad, info.term);
      }
    }

    // 4. Tone Level endings (Level 2 해요체 vs Level 3 명사형) for non-button components
    if (toneLevel === 2 && !isButton) {
      if (revised.endsWith('합니다.')) {
        revised = revised.replace(/합니다\.$/, '해요.');
      } else if (revised.endsWith('바랍니다.')) {
        revised = revised.replace(/바랍니다\.$/, '해 주세요.');
      }
    } else if (toneLevel === 3 && !isButton) {
      if (revised.endsWith('해 주세요.') || revised.endsWith('바랍니다.')) {
        revised = revised.replace(/(해 주세요\.|바랍니다\.)$/, '확인');
      }
    }

    const needsRevision = violations.length > 0 || revised !== inputSentence.trim();

    return {
      needsRevision,
      original: inputSentence,
      revised: needsRevision ? revised : inputSentence,
      violations,
      summary: needsRevision
        ? `사내 언어가이드 규정(${violations.map((v) => v.rule.split(' ')[0]).join(', ') || '가이드 표준'})에 따라 지양 표현을 정돈하고, 가이드 권장 형태로 교정했습니다.`
        : '현재 사내 언어가이드 기준으로 수정이 필요한 부분이 없습니다.',
      appliedRules: relevantRules.map((r) => r.chunk.title),
      relevantChunks: relevantRules,
      usedPastCases: selectedPastCases,
      isLocalLLM: false,
      modelName,
    };
  }
}

export const localLLM = LocalLLMManager.getInstance();
