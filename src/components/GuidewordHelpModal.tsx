import React from 'react';
import { X, ShieldCheck, Cpu, FileCheck2, Layers, CheckCircle2 } from 'lucide-react';

interface GuidewordHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GuidewordHelpModal: React.FC<GuidewordHelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-xl overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded-md bg-[#1c4a34] text-white text-xs font-bold flex items-center justify-center">
              gw
            </div>
            <h3 className="font-bold text-slate-900 text-sm">guideword 사용 안내</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-md cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 text-xs text-slate-600 leading-relaxed max-h-[75vh] overflow-y-auto">
          <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200/60 text-emerald-900 space-y-1">
            <div className="font-bold flex items-center space-x-1.5 text-emerald-950">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span>100% 무료 · 유료 외부 API 없는 온디바이스 AI</span>
            </div>
            <p className="text-[11.5px] text-emerald-800">
              OpenAI, Claude, Gemini 등 유료 API Key나 외부 유료 서버를 전혀 사용하지 않으며, 사용자의 브라우저 WebGPU 환경에서 오픈웨이트 언어모델과 하이브리드 RAG 엔진으로 안전하게 동작합니다.
            </p>
          </div>

          <div className="space-y-3 pt-1">
            <div className="flex items-start space-x-3">
              <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                <FileCheck2 className="w-4 h-4 text-[#1c4a34]" />
              </div>
              <div>
                <strong className="block text-slate-900 text-[12.5px]">1. 사내 언어가이드 기반 정밀 검수</strong>
                <p className="text-slate-500 mt-0.5 text-[11.5px]">
                  등록된 언어가이드 문서의 규칙과 표, Before/After 예시를 분석하여 입력 문구에 적용해야 할 확정 규칙을 찾아 교정 대안을 제시합니다.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                <Layers className="w-4 h-4 text-[#1c4a34]" />
              </div>
              <div>
                <strong className="block text-slate-900 text-[12.5px]">2. 3대 서비스 & 3대 플랫폼 & 5대 UI 영역</strong>
                <p className="text-slate-500 mt-0.5 text-[11.5px]">
                  <strong>서비스:</strong> 방송, 커머스, 소개형<br />
                  <strong>플랫폼:</strong> 모바일, PC, TV<br />
                  <strong>UI 영역:</strong> 버튼(CTA), 텍스트상자, 팝업, 유의사항, 일반
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                <Cpu className="w-4 h-4 text-[#1c4a34]" />
              </div>
              <div>
                <strong className="block text-slate-900 text-[12.5px]">3. 거짓 양성(False-Positive) 방지 검증 레이어</strong>
                <p className="text-slate-500 mt-0.5 text-[11.5px]">
                  원문과 추천 표현이 동일한 무의미한 교정을 배제하고, 지양 표현(예: '예약해주세요')이 남아있을 경우 사내 규격(예: '예약하기')으로 확정 적용합니다.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#1c4a34] text-white text-xs font-bold hover:bg-[#153727] transition-colors cursor-pointer"
          >
            확인했습니다
          </button>
        </div>
      </div>
    </div>
  );
};
