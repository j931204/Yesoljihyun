import React from 'react';
import {
  ServiceType,
  PlatformType,
  UIComponentType,
  ComponentGuideRule,
} from '../types';
import {
  SERVICES_CONFIG,
  PLATFORMS_CONFIG,
  DEFAULT_COMPONENT_GUIDES,
} from '../data/defaultGuides';

interface TopInspectionConfigProps {
  service: ServiceType;
  setService: (s: ServiceType) => void;
  platform: PlatformType;
  setPlatform: (p: PlatformType) => void;
  componentType: UIComponentType;
  setComponentType: (c: UIComponentType) => void;
  componentGuides?: Record<UIComponentType, ComponentGuideRule>;
  onOpenGuideEditor?: () => void;
}

export const TopInspectionConfig: React.FC<TopInspectionConfigProps> = ({
  service,
  setService,
  platform,
  setPlatform,
  componentType,
  setComponentType,
  componentGuides,
  onOpenGuideEditor,
}) => {
  const activeGuide =
    (componentGuides && componentGuides[componentType]) ||
    DEFAULT_COMPONENT_GUIDES[componentType] ||
    DEFAULT_COMPONENT_GUIDES.button;

  const COMPONENT_LIST: Array<{ id: UIComponentType; label: string; desc: string }> = [
    { id: 'button', label: '버튼', desc: 'Single 4자' },
    { id: 'bottom_sheet', label: '바텀시트', desc: '단일행동' },
    { id: 'popup', label: '팝업/모달', desc: '핵심안내' },
    { id: 'label', label: '레이블/태그', desc: '명사형' },
    { id: 'tooltip', label: '툴팁', desc: '보조설명' },
    { id: 'textfield', label: '텍스트필드', desc: '플레이스홀더' },
    { id: 'toast', label: '토스트', desc: '1줄 이내' },
    { id: 'notice_error', label: '오류/헤드', desc: '원인+해결' },
    { id: 'precaution', label: '유의사항', desc: '제약조건' },
  ];

  return (
    <div
      id="top-inspection-config-bar"
      className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm space-y-4"
    >
      {/* 3 Main Horizontal Modules: 1. Service, 2. UI Component Area, 3. Platform */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* 1. 서비스 선택 (4 cols) */}
        <div className="lg:col-span-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#050099] text-white text-[11px] font-extrabold shadow-xs">
                1
              </span>
              <span className="text-sm font-extrabold text-slate-900">서비스 선택</span>
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
            {(Object.keys(SERVICES_CONFIG) as ServiceType[]).map((key) => {
              const item = SERVICES_CONFIG[key];
              const isSelected = service === key;
              return (
                <button
                  key={key}
                  type="button"
                  id={`top-service-${key}`}
                  onClick={() => setService(key)}
                  className={`flex items-center justify-center py-2 px-1 rounded-lg text-xs font-bold transition-all cursor-pointer text-center leading-tight break-keep ${
                    isSelected
                      ? 'bg-[#050099] text-white shadow-sm ring-2 ring-[#050099]/30'
                      : 'bg-white text-slate-800 border border-slate-200/80 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                  title={item.title}
                >
                  <span className="break-keep">
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

        {/* 2. UI 영역 선택 (9대 컴포넌트) (5 cols) */}
        <div className="lg:col-span-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#050099] text-white text-[11px] font-extrabold shadow-xs">
                2
              </span>
              <span className="text-sm font-extrabold text-slate-900">UI 영역 선택 (표준 9개)</span>
            </span>
            {onOpenGuideEditor && (
              <button
                type="button"
                id="btn-top-open-guide-editor"
                onClick={onOpenGuideEditor}
                className="text-[11px] text-[#050099] hover:text-[#040080] font-bold cursor-pointer transition-all hover:underline"
              >
                가이드 기준 편집 &gt;
              </button>
            )}
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-5 xl:grid-cols-9 gap-1.5 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
            {COMPONENT_LIST.map((item) => {
              const isSelected = componentType === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  id={`top-comp-${item.id}`}
                  onClick={() => setComponentType(item.id)}
                  className={`py-2 px-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex flex-col items-center justify-center text-center ${
                    isSelected
                      ? 'bg-[#050099] text-white shadow-sm ring-2 ring-[#050099]/30'
                      : 'bg-white text-slate-800 border border-slate-200/80 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                  title={`${item.label} (${item.desc})`}
                >
                  <span className="text-[11px] font-bold leading-tight break-keep">{item.label}</span>
                  <span
                    className={`text-[9.5px] leading-tight font-medium mt-0.5 break-keep ${
                      isSelected ? 'text-blue-100' : 'text-slate-500'
                    }`}
                  >
                    {item.desc}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. 플랫폼 선택 (3 cols) */}
        <div className="lg:col-span-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#050099] text-white text-[11px] font-extrabold shadow-xs">
                3
              </span>
              <span className="text-sm font-extrabold text-slate-900">플랫폼 선택</span>
            </span>
          </div>

          <div className="grid grid-cols-3 gap-1.5 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
            {(Object.keys(PLATFORMS_CONFIG) as PlatformType[]).map((key) => {
              const item = PLATFORMS_CONFIG[key];
              const isSelected = platform === key;
              return (
                <button
                  key={key}
                  type="button"
                  id={`top-platform-${key}`}
                  onClick={() => setPlatform(key)}
                  className={`flex items-center justify-center py-2.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    isSelected
                      ? 'bg-[#050099] text-white shadow-sm ring-2 ring-[#050099]/30'
                      : 'bg-white text-slate-800 border border-slate-200/80 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                  title={item.title}
                >
                  <span>{item.title}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
