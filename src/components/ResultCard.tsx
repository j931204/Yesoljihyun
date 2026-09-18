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
  const [showDetails, setShowDetails] = useState<boolean>(false);
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

  // Derive detected term replacements if available
  const primaryViolation = item.violations?.[0];
  let categoryLabel = '표현 개선';
  let targetWord = '';
  let replacedWord = '';

  if (primaryViolation) {
    const textToCheck = `${primaryViolation.category || ''} ${primaryViolation.title || ''} ${primaryViolation.description || ''}`;
    if (textToCheck.includes('한자')) categoryLabel = '한자어';
    else if (textToCheck.includes('외래') || textToCheck.includes('외국')) categoryLabel = '외국어·외래어';
    else if (textToCheck.includes('전문')) categoryLabel = '전문용어';
    else if (textToCheck.includes('어미') || textToCheck.includes('문법')) categoryLabel = '어미·문법';
    else if (textToCheck.includes('글자') || originalCharsNoSpace > charLimit) categoryLabel = '글자 수 초과';

    targetWord = primaryViolation.violatedTextPart || item.originalText;
    replacedWord = item.alt1.text;
  } else if (originalCharsNoSpace > charLimit) {
    categoryLabel = '글자 수 초과';
    targetWord = `${originalCharsNoSpace}자`;
    replacedWord = `${alt1CharsNoSpace}자 권장`;
  }

  return (
    <div
      id={`result-card-${item.id}`}
      className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-all p-5 sm:p-6 space-y-4"
    >
      {/* 1. Header: Number + Original Text + Adoption Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-start sm:items-center space-x-3">
          <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-slate-900 text-white text-xs font-bold shrink-0">
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
                ? '대안 1 채택'
                : item.selectedAlt === 2
                ? '대안 2 채택'
                : '직접 수정 채택'}
            </span>
          </div>
        )}
      </div>

      {/* 2. Key Term Substitution Row (이미지 속 깔끔한 대체 표현 행) */}
      {(primaryViolation || targetWord) && (
        <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="px-2.5 py-1 rounded-md bg-rose-50 border border-rose-200 text-rose-700 font-bold">
              {categoryLabel}
            </span>
            <span className="font-bold text-slate-700 bg-white px-2.5 py-1 rounded-md border border-slate-200 line-through text-slate-500">
              {targetWord}
            </span>
            <span className="text-slate-400 font-bold text-sm">→</span>
            <span className="font-extrabold text-[#050099] bg-[#050099]/10 px-3 py-1 rounded-md border border-[#050099]/20">
              {replacedWord}
            </span>
          </div>
          <span className="text-[11px] font-medium text-slate-600 shrink-0">
            표준 고객언어 가이드
          </span>
        </div>
      )}

      {/* 3. Suggested Alternatives (대안 1 & 대안 2 제안 카드) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
        {/* Alternative 1: 표준 추천형 */}
        <div
          className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
            item.selectedAlt === 1
              ? 'border-[#050099] bg-[#050099]/5 ring-2 ring-[#050099]/20'
              : 'border-slate-200 bg-white hover:border-slate-300'
          }`}
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-[#050099] flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-[#050099]" />
                <span>대안 1: 표준 권장형</span>
              </span>
              <span className="text-[11px] font-mono text-slate-500">
                공백제외 {alt1CharsNoSpace}자
              </span>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-sm font-extrabold text-[#050099] leading-relaxed">
              {item.alt1.text}
            </div>

            <p className="text-[11px] text-slate-600 leading-snug">
              {item.alt1.highlights || '가이드 표준 용어 및 권장 어미를 적용한 문구입니다.'}
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 mt-2 border-t border-slate-100">
            <button
              type="button"
              id={`copy-alt1-${item.id}`}
              onClick={() => handleCopy(item.alt1.text, 1)}
              className="text-xs text-slate-600 hover:text-[#050099] px-2.5 py-1.5 rounded-lg hover:bg-slate-100 transition-all cursor-pointer whitespace-nowrap"
            >
              {copiedAlt === 1 ? '복사됨!' : '문구 복사'}
            </button>

            <button
              type="button"
              id={`adopt-alt1-${item.id}`}
              onClick={() => onAdopt(item.id, 1)}
              className={`text-xs px-3.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap ${
                item.selectedAlt === 1
                  ? 'bg-[#050099] text-white shadow-xs'
                  : 'bg-[#050099]/10 text-[#050099] hover:bg-[#050099]/20 border border-[#050099]/20'
              }`}
            >
              <span>{item.selectedAlt === 1 ? '채택 완료' : '이 제안문구 채택'}</span>
            </button>
          </div>
        </div>

        {/* Alternative 2: 간결·친절형 */}
        <div
          className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
            item.selectedAlt === 2
              ? 'border-[#050099] bg-[#050099]/5 ring-2 ring-[#050099]/20'
              : 'border-slate-200 bg-white hover:border-slate-300'
          }`}
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-[#050099] flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-[#050099]" />
                <span>대안 2: 간결·친절형</span>
              </span>
              <span className="text-[11px] font-mono text-slate-500">
                공백제외 {alt2CharsNoSpace}자
              </span>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-sm font-extrabold text-[#050099] leading-relaxed">
              {item.alt2.text}
            </div>

            <p className="text-[11px] text-slate-600 leading-snug">
              {item.alt2.highlights || '사용자 친화적이고 직관적인 표현으로 축약한 문구입니다.'}
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 mt-2 border-t border-slate-100">
            <button
              type="button"
              id={`copy-alt2-${item.id}`}
              onClick={() => handleCopy(item.alt2.text, 2)}
              className="text-xs text-slate-600 hover:text-[#050099] px-2.5 py-1.5 rounded-lg hover:bg-slate-100 transition-all cursor-pointer whitespace-nowrap"
            >
              {copiedAlt === 2 ? '복사됨!' : '문구 복사'}
            </button>

            <button
              type="button"
              id={`adopt-alt2-${item.id}`}
              onClick={() => onAdopt(item.id, 2)}
              className={`text-xs px-3.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap ${
                item.selectedAlt === 2
                  ? 'bg-[#050099] text-white shadow-xs'
                  : 'bg-[#050099]/10 text-[#050099] hover:bg-[#050099]/20 border border-[#050099]/20'
              }`}
            >
              <span>{item.selectedAlt === 2 ? '채택 완료' : '이 제안문구 채택'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4. Bottom Utility Toolbar (세부 근거 / 직접 수정 / 대화형 재수정 토글) */}
      <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 text-xs">
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={() => setShowDetails(!showDetails)}
            className="text-slate-500 hover:text-slate-800 font-bold flex items-center space-x-1 cursor-pointer"
          >
            <span>{showDetails ? '세부 가이드 접기' : '세부 가이드 및 판정 근거'}</span>
            {showDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          <button
            type="button"
            onClick={() => setCustomEditing(!customEditing)}
            className="text-slate-500 hover:text-[#050099] font-bold cursor-pointer"
          >
            {customEditing ? '직접 수정 취소' : '직접 수정'}
          </button>

          <button
            type="button"
            onClick={() => setShowChat(!showChat)}
            className="text-slate-500 hover:text-[#050099] font-bold cursor-pointer"
          >
            {showChat ? '재수정 대화 닫기' : '대화형 재수정'}
          </button>
        </div>

        {/* Quality feedback thumbs */}
        <div className="flex items-center space-x-1.5">
          <span className="text-[11px] text-slate-400">품질 만족도:</span>
          <button
            type="button"
            onClick={() => onFeedback(item.id, 'positive')}
            className={`px-2 py-1 rounded text-xs font-bold border transition-all cursor-pointer ${
              item.feedback?.type === 'positive'
                ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
            }`}
          >
            만족
          </button>
          <button
            type="button"
            onClick={() => onFeedback(item.id, 'negative')}
            className={`px-2 py-1 rounded text-xs font-bold border transition-all cursor-pointer ${
              item.feedback?.type === 'negative'
                ? 'bg-rose-50 border-rose-300 text-rose-700'
                : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
            }`}
          >
            수정 필요
          </button>
        </div>
      </div>

      {/* Accordion: 세부 가이드 및 판정 근거 */}
      {showDetails && (
        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
          <div className="font-bold text-slate-800">
            적용 가이드 규칙: {guideRule.title} (권장 어미: {guideRule.toneEndingRule.preferredForm})
          </div>
          <p className="text-slate-600 leading-relaxed">
            {guideRule.toneEndingRule.description} (최적 글자수: {guideRule.charLimitRule.unitDescription})
          </p>
          {(item.violations || []).length > 0 && (
            <div className="pt-1 space-y-1">
              <span className="font-bold text-slate-700">검출된 개선 포인트:</span>
              <ul className="list-disc list-inside text-slate-600 space-y-0.5">
                {(item.violations || []).map((v, i) => (
                  <li key={i}>
                    <strong>[{v.category || v.title || '가이드 개선'}]</strong> {v.description || v.title}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Accordion: 직접 수정 입력 */}
      {customEditing && (
        <div className="p-3.5 bg-amber-50/60 rounded-xl border border-amber-200 space-y-2">
          <div className="text-xs font-bold text-amber-900">
            원하는 카피로 직접 수정 후 채택
          </div>
          <textarea
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            rows={2}
            className="w-full p-2.5 rounded-lg border border-amber-300 bg-white text-xs text-slate-900 focus:outline-hidden"
          />
          <button
            type="button"
            onClick={() => {
              onAdopt(item.id, 'custom', customText);
              setCustomEditing(false);
            }}
            className="px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs cursor-pointer"
          >
            직접 수정한 카피 채택
          </button>
        </div>
      )}

      {/* Accordion: 대화형 재수정 입력 */}
      {showChat && (
        <form onSubmit={handleSendChat} className="flex gap-2 pt-1">
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="예: 조금 더 부드럽고 친절한 톤으로 바꿔줘..."
            className="flex-1 px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-900 focus:ring-2 focus:ring-[#050099]/20"
          />
          <button
            type="submit"
            disabled={isRefining || !chatInput.trim()}
            className="px-4 py-2 bg-[#050099] hover:bg-[#040080] text-white rounded-lg text-xs font-bold disabled:opacity-50 cursor-pointer whitespace-nowrap"
          >
            {isRefining ? '재교정 중...' : '재교정 요청'}
          </button>
        </form>
      )}
    </div>
  );
};
