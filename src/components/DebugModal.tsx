import React, { useState } from 'react';
import { X, Bug, Terminal, ShieldCheck, CheckCircle2, AlertTriangle, Layers, Database } from 'lucide-react';
import { DebugInspectionData } from '../types';

interface DebugModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: DebugInspectionData | null;
}

export const DebugModal: React.FC<DebugModalProps> = ({ isOpen, onClose, data }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'prompt' | 'rules' | 'validator' | 'raw'>('overview');

  if (!isOpen || !data) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Bug className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-extrabold flex items-center space-x-2">
                <span>RAG & LLM 파이프라인 디버그 패널</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-900/60 text-indigo-300 border border-indigo-700/50">
                  {data.modelId}
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                입력 분석 → Hybrid Rule Retrieval → Prompt → LLM Response → Validator 검증 전체 흐름
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-4 text-xs font-bold overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 px-3.5 border-b-2 cursor-pointer transition-all whitespace-nowrap ${
              activeTab === 'overview'
                ? 'border-[#050099] text-[#050099]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            요약 & 검증
          </button>
          <button
            onClick={() => setActiveTab('rules')}
            className={`py-3 px-3.5 border-b-2 cursor-pointer transition-all whitespace-nowrap flex items-center space-x-1.5 ${
              activeTab === 'rules'
                ? 'border-[#050099] text-[#050099]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>탐지된 규칙</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 text-slate-700">
              {data.exactMatchRules.length + data.regexMatchRules.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('prompt')}
            className={`py-3 px-3.5 border-b-2 cursor-pointer transition-all whitespace-nowrap ${
              activeTab === 'prompt'
                ? 'border-[#050099] text-[#050099]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            최종 Prompt
          </button>
          <button
            onClick={() => setActiveTab('validator')}
            className={`py-3 px-3.5 border-b-2 cursor-pointer transition-all whitespace-nowrap flex items-center space-x-1.5 ${
              activeTab === 'validator'
                ? 'border-[#050099] text-[#050099]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>Validator 제거 내역</span>
            {data.validatorRemovedItems.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-100 text-rose-700 font-bold">
                {data.validatorRemovedItems.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('raw')}
            className={`py-3 px-3.5 border-b-2 cursor-pointer transition-all whitespace-nowrap ${
              activeTab === 'raw'
                ? 'border-[#050099] text-[#050099]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Raw LLM Response
          </button>
        </div>

        {/* Content Area */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4 text-xs font-sans">
          {activeTab === 'overview' && (
            <div className="space-y-4">
              {/* Configuration Matrix */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10.5px] text-slate-400 font-bold block">모델 ID</span>
                  <span className="text-xs font-extrabold text-slate-900 font-mono">{data.modelId}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10.5px] text-slate-400 font-bold block">엔진 런타임</span>
                  <span className="text-xs font-extrabold text-slate-900">{data.webLLMVersion}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10.5px] text-slate-400 font-bold block">Temperature / Top P</span>
                  <span className="text-xs font-extrabold text-slate-900 font-mono">
                    {data.temperature} / {data.top_p}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10.5px] text-slate-400 font-bold block">Thinking Mode</span>
                  <span className="text-xs font-extrabold text-slate-900 font-mono">
                    {data.enableThinking ? 'Active' : 'Disabled (비활성화)'}
                  </span>
                </div>
              </div>

              {/* Input & Output Diff */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="text-xs font-bold text-slate-700 block">원문 입력 vs 최종 결과</span>
                <div className="space-y-1 font-mono text-[11.5px]">
                  <div className="p-2 rounded bg-white border border-slate-200">
                    <strong className="text-slate-500 mr-2">[Original]</strong>
                    {data.inputSentence}
                  </div>
                  <div className="p-2 rounded bg-white border border-slate-200">
                    <strong className="text-emerald-700 mr-2">[Final Revised]</strong>
                    {data.finalResult?.revised}
                  </div>
                </div>
              </div>

              {/* Status Indicator */}
              <div className="p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-200 flex items-start space-x-2.5">
                <ShieldCheck className="w-4 h-4 text-indigo-700 shrink-0 mt-0.5" />
                <div className="text-[11.5px] text-indigo-950 space-y-1">
                  <p className="font-extrabold">Validator 정밀 검증 계층 적용 완료</p>
                  <p className="text-indigo-800 leading-relaxed">
                    동일 단어 중복 교정(originalPart === suggestion) {data.validatorRemovedItems.length}건 차단,
                    원문/추천문 일치 시 불필요 교정 보고 방지 조건이 정상 동작했습니다.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'rules' && (
            <div className="space-y-3">
              <h4 className="font-extrabold text-slate-900">
                1단계 확정 탐지 규칙 (Exact & Regex Match: {data.exactMatchRules.length + data.regexMatchRules.length}건)
              </h4>
              {data.exactMatchRules.length === 0 && data.regexMatchRules.length === 0 ? (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 text-center">
                  문장에서 직접 매칭된 확정 지양어가 없습니다. (일반 문맥/참고 규칙 모드로 평가)
                </div>
              ) : (
                <div className="space-y-2">
                  {data.exactMatchRules.map((r, i) => (
                    <div key={i} className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-emerald-900">[3-1 Exact Match] {r.id}: {r.category}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-600 text-white">확정 적용</span>
                      </div>
                      <div className="text-[11.5px] text-slate-700">
                        지양: <code className="bg-rose-100 text-rose-800 px-1 py-0.5 rounded font-bold">{r.avoid.join(', ')}</code>
                        {' → '}
                        권장: <code className="bg-emerald-100 text-emerald-900 px-1 py-0.5 rounded font-bold">{r.preferred.join(', ')}</code>
                      </div>
                      <p className="text-slate-600 text-[11px]">{r.description}</p>
                      {r.sourceText && (
                        <p className="text-slate-400 text-[10px] font-mono">출처: {r.sourceText}</p>
                      )}
                    </div>
                  ))}

                  {data.regexMatchRules.map((r, i) => (
                    <div key={i} className="p-3 rounded-xl bg-blue-50/60 border border-blue-200 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-blue-900">[3-2 Regex Match] {r.id}: {r.category}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-blue-600 text-white">형태 변형 매칭</span>
                      </div>
                      <div className="text-[11.5px] text-slate-700">
                        지양: <code className="bg-rose-100 text-rose-800 px-1 py-0.5 rounded font-bold">{r.avoid.join(', ')}</code>
                        {' → '}
                        권장: <code className="bg-emerald-100 text-emerald-900 px-1 py-0.5 rounded font-bold">{r.preferred.join(', ')}</code>
                      </div>
                      <p className="text-slate-600 text-[11px]">{r.description}</p>
                    </div>
                  ))}
                </div>
              )}

              <h4 className="font-extrabold text-slate-900 pt-3">
                3단계 Semantic RAG 매칭 (Top {data.semanticTopK.length}건)
              </h4>
              <div className="space-y-1.5">
                {data.semanticTopK.map((s, i) => (
                  <div key={i} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-900">{s.title}</span>
                      <span className="text-slate-500 ml-2 text-[11px]">({s.reason})</span>
                    </div>
                    <span className="font-mono font-bold text-indigo-700">{s.score}점</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'prompt' && (
            <div className="space-y-2">
              <span className="font-bold text-slate-700 block">로컬 LLM에게 전달된 실제 시스템 & 유저 프롬프트:</span>
              <pre className="p-4 rounded-xl bg-slate-900 text-slate-100 font-mono text-[11px] whitespace-pre-wrap leading-relaxed overflow-x-auto max-h-[500px]">
                {data.finalPrompt}
              </pre>
            </div>
          )}

          {activeTab === 'validator' && (
            <div className="space-y-3">
              <h4 className="font-extrabold text-slate-900">
                Validator가 감지하여 제거한 False-Positive 항목 ({data.validatorRemovedItems.length}건)
              </h4>
              {data.validatorRemovedItems.length === 0 ? (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-emerald-700 font-bold text-center">
                  <CheckCircle2 className="w-5 h-5 inline mr-1 text-emerald-600" />
                  동일 단어 중복 교정 오류가 발견되지 않았습니다. (클린 출력)
                </div>
              ) : (
                <div className="space-y-2">
                  {data.validatorRemovedItems.map((item, i) => (
                    <div key={i} className="p-3 rounded-xl bg-rose-50 border border-rose-200 space-y-1">
                      <div className="flex items-center space-x-2 text-rose-900 font-bold">
                        <AlertTriangle className="w-4 h-4 text-rose-600" />
                        <span>차단된 동일 단어 교정: &ldquo;{item.originalPart}&rdquo; → &ldquo;{item.suggestion}&rdquo;</span>
                      </div>
                      <p className="text-rose-800 text-[11px]">{item.reason}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'raw' && (
            <div className="space-y-2">
              <span className="font-bold text-slate-700 block">LLM 출력 원본 (Raw JSON Output):</span>
              <pre className="p-4 rounded-xl bg-slate-900 text-emerald-400 font-mono text-[11px] whitespace-pre-wrap leading-relaxed overflow-x-auto max-h-[500px]">
                {data.rawLLMResponse || '(Rule Engine Direct Result)'}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-extrabold bg-[#050099] text-white hover:bg-[#040080] transition-all cursor-pointer"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
