import React, { useState } from 'react';
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
} from 'lucide-react';
import { InspectionSession } from '../types';
import { exportToExcel, exportToPdf } from '../utils/exportUtils';
import { SERVICES_CONFIG, PLATFORMS_CONFIG, CONTEXTS_CONFIG, TONE_LEVELS_CONFIG } from '../data/defaultGuides';

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
  const [searchTerm, setSearchTerm] = useState('');

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#050099]"></span>
            <span>검수 이력 및 산출물 보관함</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            과거에 수행한 문구 검수 기록을 확인하고 언제든지 Excel 및 PDF 산출물로 다시 내보낼 수 있습니다.
          </p>
        </div>

        {sessions.length > 0 && (
          <button
            type="button"
            onClick={onClearAll}
            className="px-3.5 py-2 rounded-xl text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-all cursor-pointer whitespace-nowrap"
          >
            <span>전체 이력 삭제</span>
          </button>
        )}
      </div>

      {/* Search Bar */}
      {sessions.length > 0 && (
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="검수 문구 내용이나 서비스/플랫폼 이름으로 검색..."
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 focus:ring-2 focus:ring-[#050099]/20 focus:border-[#050099] shadow-xs"
          />
        </div>
      )}

      {/* Sessions List */}
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
    </div>
  );
};
