import React from 'react';
import {
  Building,
  Tv,
  ShoppingBag,
  Building2,
  Sliders,
  MonitorPlay,
  Laptop,
  Smartphone,
  Info,
  AlertTriangle,
  Sparkles,
  HelpCircle,
  Inbox,
  Volume2,
  Settings2,
  Type,
  AlignLeft,
} from 'lucide-react';
import {
  ServiceType,
  PlatformType,
  ContextType,
  ToneLevel,
  UIComponentType,
  ComponentGuideRule,
} from '../types';
import {
  SERVICES_CONFIG,
  PLATFORMS_CONFIG,
  CONTEXTS_CONFIG,
  TONE_LEVELS_CONFIG,
  DEFAULT_COMPONENT_GUIDES,
} from '../data/defaultGuides';

interface CompactInspectionConfigProps {
  service: ServiceType;
  setService: (s: ServiceType) => void;
  platform: PlatformType;
  setPlatform: (p: PlatformType) => void;
  componentType: UIComponentType;
  setComponentType: (c: UIComponentType) => void;
  context: ContextType;
  setContext: (c: ContextType) => void;
  toneLevel: ToneLevel;
  setToneLevel: (t: ToneLevel) => void;
  componentGuides?: Record<UIComponentType, ComponentGuideRule>;
  onOpenGuideEditor?: () => void;
}

export const CompactInspectionConfig: React.FC<CompactInspectionConfigProps> = ({
  service,
  setService,
  platform,
  setPlatform,
  componentType,
  setComponentType,
  context,
  setContext,
  toneLevel,
  setToneLevel,
  componentGuides,
  onOpenGuideEditor,
}) => {
  const getServiceIcon = (id: ServiceType) => {
    switch (id) {
      case 'banking':
        return <Building className="w-3.5 h-3.5" />;
      case 'broadcast':
        return <Tv className="w-3.5 h-3.5" />;
      case 'commerce':
        return <ShoppingBag className="w-3.5 h-3.5" />;
      case 'intro':
        return <Building2 className="w-3.5 h-3.5" />;
      case 'custom':
        return <Sliders className="w-3.5 h-3.5" />;
    }
  };

  const getPlatformIcon = (id: PlatformType) => {
    switch (id) {
      case 'tv':
        return <MonitorPlay className="w-3.5 h-3.5" />;
      case 'pc':
        return <Laptop className="w-3.5 h-3.5" />;
      case 'mobile':
        return <Smartphone className="w-3.5 h-3.5" />;
    }
  };

  const getContextIcon = (id: ContextType) => {
    switch (id) {
      case 'guide':
        return <Info className="w-3.5 h-3.5" />;
      case 'error':
        return <AlertTriangle className="w-3.5 h-3.5" />;
      case 'promotion':
        return <Sparkles className="w-3.5 h-3.5" />;
      case 'confirmation':
        return <HelpCircle className="w-3.5 h-3.5" />;
      case 'empty':
        return <Inbox className="w-3.5 h-3.5" />;
    }
  };

  const handleContextChange = (c: ContextType) => {
    setContext(c);
    const defaultTone = CONTEXTS_CONFIG[c]?.defaultToneLevel;
    if (defaultTone) {
      setToneLevel(defaultTone);
    }
  };

  const activeGuide =
    (componentGuides && componentGuides[componentType]) ||
    DEFAULT_COMPONENT_GUIDES[componentType] ||
    DEFAULT_COMPONENT_GUIDES.button;

  const currentToneMeta = TONE_LEVELS_CONFIG[toneLevel];

  const COMPONENT_LIST: Array<{ id: UIComponentType; label: string }> = [
    { id: 'button', label: '버튼 (4자 원칙)' },
    { id: 'bottom_sheet', label: '바텀시트' },
    { id: 'popup', label: '팝업/모달' },
    { id: 'label', label: '레이블/태그' },
    { id: 'tooltip', label: '툴팁' },
    { id: 'textfield', label: '텍스트 필드' },
    { id: 'toast', label: '토스트 (1줄)' },
    { id: 'notice_error', label: '헤드/오류메시지' },
    { id: 'precaution', label: '유의사항' },
  ];

  return (
    <div
      id="compact-inspection-config-bar"
      className="bg-slate-900/95 text-slate-100 rounded-2xl p-3.5 sm:p-4 border border-slate-800 shadow-md backdrop-blur-md space-y-3"
    >
      {/* 1st Row: Service & UI Component (Area) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        {/* Service Selector (5 cols) */}
        <div className="lg:col-span-5 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-300 flex items-center space-x-1.5">
              <span className="flex items-center justify-center w-4 h-4 rounded-full bg-[#050099] text-white text-[10px] font-bold">
                1
              </span>
              <span>서비스 선택</span>
            </span>
            <span className="text-[10px] text-blue-200 bg-[#050099]/40 px-1.5 py-0.5 rounded border border-[#050099]/60 font-medium">
              {SERVICES_CONFIG[service]?.badge || 'Service'}
            </span>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-5 gap-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800">
            {(Object.keys(SERVICES_CONFIG) as ServiceType[]).map((key) => {
              const item = SERVICES_CONFIG[key];
              const isSelected = service === key;
              return (
                <button
                  key={key}
                  type="button"
                  id={`compact-service-${key}`}
                  onClick={() => setService(key)}
                  className={`flex items-center justify-center space-x-1 py-1.5 px-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer truncate ${
                    isSelected
                      ? 'bg-[#050099] text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                  title={item.title}
                >
                  {getServiceIcon(key)}
                  <span className="truncate">
                    {key === 'banking'
                      ? '금융/뱅킹'
                      : key === 'broadcast'
                      ? '방송'
                      : key === 'commerce'
                      ? '커머스'
                      : key === 'intro'
                      ? '소개/CS'
                      : '직접정의'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* UI Component (Area) Selector (7 cols) - 표준 9대 영역 */}
        <div className="lg:col-span-7 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-300 flex items-center space-x-1.5">
              <span className="flex items-center justify-center w-4 h-4 rounded-full bg-[#050099] text-white text-[10px] font-bold">
                2
              </span>
              <span>UI 영역 / 콘텐츠 유형 (표준 가이드)</span>
            </span>
            {onOpenGuideEditor && (
              <button
                type="button"
                id="btn-quick-open-guide-editor"
                onClick={onOpenGuideEditor}
                className="text-[10px] text-blue-300 hover:text-blue-200 font-semibold flex items-center space-x-1 cursor-pointer transition-all"
              >
                <Settings2 className="w-3 h-3" />
                <span>가이드라인 기준 편집 ⚙️</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800 overflow-x-auto">
            {COMPONENT_LIST.map((item) => {
              const isSelected = componentType === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  id={`compact-comp-${item.id}`}
                  onClick={() => setComponentType(item.id)}
                  className={`py-1.5 px-1 rounded-lg text-xs font-semibold transition-all cursor-pointer text-center truncate ${
                    isSelected
                      ? 'bg-[#050099] text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                  title={item.label}
                >
                  <span className="truncate">{item.label.split(' ')[0]}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2nd Row: Platform, Context, Tone Level & Active Guide Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
        {/* Platform Selector */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-300 flex items-center space-x-1.5">
              <span className="flex items-center justify-center w-4 h-4 rounded-full bg-[#050099] text-white text-[10px] font-bold">
                3
              </span>
              <span>플랫폼 (디바이스)</span>
            </span>
          </div>

          <div className="grid grid-cols-3 gap-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800">
            {(Object.keys(PLATFORMS_CONFIG) as PlatformType[]).map((key) => {
              const item = PLATFORMS_CONFIG[key];
              const isSelected = platform === key;
              return (
                <button
                  key={key}
                  type="button"
                  id={`compact-platform-${key}`}
                  onClick={() => setPlatform(key)}
                  className={`flex items-center justify-center space-x-1 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer truncate ${
                    isSelected
                      ? 'bg-[#050099] text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                  title={item.title}
                >
                  {getPlatformIcon(key)}
                  <span className="truncate">{item.title}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Context Selector */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-300 flex items-center space-x-1.5">
              <span className="flex items-center justify-center w-4 h-4 rounded-full bg-[#050099] text-white text-[10px] font-bold">
                4
              </span>
              <span>상황 맥락</span>
            </span>
          </div>

          <div className="grid grid-cols-5 gap-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800">
            {(Object.keys(CONTEXTS_CONFIG) as ContextType[]).map((key) => {
              const item = CONTEXTS_CONFIG[key];
              const isSelected = context === key;
              return (
                <button
                  key={key}
                  type="button"
                  id={`compact-context-${key}`}
                  onClick={() => handleContextChange(key)}
                  className={`flex items-center justify-center py-1.5 px-1 rounded-lg text-xs font-semibold transition-all cursor-pointer truncate ${
                    isSelected
                      ? 'bg-[#050099] text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                  title={item.title}
                >
                  {getContextIcon(key)}
                  <span className="ml-1 text-[11px] truncate">
                    {key === 'guide'
                      ? '안내'
                      : key === 'error'
                      ? '에러'
                      : key === 'promotion'
                      ? '프로모'
                      : key === 'confirmation'
                      ? '확인'
                      : '빈화면'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tone Level */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-300 flex items-center space-x-1.5">
              <span className="flex items-center justify-center w-4 h-4 rounded-full bg-[#050099] text-white text-[10px] font-bold">
                5
              </span>
              <span>톤 레벨</span>
            </span>
          </div>

          <div className="grid grid-cols-4 gap-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800">
            {([1, 2, 3, 4] as ToneLevel[]).map((lvl) => {
              const isSelected = toneLevel === lvl;
              return (
                <button
                  key={lvl}
                  type="button"
                  id={`compact-tone-level-${lvl}`}
                  onClick={() => setToneLevel(lvl)}
                  className={`py-1.5 px-1 rounded-lg text-center transition-all cursor-pointer truncate ${
                    isSelected
                      ? 'bg-[#050099] text-white shadow-xs font-bold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 text-xs'
                  }`}
                  title={TONE_LEVELS_CONFIG[lvl]?.name}
                >
                  <span className="text-[11px]">
                    L{lvl} {lvl === 1 ? '격식' : lvl === 2 ? '해요' : lvl === 3 ? '간결' : '공감'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Active Component Evaluation Rule Summary Banner */}
      <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-bold text-blue-200 bg-[#050099]/40 px-2 py-0.5 rounded border border-[#050099]/60">
            [{activeGuide.title}] 적용 기준:
          </span>
          <span className="flex items-center space-x-1 text-slate-300">
            <Type className="w-3.5 h-3.5 text-blue-300" />
            <span className="font-semibold text-white">최적 글자수:</span>
            <span>{activeGuide.charLimitRule.unitDescription}</span>
          </span>
          <span className="text-slate-600 hidden sm:inline">|</span>
          <span className="flex items-center space-x-1 text-slate-300">
            <AlignLeft className="w-3.5 h-3.5 text-blue-300" />
            <span className="font-semibold text-white">말투 기준:</span>
            <span className="text-amber-300 font-medium">{activeGuide.toneEndingRule.preferredForm}</span>
          </span>
        </div>

        {onOpenGuideEditor && (
          <button
            type="button"
            onClick={onOpenGuideEditor}
            className="text-[11px] text-blue-300 hover:text-white underline cursor-pointer shrink-0 font-medium"
          >
            가이드 상세 보기 &gt;
          </button>
        )}
      </div>
    </div>
  );
};
