/**
 * Local WebLLM Model Configuration & WebGPU Support Detector
 * Centralizes model definitions and fallback configurations.
 */

export interface ModelSpec {
  id: string;
  name: string;
  family: 'qwen' | 'llama' | 'smollm';
  sizeDescription: string;
  vramRequiredMB: number;
  isDefault?: boolean;
  isLightweightFallback?: boolean;
}

export const SUPPORTED_MODELS: ModelSpec[] = [
  {
    id: 'Qwen2.5-1.5B-Instruct-q4f16_1-MLC',
    name: 'Qwen2.5 1.5B (권장 표준)',
    family: 'qwen',
    sizeDescription: '약 950MB (빠른 속도 & 정밀 한국어 교정)',
    vramRequiredMB: 1200,
    isDefault: true,
  },
  {
    id: 'Qwen2.5-0.5B-Instruct-q4f16_1-MLC',
    name: 'Qwen2.5 0.5B (경량형 Fallback)',
    family: 'qwen',
    sizeDescription: '약 380MB (저사양 PC / 모바일 브라우저 최적화)',
    vramRequiredMB: 600,
    isLightweightFallback: true,
  },
  {
    id: 'Qwen2.5-3B-Instruct-q4f16_1-MLC',
    name: 'Qwen2.5 3B (고성능)',
    family: 'qwen',
    sizeDescription: '약 1.9GB (복합 문장 및 심화 문체 분석)',
    vramRequiredMB: 2500,
  },
  {
    id: 'Llama-3.2-1B-Instruct-q4f16_1-MLC',
    name: 'Llama 3.2 1B (대체 모델)',
    family: 'llama',
    sizeDescription: '약 800MB (간결한 단답형 교정)',
    vramRequiredMB: 1000,
  },
];

export const DEFAULT_MODEL_ID = 'Qwen2.5-1.5B-Instruct-q4f16_1-MLC';
export const FALLBACK_MODEL_ID = 'Qwen2.5-0.5B-Instruct-q4f16_1-MLC';

export interface WebGPUStatus {
  supported: boolean;
  adapterName?: string;
  reason?: string;
}

/**
 * Checks whether the current browser supports WebGPU and whether an adapter is available.
 */
export async function checkWebGPUSupport(): Promise<WebGPUStatus> {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return { supported: false, reason: '서버 환경입니다.' };
  }

  // Check if navigator.gpu exists
  const nav = navigator as any;
  if (!nav.gpu) {
    return {
      supported: false,
      reason: '현재 브라우저가 WebGPU를 지원하지 않습니다. 최신 Chrome 또는 Edge 사용을 권장합니다.',
    };
  }

  try {
    const adapter = await nav.gpu.requestAdapter();
    if (!adapter) {
      return {
        supported: false,
        reason: 'WebGPU 하드웨어 가속 어댑터를 초기화할 수 없습니다. 그래픽 드라이버 상태를 확인하세요.',
      };
    }

    const info = (await adapter.requestAdapterInfo?.()) || {};
    return {
      supported: true,
      adapterName: info.description || info.vendor || 'WebGPU 하드웨어 가속기',
    };
  } catch (err: any) {
    return {
      supported: false,
      reason: err?.message || 'WebGPU 초기화 중 오류가 발생했습니다.',
    };
  }
}
