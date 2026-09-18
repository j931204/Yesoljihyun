import React from 'react';
import { Sliders, Info, AlertTriangle, Sparkles, HelpCircle, Inbox, Volume2, ShieldCheck, Smile } from 'lucide-react';
import { ContextType, ToneLevel } from '../types';
import { CONTEXTS_CONFIG, TONE_LEVELS_CONFIG } from '../data/defaultGuides';

interface ToneSettingPanelProps {
  context: ContextType;
  setContext: (c: ContextType) => void;
  toneLevel: ToneLevel;
  setToneLevel: (t: ToneLevel) => void;
}

export const ToneSettingPanel: React.FC<ToneSettingPanelProps> = ({
  context,
  setContext,
  toneLevel,
  setToneLevel,
}) => {
  const getContextIcon = (id: ContextType) => {
    switch (id) {
      case 'guide':
        return <Info className="w-4 h-4 text-sky-600" />;
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-rose-600" />;
      case 'promotion':
        return <Sparkles className="w-4 h-4 text-amber-600" />;
      case 'confirmation':
        return <HelpCircle className="w-4 h-4 text-purple-600" />;
      case 'empty':
        return <Inbox className="w-4 h-4 text-slate-600" />;
    }
  };

  const handleContextChange = (c: ContextType) => {
    setContext(c);
    // Suggest default tone level for context if needed
    const defaultTone = CONTEXTS_CONFIG[c]?.defaultToneLevel;
    if (defaultTone) {
      setToneLevel(defaultTone);
    }
  };

  const currentToneMeta = TONE_LEVELS_CONFIG[toneLevel];

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-5">
      {/* Context Selection */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#050099] text-white text-xs font-bold">
              3
            </span>
            <label className="text-sm font-bold text-slate-900">
              상황 맥락 (Context) 선택
            </label>
            <span className="text-xs text-slate-500">
              (동일 서비스 내 화면 목적에 따른 톤 분기)
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {(Object.keys(CONTEXTS_CONFIG) as ContextType[]).map((key) => {
            const item = CONTEXTS_CONFIG[key];
            const isSelected = context === key;
            return (
              <button
                key={key}
                type="button"
                id={`context-select-${key}`}
                onClick={() => handleContextChange(key)}
                className={`flex flex-col items-start p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'border-[#050099] bg-[#050099]/5 ring-2 ring-[#050099]/20 shadow-xs font-medium'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/70'
                }`}
              >
                <div className="flex items-center space-x-1.5 mb-1.5">
                  <div className="p-1 rounded-md bg-slate-100/90">
                    {getContextIcon(key)}
                  </div>
                  <span className="text-xs font-bold text-slate-800">
                    {item.title}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 line-clamp-2 leading-tight">
                  {item.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-slate-100" />

      {/* Tone Strength Slider & Ending Rule Preview */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#050099] text-white text-xs font-bold">
              4
            </span>
            <label className="text-sm font-bold text-slate-900">
              상황별 톤 강도 & 종결어미 레벨
            </label>
          </div>
          <span className="text-xs font-semibold text-[#050099] bg-[#050099]/10 px-2.5 py-1 rounded-md border border-[#050099]/20">
            {currentToneMeta.name.split(':')[0]}
          </span>
        </div>

        {/* Level Step Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 mb-4">
          {([1, 2, 3, 4] as ToneLevel[]).map((lvl) => {
            const meta = TONE_LEVELS_CONFIG[lvl];
            const isSelected = toneLevel === lvl;
            return (
              <button
                key={lvl}
                type="button"
                id={`tone-level-btn-${lvl}`}
                onClick={() => setToneLevel(lvl)}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'border-[#050099] bg-[#050099]/10 ring-2 ring-[#050099]/30 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs font-bold ${isSelected ? 'text-[#050099]' : 'text-slate-800'}`}>
                      Level {lvl}
                    </span>
                    {lvl === 1 && <span className="text-[10px] text-slate-500">격식체</span>}
                    {lvl === 2 && <span className="text-[10px] text-[#050099] font-medium">표준 해요체</span>}
                    {lvl === 3 && <span className="text-[10px] text-emerald-600 font-medium">직관·간결형</span>}
                    {lvl === 4 && <span className="text-[10px] text-amber-600 font-medium">친근·공감형</span>}
                  </div>
                  <p className="text-[11px] text-slate-500 leading-tight mb-2">
                    {meta.description}
                  </p>
                </div>
                <div className="pt-2 border-t border-slate-100">
                  <span className="inline-block text-[10px] text-[#050099] bg-white px-1.5 py-0.5 rounded border border-[#050099]/20 font-mono">
                    {meta.endingPattern.split(',')[0]}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Live Tone Sample Card */}
        <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200/80 flex items-start space-x-3">
          <div className="p-2 rounded-lg bg-white border border-slate-200 text-[#050099] shrink-0">
            <Volume2 className="w-4 h-4" />
          </div>
          <div className="text-xs space-y-1">
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-slate-800">
                선택된 톤 레벨 예시 ({currentToneMeta.name.split(':')[0]})
              </span>
              <span className="text-[11px] text-slate-500 font-mono">
                종결어미: {currentToneMeta.endingPattern}
              </span>
            </div>
            <p className="text-slate-700 font-medium bg-white px-3 py-1.5 rounded-lg border border-slate-200/70 inline-block">
              "{currentToneMeta.example}"
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
