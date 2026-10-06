import React, { useState, useEffect } from 'react';
import {
  Cpu,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  DownloadCloud,
  RefreshCw,
  HardDrive,
  Sparkles,
  Info,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { localLLM, LLMProgressReport } from '../lib/llm/localLLM';
import { SUPPORTED_MODELS, ModelSpec } from '../lib/llm/modelLoader';

interface LocalAIStatusBarProps {
  onModelChange?: (modelId: string) => void;
}

export const LocalAIStatusBar: React.FC<LocalAIStatusBarProps> = ({ onModelChange }) => {
  const [report, setReport] = useState<LLMProgressReport>(localLLM.getProgressReport());
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string>(
    report.loadedModelId || SUPPORTED_MODELS[0].id
  );
  const [isSwitching, setIsSwitching] = useState(false);

  useEffect(() => {
    const unsubscribe = localLLM.subscribe((newReport) => {
      setReport(newReport);
      if (newReport.loadedModelId) {
        setSelectedModel(newReport.loadedModelId);
      }
    });
    return unsubscribe;
  }, []);

  const handleStartModelLoading = async (modelId?: string) => {
    setIsSwitching(true);
    try {
      await localLLM.initializeModel(modelId || selectedModel);
      if (onModelChange) {
        onModelChange(modelId || selectedModel);
      }
    } finally {
      setIsSwitching(false);
    }
  };

  const isReady = report.stage === 'ready';
  const isLoading = report.stage === 'loading_model' || report.stage === 'initializing';
  const isUnsupported = report.stage === 'unsupported_gpu';
  const isError = report.stage === 'error';

  return (
    <div
      id="local-ai-status-card"
      className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 space-y-3"
    >
      {/* Top Main Status Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          {/* Status Icon */}
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-2xs ${
              isReady
                ? 'bg-emerald-100 text-emerald-700'
                : isLoading
                ? 'bg-blue-100 text-blue-700 animate-pulse'
                : isUnsupported
                ? 'bg-amber-100 text-amber-700'
                : 'bg-slate-100 text-slate-700'
            }`}
          >
            {isReady ? (
              <Cpu className="w-5 h-5 text-emerald-600" />
            ) : isLoading ? (
              <DownloadCloud className="w-5 h-5 text-blue-600 animate-bounce" />
            ) : isUnsupported ? (
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            ) : (
              <Cpu className="w-5 h-5 text-slate-600" />
            )}
          </div>

          <div className="space-y-0.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-extrabold text-slate-900 flex items-center space-x-1.5">
                <span>클라이언트 로컬 AI 엔진</span>
                <span className="text-slate-400 font-normal">|</span>
                <span className="text-[#050099] font-bold">
                  {SUPPORTED_MODELS.find((m) => m.id === selectedModel)?.name || 'Qwen2.5 1.5B'}
                </span>
              </span>

              {isReady && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  <span>WebGPU 온디바이스 실행 중</span>
                </span>
              )}

              {isLoading && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200">
                  {report.progressPercent}% 로딩 중
                </span>
              )}

              {isUnsupported && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-800 border border-amber-200">
                  초고속 규칙 RAG 모드 가동
                </span>
              )}
            </div>

            <p className="text-[11.5px] text-slate-600 leading-tight">
              {report.statusMessage}
            </p>
          </div>
        </div>

        {/* Action Button & Toggle */}
        <div className="flex items-center space-x-2 shrink-0">
          {!isReady && !isLoading && !isUnsupported && (
            <button
              type="button"
              onClick={() => handleStartModelLoading()}
              disabled={isSwitching}
              className="px-3 py-1.5 rounded-xl bg-[#050099] hover:bg-[#040080] text-white text-xs font-extrabold transition-all shadow-xs cursor-pointer flex items-center space-x-1"
            >
              <DownloadCloud className="w-3.5 h-3.5" />
              <span>로컬 AI 모델 로드</span>
            </button>
          )}

          {isReady && (
            <span className="text-[11px] font-bold text-slate-500 hidden md:inline">
              외부 API 비용 0원 · 전송 0%
            </span>
          )}

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 text-xs font-bold cursor-pointer flex items-center space-x-1"
            title="모델 세부 정보 및 설정"
          >
            <span className="text-[11px]">{isExpanded ? '닫기' : '설정'}</span>
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Progress Bar while downloading */}
      {isLoading && (
        <div className="space-y-1.5 pt-1">
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
            <div
              className="bg-[#050099] h-full transition-all duration-300 rounded-full"
              style={{ width: `${Math.max(5, report.progressPercent)}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[10.5px] text-slate-500">
            <span>처음 한 번만 다운로드되며, 이후 브라우저 IndexedDB/Cache에 영구 저장됩니다.</span>
            <span className="font-mono font-bold text-slate-700">{report.progressPercent}%</span>
          </div>
        </div>
      )}

      {/* Security Banner Note */}
      <div className="flex items-center space-x-1.5 text-[11px] text-slate-500 pt-1 border-t border-slate-100">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
        <span>
          <strong>100% 온디바이스 처리</strong>: 입력한 문장과 사내 언어가이드는 외부 서버(OpenAI/Gemini/Claude 등)로 일절 전송되지 않습니다.
        </span>
      </div>

      {/* Expanded Model Configuration & Switcher */}
      {isExpanded && (
        <div className="pt-3 border-t border-slate-200/80 space-y-3 animate-in fade-in">
          <div className="space-y-1.5">
            <label className="block text-xs font-extrabold text-slate-800">
              실행할 오픈웨이트 로컬 AI 모델 선택:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {SUPPORTED_MODELS.map((spec) => {
                const isCurrent = spec.id === selectedModel;
                return (
                  <button
                    key={spec.id}
                    type="button"
                    onClick={() => {
                      setSelectedModel(spec.id);
                      handleStartModelLoading(spec.id);
                    }}
                    disabled={isLoading}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isCurrent
                        ? 'border-[#050099] bg-blue-50/50 ring-2 ring-[#050099]/20'
                        : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">{spec.name}</span>
                      {spec.isDefault && (
                        <span className="px-1.5 py-0.5 rounded text-[9.5px] font-extrabold bg-[#050099] text-white">
                          권장
                        </span>
                      )}
                      {spec.isLightweightFallback && (
                        <span className="px-1.5 py-0.5 rounded text-[9.5px] font-extrabold bg-slate-200 text-slate-700">
                          경량
                        </span>
                      )}
                    </div>
                    <span className="text-[10.5px] text-slate-500 mt-1">{spec.sizeDescription}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {isUnsupported && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1">
              <div className="font-bold flex items-center space-x-1">
                <Info className="w-3.5 h-3.5" />
                <span>WebGPU 미지원 안내</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                현재 브라우저에 WebGPU 그래픽 가속이 활성화되어 있지 않더라도, 탑재된 <strong>클라이언트 규칙 기반 RAG 엔진</strong>이 사내 가이드(W-201, W-204 등)를 바탕으로 100% 정상 교정합니다. (더 강력한 생성 모델 추론을 원하실 경우 최신 Chrome/Edge 브라우저 사용을 권장합니다)
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
