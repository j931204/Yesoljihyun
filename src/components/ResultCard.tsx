import React, { useState } from 'react';
import {
  Sparkles,
  Check,
  Copy,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Send,
  Edit3,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  CheckSquare,
  Shield,
  Layers,
} from 'lucide-react';
import {
  InspectionItemResult,
  ServiceType,
  PlatformType,
  ContextType,
  ToneLevel,
  UIComponentType,
} from '../types';
import { SERVICES_CONFIG, DEFAULT_COMPONENT_GUIDES } from '../data/defaultGuides';
import { computeWordDiff } from '../utils/diffUtils';

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
  service,
  platform,
  componentType = 'button',
  context,
  toneLevel,
  onAdopt,
  onFeedback,
  onRefineChat,
  isRefining = false,
}) => {
  const [copiedAlt, setCopiedAlt] = useState<number | null>(null);
  const [showDetails, setShowDetails] = useState<boolean>(true); // default open to show rules and diff
  const [showChat, setShowChat] = useState<boolean>(false);
  const [chatInput, setChatInput] = useState<string>('');
  const [customEditing, setCustomEditing] = useState<boolean>(false);
  const [customText, setCustomText] = useState<string>(
    item.customAdoptedText || item.alt1.text
  );

  const effectiveCompType: UIComponentType =
    (item.componentType as UIComponentType) || (componentType as UIComponentType) || 'button';
  const guideRule = DEFAULT_COMPONENT_GUIDES[effectiveCompType] || DEFAULT_COMPONENT_GUIDES.button;

  // Calculate character length
  const originalCharsNoSpace = item.originalText.replace(/\s+/g, '').length;
  const alt1CharsNoSpace = item.alt1.text.replace(/\s+/g, '').length;
  const alt2CharsNoSpace = item.alt2.text.replace(/\s+/g, '').length;
  const charLimit = guideRule.charLimitRule.singleMax || 4;

  const handleCopy = (text: string, altNum: number) => {
    navigator.clipboard.writeText(text);
    setCopiedAlt(altNum);
    setTimeout(() => setCopiedAlt(null), 2000);
  };

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isRefining) return;
    const msg = chatInput.trim();
    setChatInput('');
    await onRefineChat(item.id, msg);
  };

  const handleSaveCustomEdit = () => {
    if (!customText.trim()) return;
    onAdopt(item.id, 'custom', customText.trim());
    setCustomEditing(false);
  };

  // Compute visual word-level diff between original and recommended
  const diffResult = computeWordDiff(item.originalText, item.alt1.text);

  return (
    <div
      id={`result-card-${item.id}`}
      className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-all p-5 sm:p-6 space-y-4"
    >
      {/* 1. Header: Number + Original Text + Adoption Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-start sm:items-center space-x-3">
          <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-[#050099] text-white text-xs font-bold shrink-0">
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
          <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold shrink-0">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
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

      {/* 2. Visual Diff Section (요구사항 8: 변경된 부분 diff 강조) */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
        <div className="flex items-center justify-between text-xs font-extrabold text-slate-700">
          <span className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-[#050099]"></span>
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
            <span className="text-[11px] font-bold text-emerald-700 w-10 shrink-0">추천</span>
            <div className="text-slate-900 leading-relaxed font-bold">
              {diffResult.parts.map((p, idx) => {
                if (p.type === 'added') {
                  return (
                    <span
                      key={idx}
                      className="bg-emerald-100 text-emerald-900 px-1 py-0.5 rounded font-extrabold mx-0.5"
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

        {/* Applied Rules & Reasons List (요구사항 8) */}
        {item.violations && item.violations.length > 0 && (
          <div className="pt-2 border-t border-slate-200/80 space-y-1.5">
            <span className="text-[11px] font-extrabold text-slate-700 block">
              적용된 언어가이드 규칙 및 변경 이유:
            </span>
            <div className="space-y-1">
              {item.violations.map((v, i) => (
                <div
                  key={i}
                  className="p-2 rounded-lg bg-white border border-slate-200 text-[11.5px] space-y-0.5"
                >
                  <div className="flex items-center space-x-2">
                    <span className="font-extrabold text-[#050099] bg-[#050099]/10 px-1.5 py-0.2 rounded text-[10.5px]">
                      적용 규칙
                    </span>
                    <span className="font-bold text-slate-900">{v.title}</span>
                  </div>
                  <div className="text-slate-600 pl-1 leading-snug">
                    <strong className="text-slate-700">이유:</strong> {v.description}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 3. Primary User Action Toolbar (요구사항 9: 추천안 적용 / 직접 수정 / 원문 유지) */}
      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          {/* Action 1: 추천안 적용 */}
          <button
            type="button"
            id={`btn-adopt-rec-${item.id}`}
            onClick={() => onAdopt(item.id, 1)}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center space-x-1.5 whitespace-nowrap shadow-xs ${
              item.selectedAlt === 1
                ? 'bg-emerald-600 text-white'
                : 'bg-[#050099] hover:bg-[#040080] text-white'
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
                ? 'bg-blue-100 text-[#050099] border border-[#050099]'
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
        <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-200 space-y-2.5 animate-in fade-in">
          <label className="block text-xs font-extrabold text-[#050099]">
            사용자 최종 교정 문구 입력 (사내 학습 사례로 저장됩니다):
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-300 focus:border-[#050099] focus:ring-1 focus:ring-[#050099] bg-white font-bold"
              placeholder="직접 교정한 최종 문구를 입력하세요"
            />
            <button
              type="button"
              onClick={handleSaveCustomEdit}
              className="px-4 py-2 rounded-xl bg-[#050099] hover:bg-[#040080] text-white text-xs font-extrabold cursor-pointer whitespace-nowrap"
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
            <span className="font-extrabold text-[#050099]">대안 2 (간결 대안)</span>
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
                ? 'bg-[#050099] text-white'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
            }`}
          >
            {item.selectedAlt === 2 ? '채택됨' : '대안 2 적용'}
          </button>
        </div>
      </div>
    </div>
  );
};
