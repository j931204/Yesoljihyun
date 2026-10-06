import React, { useState, useEffect } from 'react';
import {
  History,
  FileSpreadsheet,
  Download,
  Trash2,
  Eye,
  Calendar,
  Layers,
  Sparkles,
  Search,
  BookOpen,
  CheckCircle2,
  Edit3,
  TrendingUp,
  Tag,
  ShieldCheck,
} from 'lucide-react';
import { InspectionSession } from '../types';
import { exportToExcel, exportToPdf } from '../utils/exportUtils';
import { SERVICES_CONFIG, PLATFORMS_CONFIG, CONTEXTS_CONFIG, TONE_LEVELS_CONFIG } from '../data/defaultGuides';
import {
  getAllCorrectionCases,
  getFrequentlyAppliedRules,
  deleteCorrectionCase,
  PastCorrectionCase,
} from '../lib/storage/correctionHistoryDB';

interface HistoryAndExportViewProps {
  sessions: InspectionSession[];
  onSelectSession: (session: InspectionSession) => void;
  onDeleteSession: (sessionId: string) => void;
  onClearAll: () => void;
}

export const HistoryAndExportView: React.FC<HistoryAndExportViewProps> = ({
  sessions,
  onSelectSession,
  onDeleteSession,
  onClearAll,
}) => {
  const [viewTab, setViewTab] = useState<'sessions' | 'fewshot_bank'>('sessions');
  const [searchTerm, setSearchTerm] = useState('');
  const [pastCases, setPastCases] = useState<PastCorrectionCase[]>([]);
  const [frequentRules, setFrequentRules] = useState<Array<{ rule: string; count: number }>>([]);
  const [isLoadingCases, setIsLoadingCases] = useState(false);

  const loadFewshotData = async () => {
    setIsLoadingCases(true);
    try {
      const cases = await getAllCorrectionCases();
      const rules = await getFrequentlyAppliedRules();
      setPastCases(cases);
      setFrequentRules(rules);
    } catch (err) {
      console.warn('Failed to load past cases:', err);
    } finally {
      setIsLoadingCases(false);
    }
  };

  useEffect(() => {
    if (viewTab === 'fewshot_bank') {
      loadFewshotData();
    }
  }, [viewTab]);

  const handleDeleteCase = async (id: string) => {
    await deleteCorrectionCase(id);
    await loadFewshotData();
  };

  const filteredSessions = sessions.filter((s) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const matchService = SERVICES_CONFIG[s.service]?.title?.toLowerCase().includes(term);
    const matchPlatform = PLATFORMS_CONFIG[s.platform]?.title?.toLowerCase().includes(term);
    const matchText = (s.items || []).some(
      (item) =>
        item.originalText?.toLowerCase().includes(term) ||
        item.alt1?.text?.toLowerCase().includes(term)
    );
    return matchService || matchPlatform || matchText;
  });

  const filteredCases = pastCases.filter((c) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      c.original.toLowerCase().includes(term) ||
      c.finalRevision.toLowerCase().includes(term) ||
      c.appliedRules.some((r) => r.toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#050099]"></span>
            <span>검수 이력 & 사용자 피드백 학습 뱅크</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            과거 검수 기록을 산출물로 내보내거나, 사용자가 채택·수정한 사례(Few-Shot Memory)를 확인할 수 있습니다.
          </p>
        </div>

        {viewTab === 'sessions' && sessions.length > 0 && (
          <button
            type="button"
            onClick={onClearAll}
            className="px-3.5 py-2 rounded-xl text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-all cursor-pointer whitespace-nowrap"
          >
            <span>전체 검수 이력 삭제</span>
          </button>
        )}
      </div>

      {/* View Tabs */}
      <div className="flex items-center p-1 bg-slate-100 rounded-2xl w-full sm:w-fit">
        <button
          type="button"
          onClick={() => setViewTab('sessions')}
          className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center space-x-1.5 ${
            viewTab === 'sessions'
              ? 'bg-[#050099] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>검수 세션 이력 ({sessions.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setViewTab('fewshot_bank')}
          className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center space-x-1.5 ${
            viewTab === 'fewshot_bank'
              ? 'bg-[#050099] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>과거 교정 사례 학습 뱅크 (Few-Shot)</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={
            viewTab === 'sessions'
              ? '검수 문구 내용이나 서비스/플랫폼 이름으로 검색...'
              : '채택 문구, 원문, 또는 적용된 가이드 규칙으로 검색...'
          }
          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 focus:ring-2 focus:ring-[#050099]/20 focus:border-[#050099] shadow-xs"
        />
      </div>

      {/* TAB 1: SESSIONS LIST */}
      {viewTab === 'sessions' && (
        <>
          {filteredSessions.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
              <p className="text-sm font-bold text-slate-700">저장된 검수 이력이 없습니다</p>
              <p className="text-xs text-slate-500">
                문구 검수 스튜디오에서 검수를 실행하면 자동으로 이력이 저장됩니다.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredSessions.map((sess) => {
                const serviceMeta = SERVICES_CONFIG[sess.service];
                const platformMeta = PLATFORMS_CONFIG[sess.platform];
                const contextMeta = CONTEXTS_CONFIG[sess.context];
                const toneMeta = TONE_LEVELS_CONFIG[sess.toneLevel];

                return (
                  <div
                    key={sess.id}
                    className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                  >
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#050099]/10 text-[#050099] border border-[#050099]/20">
                          {serviceMeta?.title}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
                          {platformMeta?.title}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700">
                          {contextMeta?.title}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700">
                          Level {sess.toneLevel}
                        </span>
                        <span className="text-[11px] text-slate-400 ml-1">
                          {new Date(sess.timestamp).toLocaleString('ko-KR')}
                        </span>
                      </div>

                      {/* Snippet of original text */}
                      <div className="text-xs text-slate-800 space-y-1">
                        <p className="font-semibold text-slate-900 line-clamp-1">
                          대표 문구: "{sess.items[0]?.originalText}"
                        </p>
                        <p className="text-[#050099] font-medium line-clamp-1">
                          추천 대안: "{sess.items[0]?.alt1.text}"
                        </p>
                      </div>

                      <div className="text-[11px] text-slate-500">
                        검수 문구 수: <strong className="text-slate-800">{sess.items.length}개</strong>
                        {sess.overallSummary && (
                          <span className="ml-2 text-slate-400 line-clamp-1">
                            · {sess.overallSummary}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-2 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                      <button
                        type="button"
                        onClick={() => onSelectSession(sess)}
                        className="px-3.5 py-2 rounded-xl bg-[#050099] hover:bg-[#040080] text-white text-xs font-bold transition-all shadow-xs cursor-pointer whitespace-nowrap"
                      >
                        <span>결과 보기</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => exportToExcel(sess)}
                        className="px-3 py-2 rounded-xl text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-all cursor-pointer whitespace-nowrap"
                        title="Excel 다운로드"
                      >
                        <span>Excel</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => exportToPdf(sess)}
                        className="px-3 py-2 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-all cursor-pointer whitespace-nowrap"
                        title="PDF 다운로드"
                      >
                        <span>PDF</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onDeleteSession(sess.id)}
                        className="px-2.5 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer whitespace-nowrap"
                        title="이력 삭제"
                      >
                        <span>삭제</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* TAB 2: FEW-SHOT CASE BANK (IndexedDB) */}
      {viewTab === 'fewshot_bank' && (
        <div className="space-y-6">
          {/* Banner Explanation */}
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1.5">
            <div className="flex items-center space-x-2 font-bold text-amber-950">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>과거 교정 사례 학습 (Few-Shot Prompt Bank)</span>
            </div>
            <p className="text-[11.5px] leading-relaxed text-amber-800">
              사용자가 검수 결과에서 <strong>추천안을 채택</strong>하거나 <strong>직접 수정한 사례</strong>가 브라우저 IndexedDB에 안전하게 누적됩니다.
              이후 유사한 문장이 입력되면 이 모범 사례들이 로컬 AI의 프롬프트에 Few-Shot 예시로 자동 주입되어, 실제 Fine-tuning 없이도 우리 회사의 어조와 수정 패턴을 똑같이 반영합니다.
            </p>
          </div>

          {/* Frequently Applied Rules Stats */}
          {frequentRules.length > 0 && (
            <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-3 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-900 flex items-center space-x-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-[#050099]" />
                  <span>자주 적용된 사내 언어가이드 규칙 순위</span>
                </span>
                <span className="text-[11px] text-slate-400">학습 사례 기준 빈도수</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {frequentRules.slice(0, 8).map((fr, idx) => (
                  <div
                    key={idx}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                  >
                    <span className="font-bold text-slate-800">{fr.rule}</span>
                    <span className="px-1.5 py-0.2 rounded-full bg-[#050099] text-white text-[10px] font-extrabold">
                      {fr.count}회
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Cases List */}
          {filteredCases.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
              <p className="text-sm font-bold text-slate-700">저장된 과거 교정 사례가 없습니다</p>
              <p className="text-xs text-slate-500">
                검수 결과 카드에서 '추천안 적용' 또는 '직접 수정'을 진행하시면 모범 사례로 자동 등록됩니다.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredCases.map((item) => (
                <div
                  key={item.id}
                  className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs hover:border-slate-300 transition-all space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2.5">
                    {/* Header info */}
                    <div className="flex items-center justify-between text-[11px]">
                      <div className="flex items-center space-x-1.5">
                        <span
                          className={`px-2 py-0.5 rounded-full font-bold ${
                            item.actionType === 'custom_edited'
                              ? 'bg-blue-50 text-[#050099] border border-blue-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {item.actionType === 'custom_edited' ? '사용자 직접 수정본' : 'AI 추천안 채택'}
                        </span>
                        {item.componentType && (
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                            {item.componentType}
                          </span>
                        )}
                      </div>
                      <span className="text-slate-400 font-mono">
                        {new Date(item.timestamp).toLocaleDateString('ko-KR')}
                      </span>
                    </div>

                    {/* Original vs Final */}
                    <div className="space-y-1.5 text-xs">
                      <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                        <span className="text-[10.5px] font-bold text-slate-400 block mb-0.5">
                          원문 (Before)
                        </span>
                        <p className="text-slate-800 font-medium">{item.original}</p>
                      </div>

                      <div className="p-2 rounded-lg bg-emerald-50/50 border border-emerald-100">
                        <span className="text-[10.5px] font-bold text-emerald-700 block mb-0.5">
                          최종 채택 교정문 (After / Few-Shot Target)
                        </span>
                        <p className="text-emerald-950 font-bold">{item.finalRevision}</p>
                      </div>
                    </div>

                    {/* Applied Rules */}
                    {item.appliedRules.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {item.appliedRules.map((r, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600"
                          >
                            {r}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Footer actions */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-[10.5px] text-slate-400">IndexedDB 동기화 완료</span>
                    <button
                      type="button"
                      onClick={() => handleDeleteCase(item.id)}
                      className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                      title="사례 삭제"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
