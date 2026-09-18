import React from 'react';
import { ServiceType, PlatformType } from '../types';

interface NavbarProps {
  activeTab: 'inspect' | 'guides' | 'history';
  setActiveTab: (tab: 'inspect' | 'guides' | 'history') => void;
  service: ServiceType;
  platform: PlatformType;
  feedbackCount: number;
  guideCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
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
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
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
              id="tab-guides-btn"
              onClick={() => setActiveTab('guides')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center space-x-1.5 ${
                activeTab === 'guides'
                  ? 'bg-white text-[#050099] shadow-xs font-extrabold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <span>가이드라인 & 평가기준 설정</span>
              <span className="px-1.5 py-0.2 bg-[#050099]/10 text-[#050099] rounded-full text-[10px] font-bold">
                9개 영역
              </span>
            </button>

            <button
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
        </div>
      </div>
    </header>
  );
};
