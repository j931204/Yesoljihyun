import React from 'react';
import { Check } from 'lucide-react';

interface GuidewordHeroStepsProps {
  guideVersion?: string;
}

export const GuidewordHeroSteps: React.FC<GuidewordHeroStepsProps> = ({ guideVersion = 'v0.3' }) => {
  return (
    <div className="space-y-6">
      {/* 1. Top 3 Step Indicator Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Step 1: 가이드 업로드 */}
        <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex items-center space-x-3">
          <div className="w-6 h-6 rounded-full bg-emerald-100/90 text-emerald-800 flex items-center justify-center shrink-0">
            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
          </div>
          <div className="min-w-0">
            <h5 className="text-xs font-bold text-slate-800">가이드 업로드</h5>
            <p className="text-[11px] text-slate-400 truncate mt-0.5">원문 저장 완료 ({guideVersion})</p>
          </div>
        </div>

        {/* Step 2: 규칙·우선관계 분석 */}
        <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex items-center space-x-3">
          <div className="w-6 h-6 rounded-full bg-emerald-100/90 text-emerald-800 flex items-center justify-center shrink-0">
            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
          </div>
          <div className="min-w-0">
            <h5 className="text-xs font-bold text-slate-800">규칙·우선관계 분석</h5>
            <p className="text-[11px] text-slate-400 truncate mt-0.5">전체 원문 분석 완료</p>
          </div>
        </div>

        {/* Step 3: 단어·문장 검수 (Active) */}
        <div className="p-3.5 rounded-2xl bg-white border border-emerald-600/30 bg-emerald-50/20 shadow-2xs flex items-center space-x-3">
          <div className="w-6 h-6 rounded-full border border-emerald-700/40 text-emerald-800 flex items-center justify-center shrink-0 text-xs font-bold">
            3
          </div>
          <div className="min-w-0">
            <h5 className="text-xs font-bold text-slate-900">단어·문장 검수</h5>
            <p className="text-[11px] text-slate-500 truncate mt-0.5">저장한 기준으로 두 가지 제안</p>
          </div>
        </div>
      </div>

      {/* 2. Hero Headline and Quote */}
      <div className="pt-2 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        {/* Left: Main Titles */}
        <div className="space-y-2">
          <span className="text-[11px] font-extrabold tracking-widest text-emerald-800/90 uppercase block">
            WORDS, WITH ONE STANDARD
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-[1.25]">
            우리 가이드로,<br />
            더 일관된 고객의 언어<span className="text-[#1c4a34]">.</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium pt-1">
            검수할 문구를 넣으면, 가이드에 맞는 두 가지 대안과 이유를 제안해요.
          </p>
        </div>

        {/* Right: Editorial Quote Block */}
        <div className="relative pl-6 pr-4 py-2 border-l-2 border-emerald-700/20 max-w-xs shrink-0 self-start lg:self-auto">
          <span className="text-4xl font-serif text-emerald-700/20 absolute -left-2 -top-2 select-none pointer-events-none">
            “
          </span>
          <p className="text-xs text-slate-600 leading-relaxed font-medium">
            기준은 우리 문서에.<br />
            제안은 고객의 언어로.
          </p>
        </div>
      </div>
    </div>
  );
};
