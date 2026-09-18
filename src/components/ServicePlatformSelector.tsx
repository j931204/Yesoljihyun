import React from 'react';
import { Tv, ShoppingBag, Building2, MonitorPlay, Laptop, Smartphone, HelpCircle, Check, Sparkles } from 'lucide-react';
import { ServiceType, PlatformType } from '../types';
import { SERVICES_CONFIG, PLATFORMS_CONFIG } from '../data/defaultGuides';

interface ServicePlatformSelectorProps {
  service: ServiceType;
  setService: (s: ServiceType) => void;
  platform: PlatformType;
  setPlatform: (p: PlatformType) => void;
}

export const ServicePlatformSelector: React.FC<ServicePlatformSelectorProps> = ({
  service,
  setService,
  platform,
  setPlatform,
}) => {
  const getServiceIcon = (id: ServiceType) => {
    switch (id) {
      case 'broadcast':
        return <Tv className="w-5 h-5 text-indigo-600" />;
      case 'commerce':
        return <ShoppingBag className="w-5 h-5 text-emerald-600" />;
      case 'intro':
        return <Building2 className="w-5 h-5 text-blue-600" />;
    }
  };

  const getPlatformIcon = (id: PlatformType) => {
    switch (id) {
      case 'tv':
        return <MonitorPlay className="w-5 h-5 text-purple-600" />;
      case 'pc':
        return <Laptop className="w-5 h-5 text-sky-600" />;
      case 'mobile':
        return <Smartphone className="w-5 h-5 text-rose-600" />;
    }
  };

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-5">
      {/* 1. Service Selection */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#050099] text-white text-xs font-bold">
              1
            </span>
            <label className="text-sm font-bold text-slate-900">
              서비스 유형 선택
            </label>
            <span className="text-xs text-slate-500">
              (도메인 특화 용어 및 비즈니스 목표 기준)
            </span>
          </div>
          <span className="text-xs font-medium text-[#050099] bg-[#050099]/10 px-2 py-0.5 rounded-md border border-[#050099]/20">
            {SERVICES_CONFIG[service]?.badge}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {(Object.keys(SERVICES_CONFIG) as ServiceType[]).map((key) => {
            const item = SERVICES_CONFIG[key];
            const isSelected = service === key;
            return (
              <button
                key={key}
                type="button"
                id={`service-select-${key}`}
                onClick={() => setService(key)}
                className={`relative flex flex-col items-start p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'border-[#050099] bg-[#050099]/5 ring-2 ring-[#050099]/20 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/70'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-2">
                  <div className="flex items-center space-x-2">
                    <div className="p-1.5 rounded-lg bg-slate-100/80">
                      {getServiceIcon(key)}
                    </div>
                    <span className="text-sm font-bold text-slate-900">
                      {item.title}
                    </span>
                  </div>
                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-[#050099] text-white flex items-center justify-center">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  )}
                </div>

                <p className="text-xs font-medium text-[#050099] mb-1">
                  {item.subtitle}
                </p>
                <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                  {item.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-slate-100" />

      {/* 2. Platform Selection */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#050099] text-white text-xs font-bold">
              2
            </span>
            <label className="text-sm font-bold text-slate-900">
              플랫폼 (디바이스) 선택
            </label>
            <span className="text-xs text-slate-500">
              (조작 방식 & 시인성 및 길이 제약 기준)
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {(Object.keys(PLATFORMS_CONFIG) as PlatformType[]).map((key) => {
            const item = PLATFORMS_CONFIG[key];
            const isSelected = platform === key;
            return (
              <button
                key={key}
                type="button"
                id={`platform-select-${key}`}
                onClick={() => setPlatform(key)}
                className={`relative flex flex-col items-start p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'border-[#050099] bg-[#050099]/5 ring-2 ring-[#050099]/20 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/70'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-2">
                  <div className="flex items-center space-x-2">
                    <div className="p-1.5 rounded-lg bg-slate-100/80">
                      {getPlatformIcon(key)}
                    </div>
                    <span className="text-sm font-bold text-slate-900">
                      {item.title}
                    </span>
                  </div>
                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-[#050099] text-white flex items-center justify-center">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  )}
                </div>

                <p className="text-xs font-medium text-slate-700 mb-1">
                  {item.subtitle}
                </p>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {item.constraints}
                </p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
