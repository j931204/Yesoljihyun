import React, { useState, useRef } from 'react';
import { ServiceType, PlatformType, ContextType, ToneLevel } from '../types';
import { SAMPLE_PRESETS } from '../data/defaultGuides';

interface InputPanelProps {
  inputMode: 'text' | 'batch' | 'image' | 'pdf';
  setInputMode: (mode: 'text' | 'batch' | 'image' | 'pdf') => void;
  textInput: string;
  setTextInput: (val: string) => void;
  uploadedImage: { data: string; mimeType: string; name: string } | null;
  setUploadedImage: (img: { data: string; mimeType: string; name: string } | null) => void;
  uploadedPdf: { data: string; mimeType: string; name: string } | null;
  setUploadedPdf: (pdf: { data: string; mimeType: string; name: string } | null) => void;
  onInspect: () => void;
  isInspecting: boolean;
  onApplyPreset: (preset: (typeof SAMPLE_PRESETS)[0]) => void;
}

export const InputPanel: React.FC<InputPanelProps> = ({
  inputMode,
  setInputMode,
  textInput,
  setTextInput,
  uploadedImage,
  setUploadedImage,
  uploadedPdf,
  setUploadedPdf,
  onInspect,
  isInspecting,
  onApplyPreset,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  const handleImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('이미지 파일(PNG, JPG, WebP)만 업로드 가능합니다.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const base64Data = (reader.result as string).split(',')[1];
      setUploadedImage({
        data: base64Data,
        mimeType: file.type,
        name: file.name,
      });
    };
    reader.readAsDataURL(file);
  };

  const handlePdfFile = (file: File) => {
    if (file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) {
      alert('PDF 파일만 업로드 가능합니다.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const base64Data = (reader.result as string).split(',')[1];
      setUploadedPdf({
        data: base64Data,
        mimeType: 'application/pdf',
        name: file.name,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (inputMode === 'image' || file.type.startsWith('image/')) {
        setInputMode('image');
        handleImageFile(file);
      } else if (inputMode === 'pdf' || file.type === 'application/pdf') {
        setInputMode('pdf');
        handlePdfFile(file);
      }
    }
  };

  return (
    <div
      id="main-inspection-workspace"
      className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-xl space-y-6 ring-1 ring-slate-100"
    >
      {/* 1. Header Bar: Title, Input Mode Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
            검수 대상 입력
          </h3>
        </div>

        {/* 4 Input Mode Tabs */}
        <div className="flex items-center space-x-1.5 bg-slate-100 p-1.5 rounded-xl border border-slate-200 shadow-2xs">
          <button
            type="button"
            id="mode-text-btn"
            onClick={() => setInputMode('text')}
            className={`px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer whitespace-nowrap ${
              inputMode === 'text'
                ? 'bg-[#050099] text-white shadow-sm font-extrabold'
                : 'text-slate-800 hover:text-slate-900 font-bold hover:bg-white'
            }`}
          >
            <span>단일 문구</span>
          </button>

          <button
            type="button"
            id="mode-batch-btn"
            onClick={() => setInputMode('batch')}
            className={`px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer whitespace-nowrap ${
              inputMode === 'batch'
                ? 'bg-[#050099] text-white shadow-sm font-extrabold'
                : 'text-slate-800 hover:text-slate-900 font-bold hover:bg-white'
            }`}
          >
            <span>화면 전체 일괄</span>
          </button>

          <button
            type="button"
            id="mode-image-btn"
            onClick={() => setInputMode('image')}
            className={`px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer whitespace-nowrap ${
              inputMode === 'image'
                ? 'bg-[#050099] text-white shadow-sm font-extrabold'
                : 'text-slate-800 hover:text-slate-900 font-bold hover:bg-white'
            }`}
          >
            <span>화면 캡처 (OCR)</span>
          </button>

          <button
            type="button"
            id="mode-pdf-btn"
            onClick={() => setInputMode('pdf')}
            className={`px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer whitespace-nowrap ${
              inputMode === 'pdf'
                ? 'bg-[#050099] text-white shadow-sm font-extrabold'
                : 'text-slate-800 hover:text-slate-900 font-bold hover:bg-white'
            }`}
          >
            <span>기획서 PDF</span>
          </button>
        </div>
      </div>

      {/* 2. Main Input Area */}
      <div className="space-y-3">
        {inputMode === 'text' && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-end text-xs text-slate-400 font-mono">
              <span>{textInput.length}자</span>
            </div>
            <textarea
              id="input-text-area"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              rows={6}
              placeholder="예시: 재생 중 통신 상태 불량으로 인하여 VOD 스트리밍이 중단되었습니다. 리모컨의 확인 버튼을 눌러 이전 화면으로 회귀하시거나 재시도를 요망합니다."
              className="w-full p-4 rounded-2xl border border-slate-300 focus:border-[#050099] focus:ring-4 focus:ring-[#050099]/10 text-slate-900 text-sm placeholder:text-slate-400 resize-y font-sans transition-all leading-relaxed shadow-2xs"
            />
          </div>
        )}

        {inputMode === 'batch' && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-end text-xs text-slate-400 font-mono">
              <span>{textInput.length}자</span>
            </div>
            <textarea
              id="input-batch-area"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              rows={9}
              placeholder={`[화면 타이틀] VOD 결제 및 시청 확인
[안내 본문] 금일 방송 편성표 정보 갱신을 위해 데이터 로딩 중입니다. 잠시만 기다려 주십시오.
[경고 문구] 결제 취소 시 본 서비스의 포인트 지급 혜택이 일괄 소멸되어집니다.
[확인 버튼] 1,500원 결제 승인 요청
[취소 버튼] 이전 화면으로 회귀`}
              className="w-full p-4 rounded-2xl border border-slate-300 focus:border-[#050099] focus:ring-4 focus:ring-[#050099]/10 text-slate-900 text-sm placeholder:text-slate-400 resize-y font-mono transition-all leading-relaxed shadow-2xs"
            />
          </div>
        )}

        {inputMode === 'image' && (
          <div className="space-y-4">
            <input
              type="file"
              ref={imageInputRef}
              onChange={(e) => e.target.files?.[0] && handleImageFile(e.target.files[0])}
              accept="image/png, image/jpeg, image/webp"
              className="hidden"
            />

            {!uploadedImage ? (
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => imageInputRef.current?.click()}
                className={`border-2 border-dashed rounded-3xl p-10 text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-3.5 ${
                  dragActive
                    ? 'border-[#050099] bg-[#050099]/5'
                    : 'border-slate-300 hover:border-[#050099] hover:bg-slate-50/80 bg-slate-50/40'
                }`}
              >
                <div>
                  <p className="text-sm font-bold text-slate-900">
                    UI 스크린샷 또는 배너 이미지를 업로드하세요
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    클릭하거나 파일을 여기로 드래그하세요 (PNG, JPG, WebP)
                  </p>
                </div>
                <div className="inline-flex items-center px-3 py-1.5 rounded-full text-xs text-[#050099] bg-[#050099]/10 font-bold border border-[#050099]/20">
                  <span>Gemini 비전 OCR로 화면 내 모든 카피를 자동 인식 및 일괄 검수합니다</span>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between shadow-2xs">
                <div className="flex items-center space-x-4">
                  <div className="w-20 h-20 rounded-xl bg-white border border-slate-200 overflow-hidden flex items-center justify-center shadow-xs">
                    <img
                      src={`data:${uploadedImage.mimeType};base64,${uploadedImage.data}`}
                      alt="Upload Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{uploadedImage.name}</p>
                    <p className="text-xs text-emerald-600 font-bold mt-1">
                      이미지 분석 준비 완료
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setUploadedImage(null)}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-all cursor-pointer"
                >
                  삭제
                </button>
              </div>
            )}

            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="이미지와 함께 추가로 전달할 검수 지침이나 중점 사항 (선택 사항)"
              className="w-full p-3 rounded-xl border border-slate-300 focus:border-[#050099] focus:ring-2 focus:ring-[#050099]/20 text-xs text-slate-900"
            />
          </div>
        )}

        {inputMode === 'pdf' && (
          <div className="space-y-4">
            <input
              type="file"
              ref={pdfInputRef}
              onChange={(e) => e.target.files?.[0] && handlePdfFile(e.target.files[0])}
              accept="application/pdf"
              className="hidden"
            />

            {!uploadedPdf ? (
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => pdfInputRef.current?.click()}
                className={`border-2 border-dashed rounded-3xl p-10 text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-3.5 ${
                  dragActive
                    ? 'border-[#050099] bg-[#050099]/5'
                    : 'border-slate-300 hover:border-[#050099] hover:bg-slate-50/80 bg-slate-50/40'
                }`}
              >
                <div>
                  <p className="text-sm font-bold text-slate-900">
                    화면설계서 / 와이어프레임 / 스토리보드 PDF를 업로드하세요
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    클릭하거나 PDF 문서를 여기로 드래그하세요
                  </p>
                </div>
                <div className="inline-flex items-center px-3 py-1.5 rounded-full text-xs text-[#050099] bg-[#050099]/10 font-bold border border-[#050099]/20">
                  <span>문서 내 화면별 텍스트를 추출하여 구조화된 일괄 검수를 수행합니다</span>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between shadow-2xs">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 rounded-xl bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center font-bold text-sm">
                    PDF
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{uploadedPdf.name}</p>
                    <p className="text-xs text-emerald-600 font-bold mt-1">
                      화면설계서 PDF 로드 완료
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setUploadedPdf(null)}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-all cursor-pointer"
                >
                  삭제
                </button>
              </div>
            )}

            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="특정 페이지나 강조할 컴포넌트에 대한 추가 메모 (선택 사항)"
              className="w-full p-3 rounded-xl border border-slate-300 focus:border-[#050099] focus:ring-2 focus:ring-[#050099]/20 text-xs text-slate-900"
            />
          </div>
        )}
      </div>

      {/* 4. Action Execution Footer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-slate-100">
        <button
          type="button"
          onClick={() => {
            setTextInput('');
            setUploadedImage(null);
            setUploadedPdf(null);
          }}
          disabled={isInspecting}
          className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-semibold transition-all disabled:opacity-50 cursor-pointer text-left sm:text-center whitespace-nowrap"
        >
          입력 내용 초기화
        </button>

        <button
          type="button"
          id="start-inspect-btn"
          onClick={onInspect}
          disabled={isInspecting || (!textInput.trim() && !uploadedImage && !uploadedPdf)}
          className="flex items-center justify-center px-8 py-3.5 rounded-2xl bg-[#050099] hover:bg-[#040080] text-white text-sm font-extrabold shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap"
        >
          {isInspecting ? (
            <span>고객언어 가이드 기반 정밀 검수 중...</span>
          ) : (
            <span>
              {inputMode === 'batch' || inputMode === 'image' || inputMode === 'pdf'
                ? '화면 일괄 검수 실행'
                : '고객언어 맞춤 검수 시작'}
            </span>
          )}
        </button>
      </div>
    </div>
  );
};
