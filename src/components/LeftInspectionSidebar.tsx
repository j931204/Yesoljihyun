import React from 'react';
import { Check } from 'lucide-react';
import { ContextType, ToneLevel } from '../types';
import { CONTEXTS_CONFIG, TONE_LEVELS_CONFIG } from '../data/defaultGuides';

interface LeftInspectionSidebarProps {
  context: ContextType;
  setContext: (c: ContextType) => void;
  toneLevel: ToneLevel;
  setToneLevel: (t: ToneLevel) => void;
}

export const LeftInspectionSidebar: React.FC<LeftInspectionSidebarProps> = ({
  context,
  setContext,
  toneLevel,
  setToneLevel,
}) => {
  const handleContextChange = (c: ContextType) => {
    setContext(c);
    const defaultTone = CONTEXTS_CONFIG[c]?.defaultToneLevel;
    if (defaultTone) {
      setToneLevel(defaultTone);
    }
  };

  const currentToneMeta = TONE_LEVELS_CONFIG[toneLevel];

  return (
    <div
      id="left-inspection-sidebar"
      className="bg-[#dce5ea] rounded-2xl p-4 sm:p-5 border border-[#c6d3dc] shadow-sm space-y-5"
    >
      {/* 4. 상황 맥락 (Context) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between pb-2.5 border-b border-[#c4d2dc]">
          <span className="text-xs font-bold text-slate-900 flex items-center space-x-2">
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#050099] text-white text-[11px] font-extrabold shadow-xs">
              4
            </span>
            <span className="text-sm font-extrabold text-slate-900 tracking-tight">상황 맥락</span>
          </span>
        </div>

        <div className="space-y-2">
          {(Object.keys(CONTEXTS_CONFIG) as ContextType[]).map((key) => {
            const item = CONTEXTS_CONFIG[key];
            const isSelected = context === key;
            return (
              <button
                key={key}
                type="button"
                id={`sidebar-context-${key}`}
                onClick={() => handleContextChange(key)}
                className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                  isSelected
                    ? 'border-[#050099] bg-white ring-2 ring-[#050099]/30 shadow-xs'
                    : 'bg-white text-slate-900 border-slate-300/90 hover:bg-slate-50 hover:border-slate-400 shadow-2xs'
                }`}
              >
                <div className="flex-1 pr-2">
                  <div
                    className={`text-xs font-bold leading-tight ${
                      isSelected ? 'text-[#050099] font-extrabold' : 'text-slate-900'
                    }`}
                  >
                    {item.title}
                  </div>
                  <div
                    className={`text-[11px] leading-tight mt-1 ${
                      isSelected ? 'text-slate-700 font-medium' : 'text-slate-600'
                    }`}
                  >
                    {item.description}
                  </div>
                </div>
                {isSelected && (
                  <div className="w-5 h-5 rounded-full bg-[#050099] text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. 톤 레벨 (Tone Level) */}
      <div className="space-y-3 pt-3 border-t border-[#c4d2dc]">
        <div className="flex items-center justify-between pb-2.5 border-b border-[#c4d2dc]">
          <span className="text-xs font-bold text-slate-900 flex items-center space-x-2">
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#050099] text-white text-[11px] font-extrabold shadow-xs">
              5
            </span>
            <span className="text-sm font-extrabold text-slate-900 tracking-tight">톤 레벨</span>
          </span>
        </div>

        <div className="space-y-2">
          {([1, 2, 3, 4] as ToneLevel[]).map((lvl) => {
            const isSelected = toneLevel === lvl;
            const meta = TONE_LEVELS_CONFIG[lvl];
            return (
              <button
                key={lvl}
                type="button"
                id={`sidebar-tone-${lvl}`}
                onClick={() => setToneLevel(lvl)}
                className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                  isSelected
                    ? 'border-[#050099] bg-white ring-2 ring-[#050099]/30 shadow-xs'
                    : 'bg-white text-slate-900 border-slate-300/90 hover:bg-slate-50 hover:border-slate-400 shadow-2xs'
                }`}
              >
                <div className="flex-1 pr-2">
                  <div
                    className={`text-xs font-bold leading-tight ${
                      isSelected ? 'text-[#050099] font-extrabold' : 'text-slate-900'
                    }`}
                  >
                    {meta?.name}
                  </div>
                  <div
                    className={`text-[11px] leading-tight mt-1 ${
                      isSelected ? 'text-slate-700 font-medium' : 'text-slate-600'
                    }`}
                  >
                    {meta?.description}
                  </div>
                </div>
                {isSelected && (
                  <div className="w-5 h-5 rounded-full bg-[#050099] text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Selected Tone Guide Preview Box */}
        <div className="p-3.5 bg-white rounded-xl border border-[#c6d3dc] text-xs space-y-1.5 shadow-xs">
          <div className="font-extrabold text-[#050099] text-xs flex items-center space-x-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#050099]"></span>
            <span>선택된 톤 가이드라인 예시</span>
          </div>
          <div className="text-xs text-slate-800 leading-relaxed font-semibold bg-slate-50/80 p-2 rounded-lg border border-slate-200/80">
            "{currentToneMeta?.example}"
          </div>
        </div>
      </div>
    </div>
  );
};
