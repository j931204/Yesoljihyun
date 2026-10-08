import React, { useState } from 'react';
import {
  FileText,
  Image as ImageIcon,
  FileCode,
  Shield,
  ArrowRight,
  ChevronDown,
  Loader2,
  UploadCloud,
  X,
} from 'lucide-react';
import { UIComponentType } from '../types';

interface GuidewordInputCardProps {
  inputMode: 'text' | 'batch' | 'image' | 'pdf';
  setInputMode: (m: 'text' | 'batch' | 'image' | 'pdf') => void;
  componentType: UIComponentType;
  setComponentType: (c: UIComponentType) => void;
  textInput: string;
  setTextInput: (t: string) => void;
  uploadedImage: { data: string; mimeType: string; name: string } | null;
  setUploadedImage: (img: { data: string; mimeType: string; name: string } | null) => void;
  uploadedPdf: { data: string; mimeType: string; name: string } | null;
  setUploadedPdf: (pdf: { data: string; mimeType: string; name: string } | null) => void;
  isInspecting: boolean;
  onInspect: () => void;
  activeGuideTitle?: string;
}

export const GuidewordInputCard: React.FC<GuidewordInputCardProps> = ({
  inputMode,
  setInputMode,
  componentType,
  setComponentType,
  textInput,
  setTextInput,
  uploadedImage,
  setUploadedImage,
  uploadedPdf,
  setUploadedPdf,
  isInspecting,
  onInspect,
  activeGuideTitle = '우리 팀 고객언어 가이드',
}) => {
  const [isFullBatch, setIsFullBatch] = useState(false);

  // 5 primary UI Areas requested by user: 버튼 / 텍스트상자 / 팝업 / 유의사항 / 일반
  const UI_AREAS: Array<{ id: UIComponentType; label: string; placeholder: string }> = [
    {
      id: 'button',
      label: '버튼',
      placeholder: '예: 예약해주세요 (클릭 시 액션)',
    },
    {
      id: 'textfield',
      label: '텍스트상자',
      placeholder: '예: TV코인으로 결제 시 부가세 10% 포함된 금액이 청구됩니다',
    },
    {
      id: 'popup',
      label: '팝업',
      placeholder: '예: 인증서가 만료되었어요. 갱신을 진행해 주세요.',
    },
    {
      id: 'precaution',
      label: '유의사항',
      placeholder: '예: • 본 혜택은 회원당 1회에 한하여 적용되며 조기 종료될 수 있습니다.',
    },
    {
      id: 'general',
      label: '일반',
      placeholder: '예: 결제 완료 후 마이페이지에서 상세 영수증을 확인할 수 있어요.',
    },
  ];

  const currentAreaObj = UI_AREAS.find((a) => a.id === componentType) || UI_AREAS[1];

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      setUploadedImage({
        data: base64,
        mimeType: file.type || 'image/png',
        name: file.name,
      });
      // Set sample contextual text for image screen
      if (!textInput.trim()) {
        setTextInput(
          `[화면 타이틀] 서비스 이용 안내\n[본문 텍스트상자] 통신 장애로 인하여 VOD 스트리밍이 중단되었습니다. 이전 화면으로 회귀하시거나 재시도를 요망합니다.\n[확인 버튼] 결제 승인 요청하기`
        );
      }
    };
    reader.readAsDataURL(file);
  };

  const handlePdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      setUploadedPdf({
        data: base64,
        mimeType: file.type || 'application/pdf',
        name: file.name,
      });
      if (!textInput.trim()) {
        setTextInput(
          `[모달 헤더] 본인 인증 확인\n[본문 텍스트상자] 금일 중으로 인증번호 6자리를 기재하여 주시기 바랍니다.\n[확인 버튼] 본인인증 진행하기`
        );
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div id="guideword-input-section" className="space-y-4">
      {/* 1. Section Header: 01 검수할 문구 + 화면 전체 검수 Switch */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold text-slate-400 font-mono">01</span>
          <h3 className="text-base font-extrabold text-slate-900">검수할 문구</h3>
        </div>

        {/* 화면 전체 검수 Switch */}
        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-500 font-medium select-none">화면 전체 검수</span>
          <button
            type="button"
            onClick={() => {
              setIsFullBatch(!isFullBatch);
              setInputMode(!isFullBatch ? 'batch' : 'text');
            }}
            className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${
              isFullBatch ? 'bg-[#1c4a34]' : 'bg-slate-200'
            }`}
          >
            <span
              className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.75 transition-transform ${
                isFullBatch ? 'right-0.75' : 'left-0.75'
              }`}
            />
          </button>
        </div>
      </div>

      {/* 2. Format Mode Tabs */}
      <div className="flex items-center space-x-2">
        <button
          type="button"
          onClick={() => setInputMode('text')}
          className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            inputMode === 'text' || inputMode === 'batch'
              ? 'bg-emerald-50/70 border border-emerald-300 text-[#1c4a34] shadow-2xs'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>텍스트</span>
        </button>

        <button
          type="button"
          onClick={() => setInputMode('image')}
          className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            inputMode === 'image'
              ? 'bg-emerald-50/70 border border-emerald-300 text-[#1c4a34] shadow-2xs'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <ImageIcon className="w-3.5 h-3.5" />
          <span>화면 이미지</span>
          {uploadedImage && <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>}
        </button>

        <button
          type="button"
          onClick={() => setInputMode('pdf')}
          className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            inputMode === 'pdf'
              ? 'bg-emerald-50/70 border border-emerald-300 text-[#1c4a34] shadow-2xs'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <FileCode className="w-3.5 h-3.5" />
          <span>화면설계서 PDF</span>
          {uploadedPdf && <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>}
        </button>
      </div>

      {/* 3. Main Input Box Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 sm:p-5 space-y-3">
        {/* Top Dropdown inside card: 01  [ 텍스트상자 ▼ ] */}
        <div className="flex items-center space-x-2">
          <span className="text-[11px] font-bold text-slate-400 font-mono">01</span>
          <div className="relative inline-block">
            <select
              value={componentType}
              onChange={(e) => setComponentType(e.target.value as UIComponentType)}
              className="appearance-none bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg pl-3 pr-7 py-1 text-xs font-bold text-slate-800 cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#1c4a34] transition-all"
            >
              {UI_AREAS.map((area) => (
                <option key={area.id} value={area.id}>
                  {area.label}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Input content based on mode */}
        {inputMode === 'image' ? (
          <div className="space-y-3">
            <div className="border-2 border-dashed border-slate-200 rounded-xl p-5 text-center bg-slate-50/50 hover:bg-slate-50 transition-colors">
              <input
                type="file"
                id="guideword-image-input"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              <label htmlFor="guideword-image-input" className="cursor-pointer block space-y-1.5">
                <UploadCloud className="w-7 h-7 text-slate-400 mx-auto" />
                <span className="text-xs font-bold text-slate-700 block">
                  {uploadedImage ? uploadedImage.name : '검수할 화면 스크린샷 이미지 업로드'}
                </span>
                <span className="text-[11px] text-slate-400 block">PNG, JPG, WebP 파일 지원</span>
              </label>
            </div>
            {uploadedImage && (
              <div className="flex items-center justify-between text-xs text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-200">
                <span>등록된 이미지: {uploadedImage.name}</span>
                <button
                  type="button"
                  onClick={() => setUploadedImage(null)}
                  className="text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        ) : inputMode === 'pdf' ? (
          <div className="space-y-3">
            <div className="border-2 border-dashed border-slate-200 rounded-xl p-5 text-center bg-slate-50/50 hover:bg-slate-50 transition-colors">
              <input
                type="file"
                id="guideword-pdf-input"
                accept="application/pdf"
                onChange={handlePdfUpload}
                className="hidden"
              />
              <label htmlFor="guideword-pdf-input" className="cursor-pointer block space-y-1.5">
                <UploadCloud className="w-7 h-7 text-slate-400 mx-auto" />
                <span className="text-xs font-bold text-slate-700 block">
                  {uploadedPdf ? uploadedPdf.name : '화면설계서 및 기획서 PDF 파일 업로드'}
                </span>
                <span className="text-[11px] text-slate-400 block">PDF 내 화면 문구 자동 추출 및 검수</span>
              </label>
            </div>
            {uploadedPdf && (
              <div className="flex items-center justify-between text-xs text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-200">
                <span>등록된 기획서: {uploadedPdf.name}</span>
                <button
                  type="button"
                  onClick={() => setUploadedPdf(null)}
                  className="text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        ) : null}

        {/* Textarea */}
        <textarea
          rows={isFullBatch ? 6 : 3}
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
          placeholder={currentAreaObj.placeholder}
          className="w-full text-sm sm:text-base text-slate-900 placeholder:text-slate-400/80 leading-relaxed focus:outline-none resize-none font-medium"
        />

        {/* Bottom row inside card: Helper caption + Character Counter */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-400">
          <span className="truncate pr-2">
            행동 목적 / 화면 맥락 (선택) 예: 다음 단계로 이동하는 {currentAreaObj.label}
          </span>
          <span className="shrink-0 font-mono">
            {textInput.length}/1,500
          </span>
        </div>
      </div>

      {/* 4. Bottom Action Bar: Shield indicator + Forest green CTA Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div className="flex items-center space-x-1.5 text-xs text-slate-500 font-medium">
          <Shield className="w-3.5 h-3.5 text-emerald-700" />
          <span>{activeGuideTitle} 기준으로 검수해요</span>
        </div>

        <button
          type="button"
          id="btn-guideword-inspect"
          onClick={onInspect}
          disabled={isInspecting || (!textInput.trim() && !uploadedImage && !uploadedPdf)}
          className={`flex items-center justify-center space-x-2 px-6 py-3 rounded-xl text-xs sm:text-sm font-bold text-white transition-all cursor-pointer shadow-xs whitespace-nowrap ${
            isInspecting || (!textInput.trim() && !uploadedImage && !uploadedPdf)
              ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
              : 'bg-[#1c4a34] hover:bg-[#153727] active:scale-[0.99]'
          }`}
        >
          {isInspecting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-emerald-200" />
              <span>가이드 기준으로 검수 중...</span>
            </>
          ) : (
            <>
              <Shield className="w-4 h-4 text-emerald-300" />
              <span>가이드로 검수</span>
              <ArrowRight className="w-4 h-4 text-emerald-300" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};
