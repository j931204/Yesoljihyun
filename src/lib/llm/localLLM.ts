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
    // Immediately emit current state
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

    // 1. RAG Search: Retrieve Top 5~10 most relevant guide rules
    const relevantRules = searchRelevantGuideRules(inputSentence, allChunks, {
      componentType,
      limit: 7,
    });

    // 2. Few-shot Selection: Retrieve top 2~3 past correction cases
    const selectedPastCases = pastCases.slice(0, 3);

    const appliedRules = relevantRules.map((r) => r.chunk.title);

    // 3. Check if Local LLM is available, otherwise run high-precision client heuristic fallback
    if (!this.engine || this.stage !== 'ready') {
      console.log('[LocalLLM] Engine not ready, running client-side RAG heuristic engine.');
      return this.runClientHeuristicFallback({
        inputSentence,
        relevantRules,
        selectedPastCases,
        componentType,
        toneLevel,
        modelName: 'Client Heuristic Rule Engine (온디바이스)',
      });
    }

    // 4. Build Prompts
    const systemPrompt = buildSystemPrompt(guideTitle, guideVersion);
    const userPrompt = buildUserPrompt({
      inputSentence,
      guideTitle,
      guideVersion,
      componentType,
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

      if (parsed && typeof parsed.needsRevision === 'boolean') {
        return {
          needsRevision: parsed.needsRevision,
          original: parsed.original || inputSentence,
          revised: parsed.revised || inputSentence,
          violations: Array.isArray(parsed.violations) ? parsed.violations : [],
          summary: parsed.summary || '사내 언어가이드 기준 정밀 교정이 완료되었습니다.',
          appliedRules,
          relevantChunks: relevantRules,
          usedPastCases: selectedPastCases,
          isLocalLLM: true,
          modelName: this.currentModelId,
        };
      }

      // If LLM returned invalid JSON, fall back smoothly
      return this.runClientHeuristicFallback({
        inputSentence,
        relevantRules,
        selectedPastCases,
        componentType,
        toneLevel,
        modelName: `${this.currentModelId} (JSON 파싱 보정)`,
      });
    } catch (err: any) {
      console.error('[LocalLLM] Inference error, falling back to local heuristic:', err);
      this.stage = 'ready';
      this.notify();
      return this.runClientHeuristicFallback({
        inputSentence,
        relevantRules,
        selectedPastCases,
        componentType,
        toneLevel,
        modelName: 'Client RAG Rule Engine (Fallback)',
      });
    }
  }

  private parseJsonSafely(raw: string): any {
    try {
      return JSON.parse(raw);
    } catch {
      // Regex extraction for JSON object block
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
   * Enforces W-201, W-204, W-301 rules even if WebGPU is absent or initializing.
   */
  private runClientHeuristicFallback(params: {
    inputSentence: string;
    relevantRules: ScoredChunk[];
    selectedPastCases: PastCorrectionCase[];
    componentType: string;
    toneLevel: number;
    modelName: string;
  }): LocalInspectionResult {
    const {
      inputSentence,
      relevantRules,
      selectedPastCases,
      componentType,
      toneLevel,
      modelName,
    } = params;

    let revised = inputSentence.trim();
    const violations: LocalInspectionViolation[] = [];

    // 1. Check prohibited term dictionary
    const termDict: Record<string, { term: string; rule: string; reason: string }> = {
      금일: { term: '오늘', rule: '[W-301] 어려운 한자어 순화', reason: "공공언어 권고에 따라 '금일'을 쉬운 일상어 '오늘'로 순화합니다." },
      익일: { term: '다음 날', rule: '[W-301] 어려운 한자어 순화', reason: "'익일' 대신 직관적인 '다음 날'을 사용합니다." },
      기재: { term: '입력', rule: '[W-301] 어려운 한자어 순화', reason: "행정 용어 '기재'를 직관적인 '입력'으로 변경합니다." },
      수취: { term: '받기', rule: '[W-301] 어려운 한자어 순화', reason: "어려운 '수취' 대신 '받기'를 사용합니다." },
      회귀: { term: '돌아가기', rule: '[W-301] 직관적 행동 지시어', reason: "시스템 용어 '회귀'를 사용자 행동 중심의 '돌아가기'로 순화합니다." },
      스트리밍: { term: '실시간 재생', rule: '[W-302] 외래어 순화', reason: '불필요한 외래어를 쉬운 우리말로 변경합니다.' },
      패스워드: { term: '비밀번호', rule: '[W-302] 표준 고객언어', reason: '표준 고객언어에 따라 비밀번호로 통일합니다.' },
      컨펌: { term: '확인', rule: '[W-302] 표준 우리말', reason: '직관적인 표준어 확인을 사용합니다.' },
      리셋: { term: '초기화', rule: '[W-302] 표준 우리말', reason: '직관적인 표준어 초기화를 사용합니다.' },
      되어집니다: { term: '됩니다', rule: '[W-204] 서비스 능동태 원칙', reason: '불필요한 이중 피동 표현(~되어집니다)을 배제하고 능동태로 서술합니다.' },
      소멸되어집니다: { term: '사라집니다', rule: '[W-204] 서비스 능동태 원칙', reason: '피동 표현을 고객 중심의 능동태로 변경합니다.' },
      요망합니다: { term: '해 주세요', rule: '[W-303] 표준 친절 어미', reason: '권압적인 어미 대신 친절한 표준 해요체를 적용합니다.' },
      바랍니다: { term: '해 주세요', rule: '[W-303] 표준 친절 어미', reason: '경직된 어미 대신 표준 친절 해요체를 권장합니다.' },
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

    // 2. Button Component Rules (W-201)
    const isButton =
      componentType === 'button' ||
      inputSentence.endsWith('하기') ||
      inputSentence.endsWith('버튼');

    if (isButton) {
      if (revised.endsWith('하기')) {
        violations.push({
          rule: "[W-201] 버튼 내 '~하기' 접미사 금지 규정",
          originalPart: '하기',
          suggestion: '명사형 종결',
          reason: "UX Writing 가이드 p.4에 따라 버튼은 명사형으로 간결하게 종결하며 '~하기'를 붙이지 않습니다.",
        });
        revised = revised.replace(/하기$/, '');
      }

      if (revised.includes('본인인증 진행하기') || revised.includes('본인인증')) {
        revised = '본인인증';
      } else if (revised.includes('결제 승인 요청')) {
        revised = '결제 승인';
      } else if (revised.includes('로그인하기')) {
        revised = '로그인';
      } else if (revised.includes('확인하기')) {
        revised = '확인';
      }
    }

    // 3. Tone Level endings (Level 2 해요체 vs Level 3 명사형)
    if (toneLevel === 2 && !isButton) {
      if (revised.endsWith('합니다.')) {
        revised = revised.replace(/합니다\.$/, '해요.');
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
        ? `사내 언어가이드 규정(${violations.map((v) => v.rule.split(' ')[0]).join(', ') || '가이드 표준'})에 따라 불필요한 수식과 금지어를 정돈하고 적합한 어조로 교정했습니다.`
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
