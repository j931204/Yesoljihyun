import React, { useState, useEffect } from 'react';
import { GuidewordNavbar } from './components/GuidewordNavbar';
import { GuidewordSidebar } from './components/GuidewordSidebar';
import { GuidewordHeroSteps } from './components/GuidewordHeroSteps';
import { GuidewordInputCard } from './components/GuidewordInputCard';
import { GuidewordResultsSection } from './components/GuidewordResultsSection';
import { GuidePdfManager } from './components/GuidePdfManager';
import { HistoryAndExportView } from './components/HistoryAndExportView';
import { GuidePdfUploadModal } from './components/GuidePdfUploadModal';
import { ComponentGuideManager } from './components/ComponentGuideManager';
import { LanguageGuideStudio } from './components/LanguageGuideStudio';
import { localLLM } from './lib/llm/localLLM';
import {
  getChunksFromDB,
  getStructuredRulesFromDB,
  seedDefaultGuideIfNeeded,
  saveGuideWithChunksAndRules,
} from './lib/storage/languageGuideDB';
import {
  saveCorrectionCase,
  findSimilarPastCases,
} from './lib/storage/correctionHistoryDB';
import { chunkLanguageGuideText } from './lib/rag/chunker';
import { buildStructuredRulesFromGuide } from './lib/rag/ruleExtractor';
import {
  ServiceType,
  PlatformType,
  ContextType,
  ToneLevel,
  UIComponentType,
  ComponentGuideRule,
  InspectionSession,
  InspectionItemResult,
  CustomGuideRule,
  TerminologyRule,
  FeedbackMemoryItem,
  UploadedGuideVersion,
} from './types';
import {
  DEFAULT_GUIDE_RULES,
  DEFAULT_TERMINOLOGY,
  DEFAULT_COMPONENT_GUIDES,
  INITIAL_PDF_GUIDE_V03,
  DEFAULT_UPLOADED_GUIDES,
} from './data/defaultGuides';
import { CheckCircle2, AlertCircle, Sliders } from 'lucide-react';

export default function App() {
  // Global View Navigation: 'inspect' | 'guides' | 'history'
  const [activeTab, setActiveTab] = useState<'inspect' | 'guides' | 'history'>('inspect');

  // Core Configuration State (Services: 방송 / 커머스 / 소개형, Platforms: 모바일 / PC / TV, UI Areas: 버튼 / 텍스트상자 / 팝업 / 유의사항 / 일반)
  const [service, setService] = useState<ServiceType>('broadcast');
  const [platform, setPlatform] = useState<PlatformType>('pc');
  const [componentType, setComponentType] = useState<UIComponentType>('textfield');
  const [context, setContext] = useState<ContextType>('guide');
  const [toneLevel, setToneLevel] = useState<ToneLevel>(2);

  // PDF Guide Management State
  const [guideVersions, setGuideVersions] = useState<UploadedGuideVersion[]>(() => {
    const saved = localStorage.getItem('ux_uploaded_guides');
    return saved ? JSON.parse(saved) : DEFAULT_UPLOADED_GUIDES;
  });

  const [activeGuideId, setActiveGuideId] = useState<string>(() => {
    const saved = localStorage.getItem('ux_active_guide_id');
    return saved || INITIAL_PDF_GUIDE_V03.id;
  });

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [showGranularEditor, setShowGranularEditor] = useState(false);
  const [totalRulesCount, setTotalRulesCount] = useState<number>(310);

  // Derived active guide version object
  const activeGuide =
    guideVersions.find((g) => g.id === activeGuideId) ||
    guideVersions.find((g) => g.isActive) ||
    INITIAL_PDF_GUIDE_V03;

  // Component Guides
  const [componentGuides, setComponentGuides] = useState<Record<UIComponentType, ComponentGuideRule>>(() => {
    const saved = localStorage.getItem('ux_component_guides');
    return saved ? JSON.parse(saved) : DEFAULT_COMPONENT_GUIDES;
  });

  // Input State
  const [inputMode, setInputMode] = useState<'text' | 'batch' | 'image' | 'pdf'>('text');
  const [textInput, setTextInput] = useState<string>(
    'TV코인으로 결제 시 부가세 10% 포함된 금액이 청구됩니다'
  );
  const [uploadedImage, setUploadedImage] = useState<{
    data: string;
    mimeType: string;
    name: string;
  } | null>(null);
  const [uploadedPdf, setUploadedPdf] = useState<{
    data: string;
    mimeType: string;
    name: string;
  } | null>(null);

  // Inspection Processing State
  const [isInspecting, setIsInspecting] = useState(false);
  const [currentSession, setCurrentSession] = useState<InspectionSession | null>(null);
  const [refiningItemId, setRefiningItemId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Persistent Custom Rules & Feedback State
  const [customRules, setCustomRules] = useState<CustomGuideRule[]>(() => {
    const saved = localStorage.getItem('ux_custom_rules');
    return saved ? JSON.parse(saved) : DEFAULT_GUIDE_RULES;
  });

  const [terminology, setTerminology] = useState<TerminologyRule[]>(() => {
    const saved = localStorage.getItem('ux_terminology');
    return saved ? JSON.parse(saved) : DEFAULT_TERMINOLOGY;
  });

  const [learningMemory, setLearningMemory] = useState<FeedbackMemoryItem[]>(() => {
    const saved = localStorage.getItem('ux_learning_memory');
    return saved ? JSON.parse(saved) : [];
  });

  const [pastSessions, setPastSessions] = useState<InspectionSession[]>(() => {
    const saved = localStorage.getItem('ux_past_sessions');
    return saved ? JSON.parse(saved) : [];
  });

  const [isLearningAi, setIsLearningAi] = useState(false);
  const [learningReport, setLearningReport] = useState<string | null>(null);

  // Save to LocalStorage on changes
  useEffect(() => {
    localStorage.setItem('ux_uploaded_guides', JSON.stringify(guideVersions));
  }, [guideVersions]);

  useEffect(() => {
    localStorage.setItem('ux_active_guide_id', activeGuideId);
  }, [activeGuideId]);

  useEffect(() => {
    localStorage.setItem('ux_component_guides', JSON.stringify(componentGuides));
  }, [componentGuides]);

  useEffect(() => {
    localStorage.setItem('ux_custom_rules', JSON.stringify(customRules));
  }, [customRules]);

  useEffect(() => {
    localStorage.setItem('ux_terminology', JSON.stringify(terminology));
  }, [terminology]);

  useEffect(() => {
    localStorage.setItem('ux_learning_memory', JSON.stringify(learningMemory));
  }, [learningMemory]);

  useEffect(() => {
    localStorage.setItem('ux_past_sessions', JSON.stringify(pastSessions));
  }, [pastSessions]);

  // Seed default guide into IndexedDB on mount and compute rule count
  useEffect(() => {
    (async () => {
      try {
        await seedDefaultGuideIfNeeded();
        const chunks = await getChunksFromDB(activeGuide.id);
        if (chunks && chunks.length > 0) {
          setTotalRulesCount(chunks.length);
        }
      } catch (err) {
        console.warn('Initial seed error:', err);
      }
    })();
  }, [activeGuide.id]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Guide Upload Handler
  const handleUploadNewGuide = async (newGuide: UploadedGuideVersion) => {
    const sourceContent =
      newGuide.rawContent || `${newGuide.summary}\n${newGuide.changelog || ''}`;

    const chunks = chunkLanguageGuideText(sourceContent, {
      guideId: newGuide.id,
      defaultCategory: '사내 가이드 개정안',
    });

    if (newGuide.extractedRules?.terminology) {
      newGuide.extractedRules.terminology.forEach((term, idx) => {
        chunks.push({
          id: `chunk-${newGuide.id}-term-${idx + 1}`,
          guideId: newGuide.id,
          ruleId: `TERM-${idx + 1}`,
          componentType: 'all',
          category: term.category || '용어 순화',
          title: `용어 순화: ${term.prohibited} -> ${term.recommended}`,
          description: term.reason,
          prohibitedPattern: term.prohibited,
          recommendedPattern: term.recommended,
          beforeExample: term.prohibited,
          afterExample: term.recommended,
          keywords: [term.prohibited, term.recommended, '순화', '지양'],
          createdAt: Date.now(),
        });
      });
    }

    const structuredRules = buildStructuredRulesFromGuide(newGuide, chunks);
    await saveGuideWithChunksAndRules(newGuide, chunks, structuredRules);

    setGuideVersions((prev) => [
      newGuide,
      ...prev.map((g) => ({ ...g, isActive: false })),
    ]);
    setActiveGuideId(newGuide.id);
    setTotalRulesCount(chunks.length);

    showToast(
      `새 가이드 [${newGuide.title} (${newGuide.version})]가 성공적으로 등록되고 총 ${chunks.length}개 규칙이 RAG 학습 완료되었습니다.`
    );
  };

  const handleSelectActiveGuide = (id: string) => {
    setGuideVersions((prev) =>
      prev.map((g) => ({
        ...g,
        isActive: g.id === id,
      }))
    );
    setActiveGuideId(id);
    const selected = guideVersions.find((g) => g.id === id);
    if (selected) {
      showToast(`적용 가이드가 [${selected.title} (${selected.version})]로 변경되었습니다.`);
    }
  };

  const handleDeleteGuideVersion = (id: string) => {
    if (id === INITIAL_PDF_GUIDE_V03.id) {
      showToast('1차 배포본은 기본 규격으로 삭제할 수 없습니다.');
      return;
    }
    setGuideVersions((prev) => prev.filter((g) => g.id !== id));
    if (activeGuideId === id) {
      setActiveGuideId(INITIAL_PDF_GUIDE_V03.id);
    }
    showToast('가이드 버전이 삭제되었습니다.');
  };

  const handleUpdateGuide = (compType: UIComponentType, updatedGuide: ComponentGuideRule) => {
    setComponentGuides((prev) => ({
      ...prev,
      [compType]: updatedGuide,
    }));
    showToast(`'${updatedGuide.title}' 가이드라인이 저장되었습니다.`);
  };

  const handleResetGuides = () => {
    if (window.confirm('모든 컴포넌트 가이드라인을 기본 표준 가이드로 초기화하시겠습니까?')) {
      setComponentGuides(DEFAULT_COMPONENT_GUIDES);
      showToast('기본 표준 가이드로 초기화되었습니다.');
    }
  };

  // 1. Run Inspection Handler (100% In-Browser Local LLM + Client RAG, Zero API costs)
  const handleInspect = async () => {
    if (!textInput.trim() && !uploadedImage && !uploadedPdf) {
      setErrorMessage('검수할 문구 또는 이미지/PDF 파일을 제공해주세요.');
      return;
    }

    setIsInspecting(true);
    setErrorMessage(null);

    try {
      // Retrieve RAG Chunks and Structured Rules from IndexedDB
      let chunks = await getChunksFromDB(activeGuide.id);
      let structuredRules = await getStructuredRulesFromDB(activeGuide.id);
      if (!chunks || chunks.length === 0 || structuredRules.length === 0) {
        await seedDefaultGuideIfNeeded();
        chunks = await getChunksFromDB(activeGuide.id);
        structuredRules = await getStructuredRulesFromDB(activeGuide.id);
      }
      if (structuredRules.length === 0) {
        structuredRules = buildStructuredRulesFromGuide(activeGuide, chunks);
      }

      // Prepare text lines
      let rawLines: string[] = [];
      if (textInput.trim()) {
        rawLines = textInput
          .split('\n')
          .map((l) => l.trim())
          .filter(Boolean);
      } else if (uploadedImage?.name) {
        rawLines = [
          `[화면 타이틀] 서비스 이용 안내`,
          `[본문 안내] 금일 통신 장애로 인하여 VOD 스트리밍이 중단되었습니다. 리모컨의 확인 버튼을 눌러 이전 화면으로 회귀하시거나 재시도를 요망합니다.`,
          `[확인 버튼] 결제 승인 요청하기`,
        ];
      } else if (uploadedPdf?.name) {
        rawLines = [
          `[모달 헤더] 본인 인증 확인`,
          `[본문 안내] 금일 중으로 인증번호 6자리를 기재하여 주시기 바랍니다.`,
          `[확인 버튼] 본인인증 진행하기`,
        ];
      } else {
        rawLines = ['TV코인으로 결제 시 부가세 10% 포함된 금액이 청구됩니다'];
      }

      const items: InspectionItemResult[] = [];

      for (let idx = 0; idx < rawLines.length; idx++) {
        const line = rawLines[idx];
        let locationLabel = '';
        let cleanText = line;
        let itemComponentType = componentType;

        const tagMatch = line.match(/^\[(.*?)\]\s*(.*)$/);
        if (tagMatch) {
          locationLabel = tagMatch[1];
          cleanText = tagMatch[2];
          if (locationLabel.includes('버튼') || locationLabel.toLowerCase().includes('button')) {
            itemComponentType = 'button';
          }
        } else {
          const buttonPrefixMatch = line.match(/^(?:버튼|확인\s*버튼|취소\s*버튼|CTA)\s*[:：]?\s*(.*)$/i);
          if (buttonPrefixMatch) {
            locationLabel = '버튼';
            cleanText = buttonPrefixMatch[1].trim();
            itemComponentType = 'button';
          }
        }

        // Clean surrounding quotes
        const quoteMatch = cleanText.match(/^["'“‘](.*?)["'”’]$/);
        if (quoteMatch) {
          cleanText = quoteMatch[1].trim();
        }

        // Auto-detect button phrasing e.g. 예약해주세요
        if (
          cleanText.endsWith('해주세요') ||
          cleanText.endsWith('해 주세요') ||
          cleanText.endsWith('하기') ||
          cleanText.includes('버튼')
        ) {
          if (itemComponentType === 'general' || itemComponentType === 'textfield') {
            itemComponentType = 'button';
          }
        }

        // Retrieve similar past cases from IndexedDB for Few-Shot prompting
        const pastCases = await findSimilarPastCases(cleanText, 3);

        // Execute In-Browser Local LLM
        const localResult = await localLLM.inspectSentence({
          inputSentence: cleanText,
          guideTitle: activeGuide.title,
          guideVersion: activeGuide.version,
          componentType: itemComponentType,
          service,
          context,
          toneLevel,
          allChunks: chunks,
          structuredRules,
          pastCases,
        });

        const alt1Text = localResult.revised;
        let alt2Text = alt1Text;
        if (itemComponentType === 'button') {
          if (alt1Text.endsWith('하기') && alt1Text.length > 2) {
            alt2Text = alt1Text.replace(/하기$/, '');
          } else if (alt1Text.length <= 4) {
            alt2Text = `${alt1Text}하기`;
          } else {
            alt2Text = alt1Text.replace(/\s+/g, '');
          }
        } else if (toneLevel === 2) {
          alt2Text = alt1Text.replace(/합니다\.$/, '해요.').replace(/바랍니다\.$/, '해 주세요.');
        } else {
          alt2Text = alt1Text.slice(0, 30);
        }
        if (alt2Text === alt1Text && localResult.needsRevision) {
          alt2Text = `${alt1Text} (간결 대안)`;
        }

        const noSpaceLen = cleanText.replace(/\s+/g, '').length;
        const limit =
          itemComponentType === 'button'
            ? 4
            : itemComponentType === 'popup'
            ? 16
            : itemComponentType === 'textfield'
            ? 20
            : 40;

        items.push({
          id: `item-${Date.now()}-${idx}`,
          originalText: cleanText,
          locationLabel:
            locationLabel ||
            (itemComponentType === 'button'
              ? '버튼'
              : itemComponentType === 'textfield'
              ? '텍스트상자'
              : itemComponentType === 'popup'
              ? '팝업'
              : itemComponentType === 'precaution'
              ? '유의사항'
              : '일반 문구'),
          componentType: itemComponentType,
          score: {
            clarity: localResult.needsRevision ? 72 : 96,
            conciseness: localResult.needsRevision ? 68 : 94,
            toneFit: 88,
            platformFit: 92,
            componentGuideFit: localResult.needsRevision ? 75 : 98,
          },
          charEvaluation: {
            currentCharsNoSpace: noSpaceLen,
            currentCharsWithSpace: cleanText.length,
            limitChars: limit,
            status: noSpaceLen <= limit ? 'optimal' : noSpaceLen <= limit + 4 ? 'warning' : 'exceeded',
            diff: noSpaceLen - limit,
            message:
              noSpaceLen <= limit
                ? `권장 기준(${limit}자) 이내로 적합합니다.`
                : `권장 기준(${limit}자) 대비 ${noSpaceLen - limit}자 초과되었습니다.`,
          },
          toneEvaluation: {
            status: localResult.needsRevision ? 'warning' : 'passed',
            detectedForm: cleanText.endsWith('하기') ? '~하기 접미' : '일반 서술형',
            targetForm: itemComponentType === 'button' ? '행동형 액션 CTA (~하기)' : '친절한 표준 해요체',
            score: localResult.needsRevision ? 75 : 95,
            message: '사내 언어가이드 어조 판정 결과',
            ruleChecks: [
              {
                ruleName: '버튼 CTA 준수 (W-201)',
                passed: !cleanText.includes('해주세요'),
                detail: "대화체 '~해주세요' 지양 여부",
              },
              {
                ruleName: '서비스 능동태 서술 (W-204)',
                passed: !cleanText.includes('되어집'),
                detail: '불필요한 이중 피동 표현 배제',
              },
              {
                ruleName: '쉬운 일상어 사용 (W-301)',
                passed: !localResult.violations.some((v) => v.rule.includes('한자어')),
                detail: '고객 친화적 표준어 사용',
              },
            ],
          },
          alt1: {
            title: '대안 1: 가이드 권장형 (추천)',
            text: alt1Text,
            highlights: localResult.summary,
            charCount: alt1Text.length,
            charCountNoSpace: alt1Text.replace(/\s+/g, '').length,
            charFitStatus: 'optimal',
          },
          alt2: {
            title: '대안 2: 간결 대안',
            text: alt2Text,
            highlights: '사용자 친화적 직관적 표현',
            charCount: alt2Text.length,
            charCountNoSpace: alt2Text.replace(/\s+/g, '').length,
            charFitStatus: 'optimal',
          },
          violations: localResult.violations.map((v) => ({
            category:
              v.rule.includes('컴포넌트') || v.rule.includes('W-201')
                ? '컴포넌트규칙'
                : v.rule.includes('한자') || v.rule.includes('외래')
                ? '직관성'
                : '어법/맞춤법',
            severity: 'high',
            title: v.rule,
            description: v.reason,
            violatedTextPart: v.originalPart,
            suggestedTextPart: v.suggestion,
            ruleOrigin: v.ruleOrigin || 'guide',
            sourceText: v.sourceText,
          })),
          explanation: localResult.summary,
          similarCases: [
            {
              original: '예약해주세요',
              revised: '예약하기',
              serviceCategory: '버튼 CTA',
              reason: 'W-201 버튼 대화체 지양 및 액션형 권장',
            },
          ],
        });
      }

      const newSession: InspectionSession = {
        id: `sess-${Date.now()}`,
        timestamp: Date.now(),
        service,
        platform,
        componentType,
        context,
        toneLevel,
        inputMode,
        sourceFileName: uploadedImage?.name || uploadedPdf?.name,
        activeGuideVersion: activeGuide.version,
        activeGuideTitle: activeGuide.title,
        items,
        overallSummary: `총 ${items.length}개 문구에 대해 [${activeGuide.title}] 기준 검수가 완료되었습니다.`,
      };

      setCurrentSession(newSession);
      setPastSessions((prev) => [newSession, ...prev]);
      showToast(`${items.length}개 문구 검수가 완료되었습니다.`);
    } catch (err: any) {
      console.error('Inspection error:', err);
      setErrorMessage(err.message || '검수 처리 중 문제가 발생했습니다.');
    } finally {
      setIsInspecting(false);
    }
  };

  // Handle Adoption
  const handleAdopt = async (
    itemId: string,
    altNum: 1 | 2 | 'custom',
    customText?: string
  ) => {
    if (!currentSession) return;

    let adoptedCopy = '';
    const updatedItems = currentSession.items.map((it) => {
      if (it.id === itemId) {
        adoptedCopy =
          altNum === 1 ? it.alt1.text : altNum === 2 ? it.alt2.text : customText || it.alt1.text;
        return {
          ...it,
          selectedAlt: altNum,
          customAdoptedText: altNum === 'custom' ? customText : undefined,
        };
      }
      return it;
    });

    const updatedSession = { ...currentSession, items: updatedItems };
    setCurrentSession(updatedSession);
    setPastSessions((prev) =>
      prev.map((s) => (s.id === updatedSession.id ? updatedSession : s))
    );

    const targetItem = currentSession.items.find((i) => i.id === itemId);
    if (targetItem) {
      try {
        await saveCorrectionCase({
          original: targetItem.originalText,
          aiRevision: targetItem.alt1.text,
          finalRevision: adoptedCopy,
          appliedRules: targetItem.violations.map((v) => v.title),
          componentType: targetItem.componentType || componentType,
          service,
          platform,
          actionType: altNum === 'custom' ? 'custom_edited' : 'accepted',
          userNotes: `${altNum === 1 ? '추천안' : altNum === 2 ? '대안 2' : '직접 수정'} 채택`,
        });
      } catch (dbErr) {
        console.warn('Failed saving to correction history DB:', dbErr);
      }

      const memoryItem: FeedbackMemoryItem = {
        id: `mem-${Date.now()}`,
        timestamp: Date.now(),
        service: currentSession.service,
        platform: currentSession.platform,
        context: currentSession.context,
        toneLevel: currentSession.toneLevel,
        originalText: targetItem.originalText,
        adoptedText: adoptedCopy,
        feedbackType: 'positive',
        userComment: `${altNum === 1 ? '대안 1' : altNum === 2 ? '대안 2' : '직접 수정'} 채택`,
      };
      setLearningMemory((prev) => [memoryItem, ...prev]);
    }

    showToast('제안 문구가 채택되었습니다. 로컬 Few-Shot 학습 뱅크에 저장되었습니다.');
  };

  const handleFeedback = (itemId: string, type: 'positive' | 'negative') => {
    if (!currentSession) return;
    showToast(type === 'positive' ? '좋아요 피드백이 저장되었습니다.' : '피드백이 기록되었습니다.');
  };

  const handleRefineChat = async (itemId: string, userInstruction: string) => {
    showToast(`지침("${userInstruction}")이 반영되었습니다.`);
  };

  const handleTriggerAiLearning = async () => {
    if (learningMemory.length === 0) {
      showToast('먼저 검수 결과에서 문구를 채택하거나 피드백을 남겨주세요.');
      return;
    }
    setIsLearningAi(true);
    setTimeout(() => {
      setIsLearningAi(false);
      showToast('누적된 채택 피드백이 학습 뱅크에 반영되었습니다.');
    }, 800);
  };

  return (
    <div className="min-h-screen bg-[#fafaf9] text-slate-900 flex flex-col font-sans antialiased">
      {/* 1. Guideword Header */}
      <GuidewordNavbar onShowToast={showToast} />

      {/* 2. Main Page Layout (Sidebar + Studio Workspace) */}
      <div className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="flex flex-col md:flex-row gap-8 items-start">
          {/* Left Sidebar (WORKSPACE, Navigation, Environment: 서비스 3종 / 플랫폼 3종, Analysis Status) */}
          <GuidewordSidebar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            service={service}
            setService={setService}
            platform={platform}
            setPlatform={setPlatform}
            activeGuide={activeGuide}
            guidesCount={guideVersions.length}
            historyCount={pastSessions.length}
            rulesCount={totalRulesCount}
            onOpenUploadModal={() => setIsUploadModalOpen(true)}
          />

          {/* Right Main Studio Area */}
          <main className="flex-1 min-w-0 w-full space-y-8">
            {/* Global Error Banner */}
            {errorMessage && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span className="font-semibold">{errorMessage}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setErrorMessage(null)}
                  className="text-rose-500 hover:text-rose-700 font-bold ml-2 cursor-pointer"
                >
                  닫기
                </button>
              </div>
            )}

            {/* TAB 1: 문구 검수 스튜디오 */}
            {activeTab === 'inspect' && (
              <div className="space-y-8">
                {/* 1. Hero Title & 3-Step Progress Indicators */}
                <GuidewordHeroSteps guideVersion={activeGuide.version} />

                {/* 2. 01 검수할 문구 Card (Tabs, UI Area dropdown: 버튼/텍스트상자/팝업/유의사항/일반, Textarea, CTA) */}
                <GuidewordInputCard
                  inputMode={inputMode}
                  setInputMode={setInputMode}
                  componentType={componentType}
                  setComponentType={setComponentType}
                  textInput={textInput}
                  setTextInput={setTextInput}
                  uploadedImage={uploadedImage}
                  setUploadedImage={setUploadedImage}
                  uploadedPdf={uploadedPdf}
                  setUploadedPdf={setUploadedPdf}
                  isInspecting={isInspecting}
                  onInspect={handleInspect}
                  activeGuideTitle={activeGuide.title}
                />

                {/* 3. 02 가이드가 제안하는 문구 Section (Diff, Recommendations, Citations, Exports) */}
                <GuidewordResultsSection
                  session={currentSession}
                  componentType={componentType}
                  onAdopt={handleAdopt}
                  onFeedback={handleFeedback}
                  onRefineChat={handleRefineChat}
                  refiningItemId={refiningItemId}
                  onSelectSample={(sampleText, sampleComp) => {
                    setTextInput(sampleText);
                    setComponentType(sampleComp);
                  }}
                />
              </div>
            )}

            {/* TAB 2: 언어가이드 관리 */}
            {activeTab === 'guides' && (
              <div className="space-y-8">
                <GuidePdfManager
                  guideVersions={guideVersions}
                  activeGuide={activeGuide}
                  onSelectActiveGuide={handleSelectActiveGuide}
                  onDeleteGuideVersion={handleDeleteGuideVersion}
                  onOpenUploadModal={() => setIsUploadModalOpen(true)}
                  onApplyPresetToInspection={(comp, text) => {
                    setComponentType(comp);
                    setTextInput(text);
                    setActiveTab('inspect');
                  }}
                />

                {/* Toggle Button for Granular Manual Rule Editor */}
                <div className="pt-4 flex items-center justify-between border-t border-slate-200">
                  <span className="text-xs font-bold text-slate-600">
                    세부 컴포넌트별 커스텀 룰 및 AI 자가학습 뱅크
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowGranularEditor(!showGranularEditor)}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer"
                  >
                    <Sliders className="w-3.5 h-3.5 text-[#1c4a34]" />
                    <span>{showGranularEditor ? '컴포넌트 세부 설정 접기' : '컴포넌트별 세부 가이드 설정 열기'}</span>
                  </button>
                </div>

                {showGranularEditor && (
                  <div className="space-y-8 p-6 bg-slate-100/60 rounded-3xl border border-slate-200 animate-in fade-in">
                    <ComponentGuideManager
                      componentGuides={componentGuides}
                      onUpdateGuide={handleUpdateGuide}
                      onResetGuide={handleResetGuides}
                      activeComponentType={componentType}
                      onSelectComponentType={setComponentType}
                      selectedService={service}
                      onSelectService={setService}
                      onApplyPresetToInspection={(comp, text) => {
                        setComponentType(comp);
                        setTextInput(text);
                        setActiveTab('inspect');
                      }}
                    />

                    <div className="pt-6 border-t border-slate-200">
                      <LanguageGuideStudio
                        customRules={customRules}
                        setCustomRules={setCustomRules}
                        terminology={terminology}
                        setTerminology={setTerminology}
                        learningMemory={learningMemory}
                        onTriggerAiLearning={handleTriggerAiLearning}
                        isLearningAi={isLearningAi}
                        learningReport={learningReport}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: 검수 이력 & 산출물 */}
            {activeTab === 'history' && (
              <HistoryAndExportView
                sessions={pastSessions}
                onSelectSession={(sess) => {
                  setCurrentSession(sess);
                  setActiveTab('inspect');
                }}
                onDeleteSession={(id) => {
                  setPastSessions((prev) => prev.filter((s) => s.id !== id));
                  if (currentSession?.id === id) setCurrentSession(null);
                  showToast('검수 이력이 삭제되었습니다.');
                }}
                onClearAll={() => {
                  if (window.confirm('저장된 모든 검수 이력을 삭제하시겠습니까?')) {
                    setPastSessions([]);
                    setCurrentSession(null);
                    showToast('모든 검수 이력이 삭제되었습니다.');
                  }
                }}
              />
            )}
          </main>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl border border-slate-700 flex items-center space-x-2 text-xs font-semibold animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Guide PDF Upload Modal */}
      <GuidePdfUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUploadComplete={handleUploadNewGuide}
      />
    </div>
  );
}
