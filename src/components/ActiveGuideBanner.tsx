import React from 'react';
import { FileText, ArrowUpRight, Upload, Sparkles, CheckCircle2, ChevronRight, Layers } from 'lucide-react';
import { UploadedGuideVersion } from '../types';

interface ActiveGuideBannerProps {
  activeGuide: UploadedGuideVersion;
  onOpenUploadModal: () => void;
  onOpenGuideInspector: () => void;
  onNavigateToGuidesTab: () => void;
}

export const ActiveGuideBanner: React.FC<ActiveGuideBannerProps> = ({
  activeGuide,
  onOpenUploadModal,
  onOpenGuideInspector,
  onNavigateToGuidesTab,
}) => {
  return (
    <div
      id="active-guide-status-banner"
      className="bg-gradient-to-r from-slate-900 via-slate-800 to-[#050099]/90 text-white rounded-2xl p-4 sm:p-5 shadow-md border border-slate-700/60 relative overflow-hidden"
    >
      {/* Background graphic subtle elements */}
      <div className="absolute right-0 top-0 bottom-0 w-80 bg-gradient-to-l from-white/5 to-transparent pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Active Guide Meta */}
        <div className="flex items-start sm:items-center space-x-3.5">
          <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/20 flex flex-col items-center justify-center shrink-0 shadow-xs">
            <FileText className="w-5 h-5 text-blue-300" />
            <span className="text-[9px] font-extrabold text-blue-200 tracking-wider">PDF</span>
          </div>

          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-extrabold flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>현재 적용 가이드 (Active)</span>
              </span>
              <span className="px-2 py-0.5 rounded-md bg-white/10 text-white text-[10px] font-bold border border-white/10">
                버전 {activeGuide.version} {activeGuide.isInitialVersion ? '(1차 배포본)' : ''}
              </span>
              <span className="text-slate-300 text-[11px]">
                {activeGuide.pageCount} Pages · 최종 배포: {activeGuide.uploadedAt}
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <h2 className="text-base sm:text-lg font-extrabold text-white tracking-tight">
                {activeGuide.title}
              </h2>
            </div>

            <p className="text-xs text-slate-300 leading-tight">
              {activeGuide.summary}
            </p>
          </div>
        </div>

        {/* Right: Quick Actions */}
        <div className="flex flex-wrap items-center gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-700/60">
          <button
            type="button"
            id="btn-view-active-guide-rules"
            onClick={onOpenGuideInspector}
            className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer whitespace-nowrap shadow-xs"
          >
            <Layers className="w-3.5 h-3.5 text-blue-300" />
            <span>가이드 규정(W-201~) 확인</span>
          </button>

          <button
            type="button"
            id="btn-upload-guide-update"
            onClick={onOpenUploadModal}
            className="px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 text-xs font-extrabold transition-all flex items-center space-x-1.5 cursor-pointer whitespace-nowrap shadow-xs"
          >
            <Upload className="w-3.5 h-3.5 text-slate-950" />
            <span>새 가이드 PDF 업로드</span>
          </button>

          <button
            type="button"
            id="btn-go-to-guide-studio"
            onClick={onNavigateToGuidesTab}
            className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-slate-300 hover:text-white text-xs font-bold transition-all flex items-center space-x-1 cursor-pointer whitespace-nowrap"
            title="언어 가이드 관리 화면으로 이동"
          >
            <span>버전 관리</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
