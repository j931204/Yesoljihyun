import React, { useState, useRef } from 'react';
import { X, Upload, FileText, CheckCircle2, AlertCircle, Sparkles, ArrowRight, Edit3 } from 'lucide-react';
import { UploadedGuideVersion, UIComponentType } from '../types';
import { chunkLanguageGuideText } from '../lib/rag/chunker';

interface GuidePdfUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: (newGuide: UploadedGuideVersion) => void;
  currentActiveVersion: string;
}

export const GuidePdfUploadModal: React.FC<GuidePdfUploadModalProps> = ({
  isOpen,
  onClose,
  onUploadSuccess,
  currentActiveVersion,
}) => {
  const [entryMode, setEntryMode] = useState<'file' | 'text'>('file');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileTextContent, setFileTextContent] = useState<string>('');
  const [directText, setDirectText] = useState<string>(`# W-201 버튼 명사형 종결 원칙
- 분류: 버튼 (button)
- 지양: 확인하기 / 로그인하기 / 신청하기
- 권장: 확인 / 로그인 / 신청
- 설명: 버튼은 4자 이내의 간결한 명사형으로 종결하며 '~하기' 접미사를 붙이지 않습니다.

# W-204 서비스 능동태 원칙
- 분류: 공통 (general)
- 지양: 소멸되어집니다 / 지급되어집니다
- 권장: 사라집니다 / 지급됩니다
- 설명: 불필요한 이중 피동 표현을 배제하고 고객 중심의 능동태로 서술합니다.

# W-301 쉬운 일상어 사용 및 한자어 순화
- 분류: 용어사전
- 금일 -> 오늘
- 익일 -> 다음 날
- 기재 -> 입력
- 수취 -> 받기
- 회귀 -> 돌아가기`);

  const [guideTitle, setGuideTitle] = useState('UX Writing 가이드 개정본');
  const [guideVersion, setGuideVersion] = useState('v0.4');
  const [changelog, setChangelog] = useState('사내 언어 가이드 업데이트 배포본 반영');
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileSelect = (file: File) => {
    const isPdf = file.type === 'application/pdf' || file.name.endsWith('.pdf');
    const isText = file.name.endsWith('.txt') || file.name.endsWith('.md') || file.type.startsWith('text/');

    if (!isPdf && !isText) {
      setErrorMessage('PDF 문서(.pdf) 또는 텍스트/마크다운 문서(.txt, .md)만 지원됩니다.');
      return;
    }
    setErrorMessage(null);
    setSelectedFile(file);

    const nameWithoutExt = file.name.replace(/\.(pdf|txt|md)$/i, '');
    setGuideTitle(nameWithoutExt.replace(/_/g, ' '));

    const versionMatch = file.name.match(/v(\d+(\.\d+)?)/i);
    if (versionMatch) {
      setGuideVersion(versionMatch[0].toLowerCase());
    } else {
      const nextNum = parseFloat(currentActiveVersion.replace(/[^0-9.]/g, '') || '0.3') + 0.1;
      setGuideVersion(`v${nextNum.toFixed(1)}`);
    }

    if (isText) {
      const textReader = new FileReader();
      textReader.onload = () => {
        setFileTextContent(textReader.result as string);
      };
      textReader.readAsText(file);
    } else {
      setFileTextContent('');
    }
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
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (entryMode === 'file' && !selectedFile) {
      setErrorMessage('업로드할 가이드 문서 파일(PDF, TXT, MD)을 선택해 주세요.');
      return;
    }
    if (entryMode === 'text' && !directText.trim()) {
      setErrorMessage('가이드라인 본문 텍스트를 입력해 주세요.');
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const rawText = entryMode === 'text' ? directText : fileTextContent;
      const isPdf = selectedFile?.name.endsWith('.pdf');

      const processCompletion = (base64Data?: string) => {
        const guideId = `guide-${Date.now()}`;
        const rawContent = rawText || '';
        const parsedChunks = chunkLanguageGuideText(rawContent, {
          guideId,
          defaultCategory: '사내가이드',
        });

        const newGuideVersion: UploadedGuideVersion = {
          id: guideId,
          version: guideVersion.trim() || 'v0.4',
          title: guideTitle.trim() || (selectedFile ? selectedFile.name.replace(/\.[^/.]+$/, '') : '사내 언어 가이드'),
          fileName: entryMode === 'file' && selectedFile ? selectedFile.name : `guide_${guideVersion}.txt`,
          uploadedAt: new Date().toISOString().split('T')[0],
          pageCount: isPdf ? 9 : Math.max(1, Math.ceil((rawText?.length || 500) / 1000)),
          isActive: true,
          isInitialVersion: false,
          fileData: base64Data,
          rawContent,
          summary: `${guideVersion} 배포본: ${entryMode === 'text' ? '직접 입력' : selectedFile?.name} (총 ${parsedChunks.length}개 규칙 RAG 등록)`,
          changelog: changelog.trim(),
          extractedRules: {
            generalPrinciples: [
              { id: 'W-101', title: '명확성 (Clarity)', description: '고객 중심의 구체적이고 오인지 없는 명확한 정보 제공' },
              { id: 'W-102', title: '간결성 (Conciseness)', description: '불필요한 수식어 및 중복 어미 생략, 1문장 1메시지' },
              { id: 'W-103', title: '직관성 (Intuition)', description: '일상의 쉬운 표현을 사용하여 다음 행동을 즉시 인지하도록 유도' },
              { id: 'W-104', title: '일관성 (Consistency)', description: '전 채널/플랫폼 통일된 표준 용어 및 문체 유지' },
              { id: 'W-105', title: '고객 배려 (User-First)', description: '공급자 중심 관행 배제 및 사용자 친화적 표현' },
            ],
            toneLevels: [
              { level: 1, name: 'Level 1: 매우 정중 / 격식체', desc: '공공성, 약관 및 규정, 신뢰감이 중요한 영역', pattern: '~하십시오, ~바랍니다' },
              { level: 2, name: 'Level 2: 친절 / 표준 해요체', desc: '표준 고객 안내 및 서비스 기본 친근 어조', pattern: '~해요, ~해 주세요' },
              { level: 3, name: 'Level 3: 직관 / 간결 명사형', desc: '버튼, 탭, 배지 등 빠른 액션 유도', pattern: '명사형 종결, ~하기 지양' },
            ],
            componentRules: [
              {
                ruleId: 'W-201',
                componentType: 'button',
                title: "버튼 내 명사형 종결 및 '~하기' 접미 금지",
                description: "Primary 버튼은 공백제외 4자 이내의 명사형 한 단어로 쓰며, [확인], [취소], [로그인], [다음에]에 '~하기'를 절대 붙이지 않습니다. CTA는 12자 이내 허용.",
                limit: '공백제외 4자 (CTA 최대 12자)',
                badExample: '확인하기 / 로그인하기',
                goodExample: '확인 / 로그인',
                page: 4,
              },
              {
                ruleId: 'W-202',
                componentType: 'popup',
                title: "팝업 두괄식 원인 제시 & 3줄 이내 해결책 ([원인]+[해결])",
                description: "타이틀에 단순 '알림/경고'를 금지하고 16자 이내로 핵심 결론을 제시합니다. 본문은 60자/3줄 이내로 원인과 구체적 해결 행동을 안내합니다.",
                limit: '타이틀 16자, 본문 60자(3줄 이내)',
                badExample: '알림 (본문: 오류가 발생하여 작업을 중단합니다)',
                goodExample: '인증서가 만료되었어요 (본문: 인증서를 다시 발급받아 주세요)',
                page: 5,
              },
              {
                ruleId: 'W-203',
                componentType: 'toast',
                title: "토스트 25자 이내 1줄 엄수 & 부사 배제",
                description: "토스트는 2초 후 사라지므로 2줄 줄바꿈을 금지하며, '성공적으로/정상적으로' 등의 불필요한 부사를 제거합니다.",
                limit: '공백포함 25자 이내 (반드시 1줄)',
                badExample: '회원님의 클립보드로 계좌번호가 성공적으로 복사 완료되었습니다.',
                goodExample: '계좌번호를 복사했어요.',
                page: 5,
              },
              {
                ruleId: 'W-204',
                componentType: 'general',
                title: "서비스 행위 능동태 원칙 (불필요한 피동/사동문 지양)",
                description: "'소멸되어집니다', '지급되어집니다', '처리되어집니다' 등의 이중피동을 금지하고, 주체를 명확히 하여 능동태로 서술합니다.",
                limit: '1문장 1메시지 (50자 이내)',
                badExample: '포인트가 일괄 소멸되어집니다',
                goodExample: '포인트가 사라집니다',
                page: 6,
              },
              {
                ruleId: 'W-205',
                componentType: 'bottom_sheet',
                title: '바텀시트 단일 행동 타이틀 (18자 이내) & 명사형 옵션',
                description: '바텀시트 타이틀은 유저가 수행해야 할 단일 행동을 명확히 정의하며 공백제외 18자 이내로 씁니다.',
                limit: '타이틀 18자 이내',
                badExample: '해당 기능을 이용하시려면 아래에서 선택하십시오',
                goodExample: '출금 계좌를 선택해 주세요',
                page: 6,
              },
              {
                ruleId: 'W-206',
                componentType: 'label',
                title: '레이블/태그/배지 2~6자 단일 명사 & 2줄 줄바꿈 방지',
                description: '배지 영역을 벗어나지 않도록 불필요한 어미를 제거한 2~6자의 순수 명사형으로 표기합니다.',
                limit: '공백제외 2~6자 (단일 명사)',
                badExample: '현재 처리 중입니다',
                goodExample: '처리중',
                page: 7,
              },
              {
                ruleId: 'W-207',
                componentType: 'tooltip',
                title: '도움말 툴팁 쉬운 일상어 풀이 & 40자 이내',
                description: '어려운 전문 용어를 풀어서 40자(2줄 이내)로 설명하며, 행동 결정에 필요한 1가지 핵심 정보만 담습니다.',
                limit: '공백포함 40자 이내 (최대 2줄)',
                badExample: '상세 규정은 당사 이용약관 제12조를 참조하시기 바랍니다.',
                goodExample: '최근 3개월간 결제한 내역만 모아서 보여드려요.',
                page: 7,
              },
              {
                ruleId: 'W-208',
                componentType: 'notice_error',
                title: '오류 메시지 원인+해결 행동 제시 (에러코드 단독 노출 금지)',
                description: "'ERR_500' 등 기술 용어를 배제하고, 사용자가 지금 즉시 취해야 할 행동을 표준 해요체로 안내합니다.",
                limit: '메인 헤드 20자, 상세 30자',
                badExample: '네트워크 통신 오류 (ERR_SOCKET_TIMEOUT)',
                goodExample: '인터넷 연결이 불안정해요. 잠시 후 다시 확인해 주세요.',
                page: 8,
              },
              {
                ruleId: 'W-209',
                componentType: 'precaution',
                title: '유의사항 불릿 포인트(•) 분할 & 문장당 40~60자',
                description: '긴 법적 고지사항을 한 덩어리로 쓰지 않고 불릿 포인트로 쪼개어 가독성을 높입니다.',
                limit: '불릿 포인트당 40~60자',
                badExample: '본 이벤트는 조기 종료될 수 있으며 미숙지로 인한 손해는 귀책사유에 해당합니다.',
                goodExample: '• 이벤트는 사전 안내 없이 변경되거나 종료될 수 있어요.',
                page: 8,
              },
            ],
            terminology: [
              { id: 't-1', prohibited: '확인하기', recommended: '확인', category: '버튼규칙', reason: "W-201 [확인], [취소], [로그인] 버튼 접미사 '~하기' 금지" },
              { id: 't-2', prohibited: '로그인하기', recommended: '로그인', category: '버튼규칙', reason: "W-201 불필요한 '~하기' 접미사 배제" },
              { id: 't-3', prohibited: '금일', recommended: '오늘', category: '한자어', reason: 'W-301 쉬운 일상어 사용 및 한자어 배제' },
              { id: 't-4', prohibited: '익일', recommended: '다음 날', category: '한자어', reason: 'W-301 쉬운 일상어 사용' },
              { id: 't-5', prohibited: '기재', recommended: '입력 / 적기', category: '한자어', reason: 'W-301 행정용어 순화' },
              { id: 't-6', prohibited: '수취', recommended: '받기', category: '한자어', reason: 'W-301 쉬운 우리말 사용' },
              { id: 't-7', prohibited: '회귀', recommended: '돌아가기', category: '한자어', reason: 'W-301 직관적인 행동 지시어' },
              { id: 't-8', prohibited: '상이', recommended: '다름 / 차이', category: '한자어', reason: 'W-301 직관성 제고' },
              { id: 't-9', prohibited: '송부', recommended: '보내기', category: '한자어', reason: 'W-301 쉬운 일상어' },
              { id: 't-10', prohibited: '되어집니다', recommended: '됩니다 / 사라져요', category: '어법/맞춤법', reason: 'W-204/W-303 이중 피동 오류 교정' },
              { id: 't-11', prohibited: '요망합니다', recommended: '해 주세요', category: '어미·문법', reason: 'W-303 권압적 관공서 어미를 친절한 해요체로 완화' },
              { id: 't-12', prohibited: '바랍니다', recommended: '해 주세요', category: '어미·문법', reason: 'Level 2 표준 친절 해요체 적용' },
              { id: 't-13', prohibited: '스트리밍', recommended: '실시간 재생', category: '외국어·외래어', reason: 'W-302 표준 한글 순화어 권장' },
              { id: 't-14', prohibited: '패스워드', recommended: '비밀번호', category: '외국어·외래어', reason: 'W-302 표준 고객언어' },
              { id: 't-15', prohibited: '컨펌', recommended: '확인', category: '외국어·외래어', reason: 'W-302 직관적 표현' },
              { id: 't-16', prohibited: '리셋', recommended: '초기화', category: '외국어·외래어', reason: 'W-302 표준 우리말' },
            ],
          },
        };

        onUploadSuccess(newGuideVersion);
        setIsProcessing(false);
        onClose();
      };

      if (entryMode === 'file' && selectedFile && isPdf) {
        const reader = new FileReader();
        reader.onload = () => {
          const base64Data = (reader.result as string).split(',')[1];
          processCompletion(base64Data);
        };
        reader.readAsDataURL(selectedFile);
      } else {
        processCompletion();
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage('가이드 등록 처리 중 오류가 발생했습니다.');
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-[#050099]/10 text-[#050099] flex items-center justify-center font-bold">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">새 언어가이드 등록 & 배포</h3>
              <p className="text-[11px] text-slate-500">
                PDF 파일 업로드 또는 텍스트 직접 입력으로 사내 가이드를 즉시 갱신합니다.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-500 flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Input Mode Tabs: File vs Direct Text */}
        <div className="flex items-center p-1 bg-slate-100 rounded-xl">
          <button
            type="button"
            onClick={() => setEntryMode('file')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center space-x-1.5 ${
              entryMode === 'file'
                ? 'bg-[#050099] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>문서 파일 업로드 (PDF / TXT / MD)</span>
          </button>
          <button
            type="button"
            onClick={() => setEntryMode('text')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center space-x-1.5 ${
              entryMode === 'text'
                ? 'bg-[#050099] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>텍스트 직접 입력</span>
          </button>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {entryMode === 'file' ? (
            /* File Drop Area */
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-2 ${
                dragActive
                  ? 'border-[#050099] bg-[#050099]/5'
                  : selectedFile
                  ? 'border-emerald-400 bg-emerald-50/50'
                  : 'border-slate-300 hover:border-[#050099] hover:bg-slate-50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.txt,.md,application/pdf,text/plain,text/markdown"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileSelect(e.target.files[0]);
                  }
                }}
              />

              {selectedFile ? (
                <div className="space-y-1">
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <p className="text-xs font-bold text-slate-900 mt-2">{selectedFile.name}</p>
                  <p className="text-[11px] text-emerald-600 font-semibold">
                    {(selectedFile.size / 1024).toFixed(1)} KB · 파일 준비 완료
                  </p>
                  <p className="text-[10px] text-slate-400">다른 파일을 올리려면 클릭하세요</p>
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 text-[#050099] flex items-center justify-center mx-auto">
                    <FileText className="w-6 h-6" />
                  </div>
                  <p className="text-xs font-bold text-slate-800">
                    PDF / TXT / MD 파일을 여기로 드래그하거나 클릭하여 선택
                  </p>
                  <p className="text-[11px] text-slate-500">
                    예: UX_Writing_가이드_v0.4.pdf 또는 company_guide.md
                  </p>
                </div>
              )}
            </div>
          ) : (
            /* Direct Text Input Area */
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-700">
                언어가이드 본문 / 마크다운 규칙 입력:
              </label>
              <textarea
                rows={7}
                value={directText}
                onChange={(e) => setDirectText(e.target.value)}
                placeholder="규칙명, 카테고리, 지양 표현, 권장 표현, Before/After 예시를 자유롭게 작성하세요."
                className="w-full p-3 text-xs rounded-xl border border-slate-300 focus:border-[#050099] focus:ring-1 focus:ring-[#050099] font-mono leading-relaxed resize-y"
              />
              <p className="text-[10px] text-slate-400">
                * 제목(#), 규칙코드([W-201]), 지양/권장 표현을 자동으로 인식하여 지능형 Chunk로 분할합니다.
              </p>
            </div>
          )}

          {/* Guide Metadata Inputs */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                가이드 문서명
              </label>
              <input
                type="text"
                value={guideTitle}
                onChange={(e) => setGuideTitle(e.target.value)}
                placeholder="예: UX Writing 가이드 v0.4"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:border-[#050099] focus:ring-1 focus:ring-[#050099]"
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                배포 버전 번호
              </label>
              <input
                type="text"
                value={guideVersion}
                onChange={(e) => setGuideVersion(e.target.value)}
                placeholder="예: v0.4"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:border-[#050099] focus:ring-1 focus:ring-[#050099]"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              개정/배포 요약 및 변경 메모
            </label>
            <textarea
              rows={2}
              value={changelog}
              onChange={(e) => setChangelog(e.target.value)}
              placeholder="예: 2차 개정본 - 팝업 및 토스트 글자수 제약 완화, 신규 금융 용어 순화 추가"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:border-[#050099] focus:ring-1 focus:ring-[#050099] resize-none"
            />
          </div>

          {/* Workflow Notice */}
          <div className="p-3 rounded-xl bg-blue-50/80 border border-blue-200/80 text-[11px] text-blue-900 space-y-1">
            <div className="font-bold flex items-center space-x-1 text-[#050099]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>등록 즉시 브라우저 로컬 RAG에 자동 분할·적용</span>
            </div>
            <p className="text-[10.5px] text-blue-800 leading-tight">
              문서 내용은 외부 서버 전송 없이 100% 브라우저 IndexedDB에 저장되며, 실시간 RAG 검색 대상이 됩니다.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={(entryMode === 'file' && !selectedFile) || (entryMode === 'text' && !directText.trim()) || isProcessing}
              className="px-5 py-2 text-xs font-bold rounded-xl bg-[#050099] hover:bg-[#040080] text-white shadow-md disabled:opacity-50 cursor-pointer flex items-center space-x-1.5"
            >
              {isProcessing ? (
                <span>가이드 등록 및 청킹 중...</span>
              ) : (
                <>
                  <span>이 가이드로 즉시 적용하기</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
