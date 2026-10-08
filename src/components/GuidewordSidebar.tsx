import React from 'react';
import {
  BookOpen,
  Plus,
  ArrowUpRight,
  Tv,
  Laptop,
  Smartphone,
  CheckCircle2,
  ChevronDown,
} from 'lucide-react';
import { ServiceType, PlatformType, UploadedGuideVersion } from '../types';

interface GuidewordSidebarProps {
  activeTab: 'inspect' | 'guides' | 'history';
  setActiveTab: (tab: 'inspect' | 'guides' | 'history') => void;
  service: ServiceType;
  setService: (s: ServiceType) => void;
  platform: PlatformType;
  setPlatform: (p: PlatformType) => void;
  activeGuide: UploadedGuideVersion;
  guidesCount: number;
  historyCount: number;
  rulesCount: number;
  onOpenUploadModal: () => void;
}

export const GuidewordSidebar: React.FC<GuidewordSidebarProps> = ({
  activeTab,
  setActiveTab,
  service,
  setService,
  platform,
  setPlatform,
  activeGuide,
  guidesCount,
  historyCount,
  rulesCount,
  onOpenUploadModal,
}) => {
  // Service configuration definitions (3 primary services as requested)
  const SERVICES = [
    {
      id: 'broadcast' as ServiceType,
      name: '방송 서비스',
      caption: '시청 · VOD · 요금 · 고객지원',
    },
    {
      id: 'commerce' as ServiceType,
      name: '커머스 서비스',
      caption: '쇼핑몰 · 장바구니 · 주문 · 결제',
    },
    {
      id: 'intro' as ServiceType,
      name: '소개형 서비스',
      caption: '고객센터 · 회사소개 · FAQ · 브랜드',
    },
  ];

  // Platform definitions (3 primary platforms as requested)
  const PLATFORMS: Array<{
    id: PlatformType;
    label: string;
    icon: typeof Tv;
    caption: string;
  }> = [
    {
      id: 'tv',
      label: 'TV',
      icon: Tv,
      caption: '리모컨 방향키 기반',
    },
    {
      id: 'pc',
      label: 'PC Web',
      icon: Laptop,
      caption: '마우스·키보드 기반',
    },
    {
      id: 'mobile',
      label: 'Mobile',
      icon: Smartphone,
      caption: '터치 인터랙션 기반',
    },
  ];

  const currentServiceObj = SERVICES.find((s) => s.id === service) || SERVICES[0];
  const currentPlatformObj = PLATFORMS.find((p) => p.id === platform) || PLATFORMS[1];

  return (
    <aside className="w-full md:w-64 lg:w-72 shrink-0 space-y-6">
      {/* 1. WORKSPACE Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <span className="text-[11px] font-bold text-slate-400 tracking-wider">WORKSPACE</span>
          <button
            type="button"
            onClick={onOpenUploadModal}
            className="w-5 h-5 rounded hover:bg-slate-200/80 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
            title="새 언어가이드 등록 / 업로드"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Active Workspace Box */}
        <div className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-700 shrink-0">
            <BookOpen className="w-4 h-4 text-slate-600" />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-xs font-bold text-slate-900 truncate">
              {activeGuide.title || '우리 팀 고객언어 가이드'}
            </h4>
            <p className="text-[11px] text-slate-400 truncate mt-0.5">내가 등록한 작업공간</p>
          </div>
        </div>
      </div>

      {/* 2. Navigation Tabs */}
      <nav className="space-y-1">
        {/* 문구 검수 ↗ (Active tab styling with deep pine green) */}
        <button
          type="button"
          onClick={() => setActiveTab('inspect')}
          className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'inspect'
              ? 'bg-[#1c4a34] text-white shadow-xs'
              : 'text-slate-700 hover:bg-slate-100'
          }`}
        >
          <span className="flex items-center space-x-2">
            <span>문구 검수</span>
          </span>
          <ArrowUpRight className={`w-3.5 h-3.5 ${activeTab === 'inspect' ? 'text-emerald-200' : 'text-slate-400'}`} />
        </button>

        {/* 가이드 문서 */}
        <button
          type="button"
          onClick={() => setActiveTab('guides')}
          className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'guides'
              ? 'bg-slate-100 text-slate-900 font-bold'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <span>가이드 문서</span>
          <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-slate-200/70 text-slate-600">
            {guidesCount}
          </span>
        </button>

        {/* 검수 이력 */}
        <button
          type="button"
          onClick={() => setActiveTab('history')}
          className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'history'
              ? 'bg-slate-100 text-slate-900 font-bold'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <span>검수 이력</span>
          <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-slate-200/70 text-slate-600">
            {historyCount}
          </span>
        </button>
      </nav>

      {/* 3. 검수 환경 (Environment Controls) */}
      <div className="space-y-4 pt-2 border-t border-slate-200/80">
        <div className="text-[11px] font-bold text-slate-400 tracking-wider px-1">검수 환경</div>

        {/* 서비스 유형 Dropdown */}
        <div className="space-y-1.5">
          <label htmlFor="guideword-service-select" className="text-xs font-medium text-slate-600 block px-1">
            서비스 유형
          </label>
          <div className="relative">
            <select
              id="guideword-service-select"
              value={service}
              onChange={(e) => setService(e.target.value as ServiceType)}
              className="w-full appearance-none bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 pr-8 focus:outline-none focus:ring-2 focus:ring-[#1c4a34]/30 focus:border-[#1c4a34] cursor-pointer shadow-2xs"
            >
              {SERVICES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
          <p className="text-[11px] text-slate-400 px-1 truncate">
            {currentServiceObj.caption}
          </p>
        </div>

        {/* 플랫폼 Selector Cards */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-600 block px-1">
            플랫폼
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            {PLATFORMS.map((p) => {
              const Icon = p.icon;
              const isSelected = platform === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  id={`platform-btn-${p.id}`}
                  onClick={() => setPlatform(p.id)}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-[#1c4a34] bg-emerald-50/70 text-[#1c4a34] font-bold shadow-2xs ring-1 ring-[#1c4a34]/20'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Icon className={`w-4 h-4 mb-1.5 ${isSelected ? 'text-[#1c4a34]' : 'text-slate-400'}`} />
                  <span className="text-[11px]">{p.label}</span>
                </button>
              );
            })}
          </div>
          <p className="text-[11px] text-slate-400 px-1 truncate">
            {currentPlatformObj.caption}
          </p>
        </div>
      </div>

      {/* 4. Bottom Rule Status Card */}
      <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 flex items-center justify-between text-xs">
        <div>
          <span className="font-bold text-slate-900 block text-[11.5px]">규칙 분석 완료</span>
          <span className="text-[10.5px] text-slate-500 mt-0.5 block">
            {guidesCount}개 문서 · {rulesCount > 0 ? `${rulesCount}개 원문` : '310개 원문'}
          </span>
        </div>
        <div className="w-5 h-5 rounded-full bg-emerald-600/15 flex items-center justify-center text-emerald-700 shrink-0">
          <CheckCircle2 className="w-4 h-4 text-emerald-700" />
        </div>
      </div>
    </aside>
  );
};
