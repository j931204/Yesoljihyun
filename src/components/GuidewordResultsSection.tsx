import React from 'react';
import { FileSpreadsheet, FileText, Sparkles } from 'lucide-react';
import { InspectionSession, UIComponentType } from '../types';
import { ResultCard } from './ResultCard';
import { exportToExcel, exportToPdf } from '../utils/exportUtils';

interface GuidewordResultsSectionProps {
  session: InspectionSession | null;
  componentType: UIComponentType;
  onAdopt: (itemId: string, altNum: 1 | 2 | 'custom', customText?: string) => void;
  onFeedback: (itemId: string, type: 'positive' | 'negative', comment?: string) => void;
  onRefineChat: (itemId: string, userInstruction: string) => Promise<void>;
  refiningItemId: string | null;
  onSelectSample: (text: string, compType: UIComponentType) => void;
}

export const GuidewordResultsSection: React.FC<GuidewordResultsSectionProps> = ({
  session,
  componentType,
  onAdopt,
  onFeedback,
  onRefineChat,
  refiningItemId,
  onSelectSample,
}) => {
  const hasItems = session && session.items && session.items.length > 0;

  const handleExportPdf = () => {
    if (!session) return;
    exportToPdf(session);
  };

  const handleExportExcel = () => {
    if (!session) return;
    exportToExcel(session);
  };

  const SAMPLE_PRESETS: Array<{ label: string; text: string; comp: UIComponentType }> = [
    {
      label: '버튼 CTA',
      text: '예약해주세요',
      comp: 'button',
    },
    {
      label: 'TV 리모컨',
      text: '리모컨 방향키로 포커스를 이동하여 선택하십시오.',
      comp: 'textfield',
    },
    {
      label: '한자어 순화',
      text: '금일 중으로 가입 신청서를 송부해 주시기 바랍니다.',
      comp: 'general',
    },
    {
      label: '이중 피동',
      text: '회원 혜택이 일괄 소멸되어집니다.',
      comp: 'precaution',
    },
  ];

  return (
    <div id="guideword-results-section" className="space-y-4 pt-4 border-t border-slate-200/80">
      {/* 1. Header: 02 가이드가 제안하는 문구 + Export Buttons */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold text-slate-400 font-mono">02</span>
          <h3 className="text-base font-extrabold text-slate-900">가이드가 제안하는 문구</h3>
        </div>

        {/* Export buttons: PDF / Excel */}
        {hasItems && (
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleExportPdf}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all cursor-pointer shadow-2xs"
            >
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              <span>PDF</span>
            </button>
            <button
              type="button"
              onClick={handleExportExcel}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all cursor-pointer shadow-2xs"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500" />
              <span>Excel</span>
            </button>
          </div>
        )}
      </div>

      {/* 2. Results List or Clean Empty State */}
      {hasItems ? (
        <div className="space-y-5 animate-in fade-in duration-200">
          {session.items.map((item, index) => (
            <ResultCard
              key={item.id}
              item={item}
              index={index}
              service={session.service}
              platform={session.platform}
              componentType={item.componentType || componentType}
              context={session.context}
              toneLevel={session.toneLevel}
              onAdopt={onAdopt}
              onFeedback={onFeedback}
              onRefineChat={onRefineChat}
              isRefining={refiningItemId === item.id}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white/70 p-8 text-center space-y-4">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center mx-auto">
            <Sparkles className="w-5 h-5 text-[#1c4a34]" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-slate-800">아직 검수된 문구가 없어요</h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              상단 입력창에 검수할 문구를 작성하고 <strong>[가이드로 검수]</strong> 버튼을 누르면,
              사내 언어가이드 기준에 맞춘 두 가지 대안과 규칙 근거가 이곳에 표시됩니다.
            </p>
          </div>

          {/* Quick Presets Pill Bar */}
          <div className="pt-2">
            <span className="text-[11px] font-bold text-slate-400 block mb-2">테스트용 예시 문구 바로 입력:</span>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {SAMPLE_PRESETS.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => onSelectSample(p.text, p.comp)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-emerald-50 hover:border-emerald-300 text-xs font-semibold text-slate-700 transition-all cursor-pointer shadow-2xs"
                >
                  <span className="text-[10.5px] text-emerald-800 font-bold mr-1.5">[{p.label}]</span>
                  <span>{p.text}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
