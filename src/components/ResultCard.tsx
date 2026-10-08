import React, { useState } from 'react';
import {
  Copy,
  ThumbsUp,
  ThumbsDown,
  Edit3,
  CheckCircle2,
  RotateCcw,
  Bug,
  BookOpen,
} from 'lucide-react';
import {
  InspectionItemResult,
  ServiceType,
  PlatformType,
  ContextType,
  ToneLevel,
  UIComponentType,
} from '../types';
import { DEFAULT_COMPONENT_GUIDES } from '../data/defaultGuides';
import { computeWordDiff } from '../utils/diffUtils';
import { DebugModal } from './DebugModal';

interface ResultCardProps {
  item: InspectionItemResult;
  index: number;
  service: ServiceType;
  platform: PlatformType;
  componentType?: UIComponentType;
  context: ContextType;
  toneLevel: ToneLevel;
  onAdopt: (itemId: string, altNum: 1 | 2 | 'custom', customText?: string) => void;
  onFeedback: (itemId: string, type: 'positive' | 'negative', comment?: string) => void;
  onRefineChat: (itemId: string, userInstruction: string) => Promise<void>;
  isRefining?: boolean;
}

export const ResultCard: React.FC<ResultCardProps> = ({
  item,
  index,
  componentType = 'button',
  onAdopt,
  onFeedback,
}) => {
  const [copiedAlt, setCopiedAlt] = useState<number | null>(null);
  const [customEditing, setCustomEditing] = useState<boolean>(false);
  const [customText, setCustomText] = useState<string>(
    item.customAdoptedText || item.alt1.text
  );
  const [debugModalOpen, setDebugModalOpen] = useState<boolean>(false);
  const [expandedSources, setExpandedSources] = useState<Record<number, boolean>>({});

  const effectiveCompType: UIComponentType =
    (item.componentType as UIComponentType) || (componentType as UIComponentType) || 'button';
  const guideRule = DEFAULT_COMPONENT_GUIDES[effectiveCompType] || DEFAULT_COMPONENT_GUIDES.button;

  // Calculate character length
  const originalCharsNoSpace = item.originalText.replace(/\s+/g, '').length;
  const alt2CharsNoSpace = item.alt2.text.replace(/\s+/g, '').length;

  const handleCopy = (text: string, altNum: number) => {
    navigator.clipboard.writeText(text);
    setCopiedAlt(altNum);
    setTimeout(() => setCopiedAlt(null), 2000);
  };

  const handleSaveCustomEdit = () => {
    if (!customText.trim()) return;
    onAdopt(item.id, 'custom', customText.trim());
    setCustomEditing(false);
  };

  // Compute visual word-level diff between original and recommended
  const diffResult = computeWordDiff(item.originalText, item.alt1.text);
  const isNoRevision = !diffResult.hasDiff && (!item.violations || item.violations.length === 0);

  return (
    <div
      id={`result-card-${item.id}`}
      className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-all p-5 sm:p-6 space-y-4"
    >
      {/* 1. Header: Number + Original Text + Adoption Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-start sm:items-center space-x-3">
          <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-[#1c4a34] text-white text-xs font-bold shrink-0">
            {index + 1}
          </span>
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-700">
                {item.locationLabel || guideRule.title}
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                {originalCharsNoSpace}자
              </span>
            </div>
            <h4 className="text-base font-bold text-slate-900 mt-1 leading-snug">
              {item.originalText}
            </h4>
          </div>
        </div>

        {/* Adopted status pill if selected */}
        {item.selectedAlt && (
          <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold shrink-0">
            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
            <span>
              {item.selectedAlt === 1
                ? '추천안 채택 완료'
                : item.selectedAlt === 2
                ? '대안 2 채택 완료'
                : '사용자 직접 수정 반영'}
            </span>
          </div>
        )}
      </div>

      {/* 2. Visual Diff Section */}
      {isNoRevision ? (
        <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-200/80 flex items-start space-x-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-emerald-950 text-xs">
                사내 언어가이드 준수 (수정 필요 없음)
              </span>
              <span className="px-2 py-0.5 rounded text-[10.5px] font-bold bg-emerald-100 text-emerald-800">
                100% 적합
              </span>
            </div>
            <p className="text-xs text-emerald-800 leading-relaxed font-medium">
              현재 사내 언어가이드 기준으로 수정이 필요한 부분이 없습니다. 원문 그대로 사용하시기에 적합합니다.
            </p>
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/90 space-y-2.5">
          <div className="flex items-center justify-between text-xs font-extrabold text-slate-700">
            <span className="flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-[#1c4a34]"></span>
              <span>교정 비교 (Diff)</span>
            </span>
            <span className="text-[11px] text-slate-500 font-normal">
              적색 취소선: 지양 표현 / 녹색 굵은 글씨: 가이드 권장어
            </span>
          </div>

          {/* Diff Display Box */}
          <div className="space-y-1.5 text-xs sm:text-sm">
            <div className="flex items-baseline space-x-2 bg-white p-2.5 rounded-lg border border-slate-200">
              <span className="text-[11px] font-bold text-slate-500 w-10 shrink-0">기존</span>
              <div className="text-slate-800 leading-relaxed font-medium">
                {diffResult.parts.map((p, idx) => {
                  if (p.type === 'removed') {
                    return (
                      <span
                        key={idx}
                        className="bg-rose-100 text-rose-800 line-through px-1 py-0.5 rounded font-bold mx-0.5"
                      >
                        {p.text}
                      </span>
                    );
                  }
                  if (p.type === 'same') {
                    return <span key={idx}>{p.text}</span>;
                  }
                  return null;
                })}
              </div>
            </div>

            <div className="flex items-baseline space-x-2 bg-white p-2.5 rounded-lg border border-emerald-200 bg-emerald-50/30">
              <span className="text-[11px] font-bold text-emerald-800 w-10 shrink-0">추천</span>
              <div className="text-slate-900 leading-relaxed font-bold">
                {diffResult.parts.map((p, idx) => {
                  if (p.type === 'added') {
                    return (
                      <span
                        key={idx}
                        className="bg-emerald-100 text-emerald-950 px-1 py-0.5 rounded font-extrabold mx-0.5"
                      >
                        {p.text}
                      </span>
                    );
                  }
                  if (p.type === 'same') {
                    return <span key={idx}>{p.text}</span>;
                  }
                  return null;
                })}
              </div>
            </div>
          </div>

          {/* Applied Rules & Reasons List */}
          {item.violations && item.violations.length > 0 && (
            <div className="pt-2 border-t border-slate-200/80 space-y-2">
              <span className="text-[11px] font-extrabold text-slate-700 block">
                적용된 언어가이드 규칙 및 변경 이유:
              </span>
              <div className="space-y-2">
                {item.violations.map((v, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl bg-white border border-slate-200 text-xs space-y-1.5 shadow-2xs"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-1.5">
                      <div className="flex items-center space-x-1.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10.5px] font-extrabold ${
                            v.ruleOrigin === 'guide'
                              ? 'bg-[#1c4a34] text-white'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {v.ruleOrigin === 'guide' ? '언어가이드 직접 근거' : '일반 문장 개선 제안'}
                        </span>
                        <span className="font-bold text-slate-900">{v.title}</span>
                      </div>

                      {v.sourceText && (
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedSources((prev) => ({ ...prev, [i]: !prev[i] }))
                          }
                          className="text-[11px] text-[#1c4a34] hover:underline font-bold flex items-center space-x-1 cursor-pointer"
                        >
                          <BookOpen className="w-3 h-3" />
                          <span>
                            {expandedSources[i] ? '원문 근거 닫기' : '가이드 원문 근거 확인'}
                          </span>
                        </button>
                      )}
                    </div>

                    {/* Before -> After pill */}
                    {v.violatedTextPart && v.suggestedTextPart && v.violatedTextPart !== v.suggestedTextPart && (
                      <div className="text-[11px] flex items-center space-x-2 text-slate-700 bg-slate-50 p-1.5 rounded-lg border border-slate-200">
                        <span className="text-rose-700 font-bold line-through">
                          지양: {v.violatedTextPart}
                        </span>
                        <span className="text-slate-400">→</span>
                        <span className="text-emerald-800 font-extrabold">
                          권장: {v.suggestedTextPart}
                        </span>
                      </div>
                    )}

                    <div className="text-slate-600 leading-snug">
                      <strong className="text-slate-700">이유:</strong> {v.description}
                    </div>

                    {/* Collapsible Source Text */}
                    {v.sourceText && expandedSources[i] && (
                      <div className="mt-1.5 p-2 rounded-lg bg-emerald-50/70 border border-emerald-200 text-[11px] text-emerald-950 font-mono">
                        <span className="font-bold block text-emerald-900">언어가이드 원문:</span>
                        {v.sourceText}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. Primary User Action Toolbar */}
      <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          {/* Action 1: 추천안 적용 */}
          <button
            type="button"
            id={`btn-adopt-rec-${item.id}`}
            onClick={() => onAdopt(item.id, 1)}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center space-x-1.5 whitespace-nowrap shadow-xs ${
              item.selectedAlt === 1
                ? 'bg-emerald-700 text-white'
                : 'bg-[#1c4a34] hover:bg-[#153727] text-white'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{item.selectedAlt === 1 ? '추천안 채택됨' : '추천안 적용 (학습 반영)'}</span>
          </button>

          {/* Action 2: 직접 수정 */}
          <button
            type="button"
            id={`btn-custom-edit-${item.id}`}
            onClick={() => setCustomEditing(!customEditing)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 whitespace-nowrap ${
              customEditing || item.selectedAlt === 'custom'
                ? 'bg-emerald-100 text-[#1c4a34] border border-[#1c4a34]'
                : 'bg-white hover:bg-slate-100 text-slate-800 border border-slate-300'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>{customEditing ? '수정 취소' : '직접 수정'}</span>
          </button>

          {/* Action 3: 원문 유지 */}
          <button
            type="button"
            id={`btn-keep-orig-${item.id}`}
            onClick={() => onAdopt(item.id, 'custom', item.originalText)}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 transition-all cursor-pointer whitespace-nowrap"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>원문 유지</span>
          </button>

          {/* Copy Button */}
          <button
            type="button"
            onClick={() => handleCopy(item.alt1.text, 1)}
            className="px-3 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 transition-all cursor-pointer flex items-center space-x-1"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>{copiedAlt === 1 ? '복사됨!' : '문구 복사'}</span>
          </button>

          {/* Debug Mode Button */}
          {item.debugData && (
            <button
              type="button"
              onClick={() => setDebugModalOpen(true)}
              className="px-3 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 transition-all cursor-pointer flex items-center space-x-1"
              title="RAG & LLM 파이프라인 디버그 모드"
            >
              <Bug className="w-3.5 h-3.5 text-slate-500" />
              <span>디버그</span>
            </button>
          )}
        </div>

        {/* Quality feedback thumbs */}
        <div className="flex items-center space-x-1.5">
          <span className="text-[11px] text-slate-400">품질 만족도:</span>
          <button
            type="button"
            onClick={() => onFeedback(item.id, 'positive')}
            className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
              item.feedback?.type === 'positive'
                ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
            }`}
            title="좋아요 (선호 패턴 학습)"
          >
            <ThumbsUp className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onFeedback(item.id, 'negative')}
            className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
              item.feedback?.type === 'negative'
                ? 'bg-rose-50 border-rose-300 text-rose-700'
                : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
            }`}
            title="개선 필요"
          >
            <ThumbsDown className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Direct Custom Edit Form (if active) */}
      {customEditing && (
        <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-200 space-y-2.5 animate-in fade-in">
          <label className="block text-xs font-extrabold text-[#1c4a34]">
            사용자 최종 교정 문구 입력 (사내 학습 사례로 저장됩니다):
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-300 focus:border-[#1c4a34] focus:ring-1 focus:ring-[#1c4a34] bg-white font-bold"
              placeholder="직접 교정한 최종 문구를 입력하세요"
            />
            <button
              type="button"
              onClick={handleSaveCustomEdit}
              className="px-4 py-2 rounded-xl bg-[#1c4a34] hover:bg-[#153727] text-white text-xs font-extrabold cursor-pointer whitespace-nowrap"
            >
              저장 및 학습 반영
            </button>
          </div>
          <p className="text-[10.5px] text-slate-500">
            * 입력하신 수정안은 AI 추천안과 함께 브라우저에 저장되어, 향후 유사 문장 교정 시 중요한 참고 사례(Few-shot)로 활용됩니다.
          </p>
        </div>
      )}

      {/* 4. Second Alternative (간결·친절형) */}
      <div className="p-3.5 rounded-xl border border-slate-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
        <div className="space-y-0.5">
          <div className="flex items-center space-x-2">
            <span className="font-extrabold text-[#1c4a34]">대안 2 (간결 대안)</span>
            <span className="text-[10.5px] text-slate-400 font-mono">공백제외 {alt2CharsNoSpace}자</span>
          </div>
          <p className="text-slate-900 font-bold">{item.alt2.text}</p>
        </div>
        <div className="flex items-center space-x-1.5 shrink-0">
          <button
            type="button"
            onClick={() => handleCopy(item.alt2.text, 2)}
            className="px-2.5 py-1 text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer"
          >
            {copiedAlt === 2 ? '복사됨!' : '복사'}
          </button>
          <button
            type="button"
            onClick={() => onAdopt(item.id, 2)}
            className={`px-3 py-1 rounded-lg font-bold cursor-pointer whitespace-nowrap ${
              item.selectedAlt === 2
                ? 'bg-[#1c4a34] text-white'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
            }`}
          >
            {item.selectedAlt === 2 ? '채택됨' : '대안 2 적용'}
          </button>
        </div>
      </div>

      {/* 5. Pipeline Diagnostic Debug Modal */}
      <DebugModal
        isOpen={debugModalOpen}
        onClose={() => setDebugModalOpen(false)}
        data={item.debugData || null}
      />
    </div>
  );
};
