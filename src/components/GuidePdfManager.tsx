import React, { useState } from 'react';
import {
  FileText,
  Upload,
  CheckCircle2,
  AlertCircle,
  Layers,
  Sparkles,
  Search,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  Tag,
  Clock,
  ExternalLink,
  ChevronRight,
  Filter,
  RefreshCw,
  Plus,
  Trash2,
  Sliders,
  Check,
} from 'lucide-react';
import {
  UploadedGuideVersion,
  UIComponentType,
  ServiceType,
  PlatformType,
} from '../types';

interface GuidePdfManagerProps {
  guideVersions: UploadedGuideVersion[];
  activeGuide: UploadedGuideVersion;
  onSelectActiveGuide: (id: string) => void;
  onDeleteGuideVersion?: (id: string) => void;
  onOpenUploadModal: () => void;
  onApplyPresetToInspection?: (comp: UIComponentType, text: string) => void;
}

export const GuidePdfManager: React.FC<GuidePdfManagerProps> = ({
  guideVersions,
  activeGuide,
  onSelectActiveGuide,
  onDeleteGuideVersion,
  onOpenUploadModal,
  onApplyPresetToInspection,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'rules' | 'tone' | 'terms' | 'pages' | 'versions'>('rules');
  const [selectedCompFilter, setSelectedCompFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredRules = activeGuide.extractedRules.componentRules.filter((r) => {
    const matchesComp = selectedCompFilter === 'all' || r.componentType === selectedCompFilter;
    const matchesSearch =
      r.ruleId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.badExample.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.goodExample.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesComp && matchesSearch;
  });

  const filteredTerms = activeGuide.extractedRules.terminology.filter((t) => {
    return (
      t.prohibited.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.recommended.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.reason.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div className="space-y-6">
      {/* 1. Top Hero Card: Active Guide PDF Overview */}
      <div className="bg-slate-900 rounded-3xl p-6 sm:p-7 text-white shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-gradient-to-l from-[#050099]/30 to-transparent pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-blue-500/20 text-blue-300 border border-blue-400/30 flex items-center space-x-1.5">
                <FileText className="w-3.5 h-3.5 text-blue-400" />
                <span>언어 가이드 PDF 기반 검수 엔진</span>
              </span>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                현재 적용 중: {activeGuide.version}
              </span>
              <span className="text-xs text-slate-400">
                {activeGuide.pageCount} Pages · 배포일 {activeGuide.uploadedAt}
              </span>
            </div>

            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white">
                {activeGuide.title}
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-3xl leading-relaxed">
                언어가이드는 사내에서 PDF로 배포 및 지속적으로 업데이트되는 공식 표준입니다.
                현재 배포본인 <strong className="text-white font-bold">{activeGuide.version}</strong>의 핵심 9대 UI 규정(W-201~W-209), 3단계 톤 체계 및 용어 순화 사전이 모든 문구 검수에 실시간 적용됩니다.
              </p>
            </div>

            {/* Quick Metadata Pill Badges */}
            <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
              <span className="bg-white/10 px-2.5 py-1 rounded-lg text-slate-200">
                총 규정: <strong className="text-white font-bold">{activeGuide.extractedRules.componentRules.length}개</strong>
              </span>
              <span className="bg-white/10 px-2.5 py-1 rounded-lg text-slate-200">
                순화 용어: <strong className="text-white font-bold">{activeGuide.extractedRules.terminology.length}개</strong>
              </span>
              <span className="bg-white/10 px-2.5 py-1 rounded-lg text-slate-200">
                톤 체계: <strong className="text-white font-bold">3단계 (Level 1~3)</strong>
              </span>
              <span className="bg-white/10 px-2.5 py-1 rounded-lg text-slate-200">
                파일명: <strong className="text-white font-bold">{activeGuide.fileName}</strong>
              </span>
            </div>
          </div>

          {/* Action: Upload new version */}
          <div className="shrink-0 flex flex-col sm:flex-row lg:flex-col gap-2">
            <button
              type="button"
              onClick={onOpenUploadModal}
              className="px-5 py-3 rounded-2xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-extrabold text-xs shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer whitespace-nowrap"
            >
              <Upload className="w-4 h-4 text-slate-950" />
              <span>새 가이드 PDF 업로드 & 배포</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('versions')}
              className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs transition-all flex items-center justify-center space-x-1.5 cursor-pointer whitespace-nowrap"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>가이드 버전 이력 ({guideVersions.length}개)</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Sub-Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex items-center space-x-1.5 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
          <button
            type="button"
            onClick={() => setActiveSubTab('rules')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center space-x-1.5 ${
              activeSubTab === 'rules'
                ? 'bg-white text-[#050099] shadow-xs font-extrabold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <span>컴포넌트 규정 (W-201~W-209)</span>
            <span className="px-1.5 py-0.2 bg-[#050099]/10 text-[#050099] rounded-full text-[10px] font-bold">
              {activeGuide.extractedRules.componentRules.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('tone')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeSubTab === 'tone'
                ? 'bg-white text-[#050099] shadow-xs font-extrabold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <span>총칙 & 3단계 톤 체계</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('terms')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center space-x-1.5 ${
              activeSubTab === 'terms'
                ? 'bg-white text-[#050099] shadow-xs font-extrabold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <span>금지어 & 순화 사전</span>
            <span className="px-1.5 py-0.2 bg-slate-200 text-slate-700 rounded-full text-[10px] font-bold">
              {activeGuide.extractedRules.terminology.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('pages')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeSubTab === 'pages'
                ? 'bg-white text-[#050099] shadow-xs font-extrabold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <span>PDF 원문 목차 (9 Pages)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('versions')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeSubTab === 'versions'
                ? 'bg-white text-[#050099] shadow-xs font-extrabold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <span>버전 배포 이력</span>
          </button>
        </div>

        {/* Search Bar for Rules and Terms */}
        {(activeSubTab === 'rules' || activeSubTab === 'terms') && (
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={activeSubTab === 'rules' ? '규정 번호, 컴포넌트 검색...' : '금지어, 권장어 검색...'}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 focus:border-[#050099] focus:ring-1 focus:ring-[#050099] bg-white shadow-2xs"
            />
          </div>
        )}
      </div>

      {/* 3. Sub-Tab Content: 1. Rules (W-201~W-209) */}
      {activeSubTab === 'rules' && (
        <div className="space-y-4">
          {/* Component Filter Buttons */}
          <div className="flex flex-wrap items-center gap-1.5 bg-white p-2 rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-[11px] font-extrabold text-slate-500 mr-2 flex items-center space-x-1">
              <Filter className="w-3 h-3" />
              <span>영역 필터:</span>
            </span>
            {[
              { id: 'all', label: '전체 보기' },
              { id: 'button', label: '버튼 (W-201)' },
              { id: 'popup', label: '팝업/모달 (W-202)' },
              { id: 'toast', label: '토스트 (W-203)' },
              { id: 'general', label: '능동태 (W-204)' },
              { id: 'bottom_sheet', label: '바텀시트 (W-205)' },
              { id: 'label', label: '레이블/태그 (W-206)' },
              { id: 'tooltip', label: '툴팁 (W-207)' },
              { id: 'notice_error', label: '오류안내 (W-208)' },
              { id: 'precaution', label: '유의사항 (W-209)' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedCompFilter(tab.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  selectedCompFilter === tab.id
                    ? 'bg-[#050099] text-white shadow-xs'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Rules Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredRules.map((rule) => (
              <div
                key={rule.ruleId}
                className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-all space-y-3.5 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-0.5 rounded-md bg-[#050099] text-white font-extrabold text-[11px] tracking-wide">
                        {rule.ruleId}
                      </span>
                      <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                        가이드 p.{rule.page}
                      </span>
                    </div>
                    <span className="text-[11px] font-extrabold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                      {rule.limit}
                    </span>
                  </div>

                  <h3 className="text-sm font-extrabold text-slate-900 leading-snug">
                    {rule.title}
                  </h3>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    {rule.description}
                  </p>
                </div>

                {/* Examples */}
                <div className="space-y-1.5 pt-2 border-t border-slate-100">
                  <div className="p-2 rounded-xl bg-rose-50/70 border border-rose-200/80 text-[11px] flex items-center space-x-2">
                    <span className="px-1.5 py-0.5 rounded-md bg-rose-200 text-rose-800 font-extrabold text-[10px] shrink-0">
                      지양 (X)
                    </span>
                    <span className="text-rose-900 font-medium line-through">{rule.badExample}</span>
                  </div>

                  <div className="p-2 rounded-xl bg-emerald-50/70 border border-emerald-200/80 text-[11px] flex items-center space-x-2">
                    <span className="px-1.5 py-0.5 rounded-md bg-emerald-200 text-emerald-800 font-extrabold text-[10px] shrink-0">
                      권장 (O)
                    </span>
                    <span className="text-emerald-950 font-bold">{rule.goodExample}</span>
                  </div>

                  {onApplyPresetToInspection && (
                    <button
                      type="button"
                      onClick={() => onApplyPresetToInspection(rule.componentType, rule.badExample)}
                      className="w-full mt-2 py-1.5 px-3 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 text-[#050099] text-[11px] font-bold transition-all flex items-center justify-center space-x-1 cursor-pointer"
                    >
                      <span>이 규정 위배 사례로 검수 테스트</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Sub-Tab Content: 2. Tone & Principles */}
      {activeSubTab === 'tone' && (
        <div className="space-y-6">
          {/* 5 Core Principles */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
              <span className="w-2.5 h-2.5 rounded-full bg-[#050099]"></span>
              <h3 className="text-sm font-extrabold text-slate-900">
                1장. 고객언어 5대 핵심 기본 원칙 (총칙)
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {activeGuide.extractedRules.generalPrinciples.map((gp) => (
                <div key={gp.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-[#050099]">{gp.id}</span>
                    <span className="text-[11px] font-extrabold text-slate-800">{gp.title}</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed mt-1">
                    {gp.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* 3 Tone Levels */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
              <span className="w-2.5 h-2.5 rounded-full bg-[#050099]"></span>
              <h3 className="text-sm font-extrabold text-slate-900">
                2장. 문체 및 3단계 톤 체계 규정
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {activeGuide.extractedRules.toneLevels.map((tl) => (
                <div key={tl.level} className="p-4 rounded-xl border border-slate-200 bg-white space-y-2.5 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded-md bg-[#050099] text-white font-extrabold text-xs">
                      Level {tl.level}
                    </span>
                    <span className="text-[11px] font-bold text-slate-500">
                      {tl.pattern}
                    </span>
                  </div>

                  <h4 className="text-xs font-extrabold text-slate-900">{tl.name}</h4>
                  <p className="text-[11px] text-slate-600 leading-relaxed">{tl.desc}</p>

                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-800 font-medium">
                    종결 패턴: <strong className="text-[#050099]">{tl.pattern}</strong>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 3. Sub-Tab Content: 3. Terms */}
      {activeSubTab === 'terms' && (
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#050099]"></span>
              <h3 className="text-sm font-extrabold text-slate-900">
                4장. 금지 표현 및 표준 고객언어 순화 사전 ({filteredTerms.length}건)
              </h3>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-extrabold border-b border-slate-200">
                  <th className="p-3 rounded-l-xl">구분</th>
                  <th className="p-3 text-rose-700">지양 표현 (금지)</th>
                  <th className="p-3 text-emerald-700">권장 표현 (표준)</th>
                  <th className="p-3 rounded-r-xl">가이드 개정 및 순화 사유</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTerms.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-bold text-slate-500">
                      <span className="px-2 py-0.5 rounded-md bg-slate-200 text-slate-700 text-[10px]">
                        {t.category}
                      </span>
                    </td>
                    <td className="p-3 font-bold text-rose-600 line-through">
                      {t.prohibited}
                    </td>
                    <td className="p-3 font-extrabold text-emerald-700">
                      {t.recommended}
                    </td>
                    <td className="p-3 text-slate-600 text-[11px]">
                      {t.reason}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. Sub-Tab Content: 4. PDF Pages Overview (9 Pages) */}
      {activeSubTab === 'pages' && (
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#050099]"></span>
              <h3 className="text-sm font-extrabold text-slate-900">
                업로드된 가이드 PDF 문서 상세 구조 ({activeGuide.pageCount} Pages)
              </h3>
            </div>
            <span className="text-xs text-slate-500 font-semibold">{activeGuide.fileName}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              { page: 1, title: '표지 및 개정 이력', desc: '문서 제목, 버전(v0.3), 배포 목적 및 승인자' },
              { page: 2, title: '총칙 및 5대 핵심 가치', desc: '명확성, 간결성, 직관성, 일관성, 고객 중심 (W-101~W-105)' },
              { page: 3, title: '문체 및 3단계 톤 체계', desc: 'Level 1(격식체), Level 2(친절 표준 해요체), Level 3(직관 명사형)' },
              { page: 4, title: '[W-201] 버튼 글자수 및 명사형 규정', desc: 'Primary 4자 이내, CTA 12자 이내, "~하기" 금지 원칙' },
              { page: 5, title: '[W-202] 팝업 & [W-203] 토스트 규정', desc: '팝업 두괄식 해결책 3줄 이내, 토스트 25자 1줄 엄수' },
              { page: 6, title: '[W-204] 서비스 능동태 & [W-205] 바텀시트', desc: '불필요한 피동/사동 지양, 바텀시트 18자 단일 행동' },
              { page: 7, title: '[W-206] 레이블 & [W-207] 툴팁 규정', desc: '레이블 2~6자 단일 명사, 툴팁 쉬운 일상어 풀이 40자' },
              { page: 8, title: '[W-208] 오류 안내 & [W-209] 유의사항', desc: '에러코드 은폐 및 고객 행동 제시, 유의사항 불릿 분할' },
              { page: 9, title: '금지 표현 & 용어 순화 사전', desc: '어려운 한자어, 외래어, 이중피동 문법 오류 교정 매핑' },
            ].map((p) => (
              <div key={p.page} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="w-5 h-5 rounded-md bg-[#050099] text-white text-[11px] font-extrabold flex items-center justify-center shrink-0">
                    p.{p.page}
                  </span>
                  <span className="text-xs font-bold text-slate-900">{p.title}</span>
                </div>
                <p className="text-[11px] text-slate-600 pl-7 leading-tight">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Sub-Tab Content: 5. Versions History & Management */}
      {activeSubTab === 'versions' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center space-x-2">
              <Clock className="w-4 h-4 text-[#050099]" />
              <span>배포된 가이드 PDF 버전 이력 ({guideVersions.length}개)</span>
            </h3>

            <button
              type="button"
              onClick={onOpenUploadModal}
              className="px-3.5 py-1.5 rounded-xl bg-[#050099] hover:bg-[#040080] text-white text-xs font-bold transition-all flex items-center space-x-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>새 버전 업로드</span>
            </button>
          </div>

          <div className="space-y-3">
            {guideVersions.map((v) => {
              const isCurrent = v.id === activeGuide.id;
              return (
                <div
                  key={v.id}
                  className={`p-5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    isCurrent
                      ? 'bg-blue-50/50 border-[#050099] ring-2 ring-[#050099]/20 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center space-x-2.5">
                      <span className="text-sm font-extrabold text-slate-900">{v.title}</span>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-slate-100 text-slate-800">
                        {v.version}
                      </span>
                      {isCurrent && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-emerald-500 text-white flex items-center space-x-1">
                          <Check className="w-3 h-3 stroke-[3]" />
                          <span>현재 검수 적용 중</span>
                        </span>
                      )}
                      {v.isInitialVersion && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-200 text-slate-700">
                          1차 버전
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-600 leading-tight">{v.summary}</p>
                    {v.changelog && (
                      <p className="text-[11px] text-slate-500 leading-tight">
                        <strong>개정 사항:</strong> {v.changelog}
                      </p>
                    )}

                    <div className="text-[11px] text-slate-400">
                      파일명: {v.fileName} · 배포일: {v.uploadedAt} · {v.pageCount} Pages
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    {!isCurrent && (
                      <button
                        type="button"
                        onClick={() => onSelectActiveGuide(v.id)}
                        className="px-4 py-2 rounded-xl bg-white border border-slate-300 hover:border-[#050099] text-[#050099] text-xs font-bold transition-all cursor-pointer shadow-2xs hover:bg-[#050099] hover:text-white"
                      >
                        이 버전으로 적용하기
                      </button>
                    )}

                    {!v.isInitialVersion && onDeleteGuideVersion && (
                      <button
                        type="button"
                        onClick={() => onDeleteGuideVersion(v.id)}
                        className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 border border-slate-200 transition-all cursor-pointer"
                        title="버전 삭제"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
