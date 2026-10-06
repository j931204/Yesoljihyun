import React from 'react';
import { Upload, FileText, Sparkles } from 'lucide-react';
import { ServiceType, PlatformType } from '../types';

interface NavbarProps {
  activeTab: 'inspect' | 'guides' | 'history';
  setActiveTab: (tab: 'inspect' | 'guides' | 'history') => void;
  service: ServiceType;
  platform: PlatformType;
  feedbackCount: number;
  guideCount: number;
  activeGuideVersion?: string;
  onOpenUploadModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  activeGuideVersion = 'v0.3',
  onOpenUploadModal,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Identity */}
          <div className="flex items-center space-x-3">
            <h1 className="text-base font-bold text-slate-900 tracking-tight flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#050099]"></span>
              <span>고객언어 UX 라이팅 검수기</span>
            </h1>
            <span className="hidden md:inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-[#050099]/10 text-[#050099] text-[10.5px] font-extrabold border border-[#050099]/20">
              <FileText className="w-3 h-3 text-[#050099]" />
              <span>가이드 {activeGuideVersion} 적용</span>
            </span>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center space-x-3">
            <nav className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                type="button"
                id="tab-inspect-btn"
                onClick={() => setActiveTab('inspect')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'inspect'
                    ? 'bg-white text-[#050099] shadow-xs font-extrabold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <span>문구 검수 스튜디오</span>
              </button>

              <button
                type="button"
                id="tab-guides-btn"
                onClick={() => setActiveTab('guides')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center space-x-1.5 ${
                  activeTab === 'guides'
                    ? 'bg-white text-[#050099] shadow-xs font-extrabold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <span>언어 가이드 관리 (PDF 업로드 & 버전)</span>
                <span className="px-1.5 py-0.2 bg-[#050099] text-white rounded-full text-[10px] font-extrabold">
                  {activeGuideVersion}
                </span>
              </button>

              <button
                type="button"
                id="tab-history-btn"
                onClick={() => setActiveTab('history')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'history'
                    ? 'bg-white text-[#050099] shadow-xs font-extrabold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <span>검수 이력 & 산출물</span>
              </button>
            </nav>

            {/* Quick Upload Button */}
            {onOpenUploadModal && (
              <button
                type="button"
                id="nav-quick-upload-guide-btn"
                onClick={onOpenUploadModal}
                className="hidden lg:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 text-xs font-extrabold shadow-2xs transition-all cursor-pointer whitespace-nowrap"
                title="새로 개정된 가이드 PDF 업로드"
              >
                <Upload className="w-3.5 h-3.5 text-slate-950" />
                <span>새 가이드 PDF 배포</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
