import React, { useState } from 'react';
import { X, FileText, Search, CheckCircle2, ArrowRight, ExternalLink, Layers, BookOpen } from 'lucide-react';
import { UploadedGuideVersion, UIComponentType } from '../types';

interface GuideRulesQuickDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeGuide: UploadedGuideVersion;
  onNavigateToGuidesTab: () => void;
  onApplyPresetToInspection?: (comp: UIComponentType, text: string) => void;
}

export const GuideRulesQuickDrawer: React.FC<GuideRulesQuickDrawerProps> = ({
  isOpen,
  onClose,
  activeGuide,
  onNavigateToGuidesTab,
  onApplyPresetToInspection,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const rules = activeGuide.extractedRules.componentRules.filter((r) => {
    return (
      r.ruleId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.badExample.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.goodExample.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex justify-end">
      <div className="bg-white w-full max-w-xl h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 rounded-md bg-[#050099] text-white text-[10px] font-extrabold">
                {activeGuide.version}
              </span>
              <span className="text-xs font-bold text-slate-500">
                {activeGuide.pageCount} Pages · 사내 공식 배포본
              </span>
            </div>
            <h3 className="text-base font-extrabold text-slate-900">
              {activeGuide.title} 필수 규정
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-slate-100 bg-white">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="규칙 번호(W-201), 키워드(버튼, 팝업 등) 검색..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-[#050099] focus:ring-1 focus:ring-[#050099]"
            />
          </div>
        </div>

        {/* Rules List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
          {rules.map((rule) => (
            <div
              key={rule.ruleId}
              className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-[#050099]/40 hover:shadow-sm transition-all space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 rounded-md bg-[#050099] text-white font-extrabold text-[11px]">
                    {rule.ruleId}
                  </span>
                  <span className="text-[11px] font-bold text-slate-500">
                    가이드 p.{rule.page}
                  </span>
                </div>
                <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                  {rule.limit}
                </span>
              </div>

              <h4 className="text-xs font-extrabold text-slate-900 leading-snug">
                {rule.title}
              </h4>

              <p className="text-[11px] text-slate-600 leading-relaxed">
                {rule.description}
              </p>

              <div className="space-y-1 text-[11px] pt-1.5 border-t border-slate-200/80">
                <div className="flex items-center space-x-1.5 text-rose-800">
                  <span className="font-bold text-[10px] bg-rose-100 text-rose-700 px-1 rounded shrink-0">
                    지양
                  </span>
                  <span className="line-through">{rule.badExample}</span>
                </div>
                <div className="flex items-center space-x-1.5 text-emerald-800">
                  <span className="font-bold text-[10px] bg-emerald-100 text-emerald-700 px-1 rounded shrink-0">
                    권장
                  </span>
                  <span className="font-bold">{rule.goodExample}</span>
                </div>
              </div>

              {onApplyPresetToInspection && (
                <button
                  type="button"
                  onClick={() => {
                    onApplyPresetToInspection(rule.componentType, rule.badExample);
                    onClose();
                  }}
                  className="w-full mt-1.5 py-1 px-2.5 rounded-lg bg-white hover:bg-blue-50 border border-slate-200 text-[#050099] text-[10.5px] font-bold transition-all flex items-center justify-center space-x-1 cursor-pointer"
                >
                  <span>이 문구로 검수 입력창에 채우기</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            총 {activeGuide.extractedRules.componentRules.length}개 규정 탑재
          </span>
          <button
            type="button"
            onClick={() => {
              onClose();
              onNavigateToGuidesTab();
            }}
            className="px-3.5 py-2 rounded-xl bg-[#050099] hover:bg-[#040080] text-white text-xs font-bold transition-all flex items-center space-x-1 cursor-pointer"
          >
            <span>가이드 전체 관리 화면으로 이동</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
