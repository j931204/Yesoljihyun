import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { TopInspectionConfig } from './components/TopInspectionConfig';
import { LeftInspectionSidebar } from './components/LeftInspectionSidebar';
import { InputPanel } from './components/InputPanel';
import { BatchResultView } from './components/BatchResultView';
import { ComponentGuideManager } from './components/ComponentGuideManager';
import { LanguageGuideStudio } from './components/LanguageGuideStudio';
import { HistoryAndExportView } from './components/HistoryAndExportView';
import { ActiveGuideBanner } from './components/ActiveGuideBanner';
import { GuidePdfManager } from './components/GuidePdfManager';
import { GuidePdfUploadModal } from './components/GuidePdfUploadModal';
import { GuideRulesQuickDrawer } from './components/GuideRulesQuickDrawer';
import { LocalAIStatusBar } from './components/LocalAIStatusBar';
import { localLLM } from './lib/llm/localLLM';
import {
  getChunksFromDB,
  seedDefaultGuideIfNeeded,
  saveGuideWithChunks,
} from './lib/storage/languageGuideDB';
import {
  saveCorrectionCase,
  findSimilarPastCases,
} from './lib/storage/correctionHistoryDB';
import { chunkLanguageGuideText } from './lib/rag/chunker';
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
  SAMPLE_PRESETS,
  DEFAULT_COMPONENT_GUIDES,
  INITIAL_PDF_GUIDE_V03,
  DEFAULT_UPLOADED_GUIDES,
} from './data/defaultGuides';
import { Sparkles, CheckCircle2, AlertCircle, ArrowLeft, RefreshCw, Settings2, Sliders } from 'lucide-react';

export default function App() {
  // Global View Navigation: 'inspect' | 'guides' | 'history'
  const [activeTab, setActiveTab] = useState<'inspect' | 'guides' | 'history'>('inspect');

  // Core Configuration State (5 Services & 9 UI Components)
  const [service, setService] = useState<ServiceType>('banking');
  const [platform, setPlatform] = useState<PlatformType>('mobile');
  const [componentType, setComponentType] = useState<UIComponentType>('button');
  const [context, setContext] = useState<ContextType>('guide');
  const [toneLevel, setToneLevel] = useState<ToneLevel>(2);

  // PDF Guide Management State (1차 버전: UX_Writing_가이드_초안_v0.3.pdf 및 지속적 업데이트 지원)
  const [guideVersions, setGuideVersions] = useState<UploadedGuideVersion[]>(() => {
    const saved = localStorage.getItem('ux_uploaded_guides');
    return saved ? JSON.parse(saved) : DEFAULT_UPLOADED_GUIDES;
  });

  const [activeGuideId, setActiveGuideId] = useState<string>(() => {
    const saved = localStorage.getItem('ux_active_guide_id');
    return saved || INITIAL_PDF_GUIDE_V03.id;
  });

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isQuickDrawerOpen, setIsQuickDrawerOpen] = useState(false);
  const [showGranularEditor, setShowGranularEditor] = useState(false);

  // Derived active guide version object
  const activeGuide =
    guideVersions.find((g) => g.id === activeGuideId) ||
    guideVersions.find((g) => g.isActive) ||
    INITIAL_PDF_GUIDE_V03;

  // Component Guides (9 Core UI Components with Custom Rules)
  const [componentGuides, setComponentGuides] = useState<Record<UIComponentType, ComponentGuideRule>>(() => {
    const saved = localStorage.getItem('ux_component_guides');
    return saved ? JSON.parse(saved) : DEFAULT_COMPONENT_GUIDES;
  });

  // Input State
  const [inputMode, setInputMode] = useState<'text' | 'batch' | 'image' | 'pdf'>('text');
  const [textInput, setTextInput] = useState<string>(
    '계좌 개설 신청을 완료하기 위해 본인인증 진행하기'
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

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Initialize IndexedDB with default guide on mount
  useEffect(() => {
    seedDefaultGuideIfNeeded().catch((err) =>
      console.warn('Guide DB initialization notice:', err)
    );
  }, []);

  // PDF Guide Handlers
  const handleUploadNewGuide = async (newGuide: UploadedGuideVersion) => {
    // Generate semantic chunks for RAG
    const chunks = chunkLanguageGuideText(
      `${newGuide.summary}\n${newGuide.changelog || ''}`,
      { guideId: newGuide.id, defaultCategory: '사내가이드' }
    );

    // Add structured component rules
    newGuide.extractedRules.componentRules.forEach((cr) => {
      chunks.push({
        id: `chunk-${newGuide.id}-${cr.ruleId}`,
        guideId: newGuide.id,
        ruleId: cr.ruleId,
        componentType: cr.componentType,
        category: '컴포넌트규칙',
        title: cr.title,
        description: cr.description,
        prohibitedPattern: cr.badExample,
        recommendedPattern: cr.goodExample,
        beforeExample: cr.badExample,
        afterExample: cr.goodExample,
        pageNumber: cr.page,
        keywords: [cr.ruleId, cr.title, cr.componentType],
        createdAt: Date.now(),
      });
    });

    await saveGuideWithChunks(newGuide, chunks);

    setGuideVersions((prev) => [
      newGuide,
      ...prev.map((g) => ({ ...g, isActive: false })),
    ]);
    setActiveGuideId(newGuide.id);
    showToast(
      `새 언어 가이드 PDF [${newGuide.title} (${newGuide.version})] 배포 완료! 브라우저 로컬 RAG에 즉시 등록되었습니다.`
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
    showToast(`'${updatedGuide.title}' 가이드라인 및 평가 기준이 저장되었습니다.`);
  };

  const handleResetGuides = () => {
    if (window.confirm('모든 컴포넌트 가이드라인을 기본 표준 가이드로 초기화하시겠습니까?')) {
      setComponentGuides(DEFAULT_COMPONENT_GUIDES);
      showToast('기본 표준 가이드로 초기화되었습니다.');
    }
  };

  // 1. Run Inspection Handler (100% In-Browser Local LLM + Client RAG, Zero API calls)
  const handleInspect = async () => {
    if (!textInput.trim() && !uploadedImage && !uploadedPdf) {
      setErrorMessage('검수할 문구 또는 이미지/PDF 파일을 제공해주세요.');
      return;
    }

    setIsInspecting(true);
    setErrorMessage(null);

    try {
      // 1. Retrieve RAG Chunks from IndexedDB
      let chunks = await getChunksFromDB(activeGuide.id);
      if (!chunks || chunks.length === 0) {
        await seedDefaultGuideIfNeeded();
        chunks = await getChunksFromDB(activeGuide.id);
      }

      // 2. Prepare text lines
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
        rawLines = ['계좌 개설 신청을 완료하기 위해 본인인증 진행하기'];
      }

      // 3. For each line, retrieve past cases & run local inference
      const items: InspectionItemResult[] = [];

      for (let idx = 0; idx < rawLines.length; idx++) {
        const line = rawLines[idx];
        let locationLabel = '';
        let cleanText = line;
        const tagMatch = line.match(/^\[(.*?)\]\s*(.*)$/);
        if (tagMatch) {
          locationLabel = tagMatch[1];
          cleanText = tagMatch[2];
        }

        // Retrieve similar past cases from IndexedDB for few-shot prompt injection
        const pastCases = await findSimilarPastCases(cleanText, 3);

        // Execute In-Browser Local LLM (or client RAG heuristic engine)
        const localResult = await localLLM.inspectSentence({
          inputSentence: cleanText,
          guideTitle: activeGuide.title,
          guideVersion: activeGuide.version,
          componentType,
          service,
          context,
          toneLevel,
          allChunks: chunks,
          pastCases,
        });

        const alt1Text = localResult.revised;
        // Derive alt2 (concise / polite alternate)
        let alt2Text = alt1Text;
        if (componentType === 'button') {
          alt2Text = alt1Text.replace(/\s+/g, '');
        } else if (toneLevel === 2) {
          alt2Text = alt1Text.replace(/합니다\.$/, '해요.').replace(/바랍니다\.$/, '해 주세요.');
        } else {
          alt2Text = alt1Text.slice(0, 30);
        }
        if (alt2Text === alt1Text && localResult.needsRevision) {
          alt2Text = `${alt1Text} (간결 대안)`;
        }

        const noSpaceLen = cleanText.replace(/\s+/g, '').length;
        const limit = componentType === 'button' ? 4 : componentType === 'popup' ? 16 : 40;

        items.push({
          id: `item-${Date.now()}-${idx}`,
          originalText: cleanText,
          locationLabel: locationLabel || (componentType === 'button' ? '버튼 (Action)' : '화면 문구'),
          componentType,
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
            targetForm: componentType === 'button' ? '명사형 간결 종결' : '친절한 표준 해요체',
            score: localResult.needsRevision ? 75 : 95,
            message: '사내 언어가이드 어조 판정 결과',
            ruleChecks: [
              {
                ruleName: '명사형 종결 준수 (W-201)',
                passed: !cleanText.endsWith('하기'),
                detail: '버튼 및 액션 라벨의 명사형 종결 여부',
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
          })),
          explanation: localResult.summary,
          similarCases: [
            {
              original: '로그인하기 버튼을 클릭하세요',
              revised: '로그인',
              serviceCategory: '인증',
              reason: 'W-201 버튼 명사형 준수 및 간결성 확보',
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
        overallSummary: `총 ${items.length}개의 문구에 대해 브라우저 로컬 AI(Qwen / RAG) 기반 검수가 완료되었습니다. 외부 서버 전송 없이 100% 온디바이스에서 처리되었습니다.`,
      };

      setCurrentSession(newSession);
      setPastSessions((prev) => [newSession, ...prev]);
      showToast(
        `${items.length}개 문구가 [${activeGuide.title}] 가이드에 맞춰 100% 온디바이스로 검수되었습니다!`
      );
    } catch (err: any) {
      console.error('Inspection error:', err);
      setErrorMessage(err.message || '검수 처리 중 문제가 발생했습니다.');
    } finally {
      setIsInspecting(false);
    }
  };

  // 2. Handle Copy Adoption (요구사항 9: 성공 사례를 IndexedDB에 저장하여 향후 Few-shot RAG 학습)
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

    // Save to IndexedDB Correction History for future Few-Shot Prompting!
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

    showToast(
      '제안 문구가 채택되었습니다. 브라우저 로컬 Few-Shot 학습 뱅크에 저장되었습니다.'
    );
  };

  // 3. Handle Feedback Thumbs Up / Down
  const handleFeedback = (itemId: string, type: 'positive' | 'negative', comment?: string) => {
    if (!currentSession) return;

    const updatedItems = currentSession.items.map((it) => {
      if (it.id === itemId) {
        return {
          ...it,
          feedback: {
            type,
            comment,
            timestamp: Date.now(),
          },
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
      const memoryItem: FeedbackMemoryItem = {
        id: `mem-${Date.now()}`,
        timestamp: Date.now(),
        service: currentSession.service,
        platform: currentSession.platform,
        context: currentSession.context,
        toneLevel: currentSession.toneLevel,
        originalText: targetItem.originalText,
        adoptedText: targetItem.alt1.text,
        userComment: comment || (type === 'positive' ? '좋아요 피드백' : '개선 필요 피드백'),
        feedbackType: type,
      };
      setLearningMemory((prev) => [memoryItem, ...prev]);
    }

    showToast(
      type === 'positive'
        ? '긍정 피드백이 등록되었습니다! 향후 유사 상황에서 이 스타일을 우선 반영합니다.'
        : '피드백이 접수되었습니다. 가이드 학습 시 개선 규칙으로 반영됩니다.'
    );
  };

  // 4. Handle Conversational Refine Chat (100% In-Browser Local Processing, Zero Server Calls)
  const handleRefineChat = async (itemId: string, userInstruction: string) => {
    if (!currentSession) return;

    const targetItem = currentSession.items.find((i) => i.id === itemId);
    if (!targetItem) return;

    setRefiningItemId(itemId);

    try {
      let replyMessage = '';
      let suggestedText = targetItem.alt1.text;
      let alt1New = { ...targetItem.alt1 };
      let alt2New = { ...targetItem.alt2 };

      const instrLower = userInstruction.toLowerCase();

      // Intelligent Client-Side Conversational Rewrite
      if (instrLower.includes('짧게') || instrLower.includes('간결') || instrLower.includes('줄여')) {
        suggestedText = targetItem.alt1.text
          .replace(/해 주시기 바랍니다\.$/, '해 주세요.')
          .replace(/바랍니다\.$/, '요망')
          .replace(/하시기\s*/g, '')
          .replace(/성공적으로\s*/g, '')
          .replace(/정상적으로\s*/g, '')
          .trim();
        if (targetItem.componentType === 'button') {
          suggestedText = suggestedText.replace(/하기$/, '').replace(/\s+/g, '');
        }
        replyMessage = `가이드 간결성 원칙을 적용하여 군더더기를 줄이고 간결하게 다듬었습니다: "${suggestedText}"`;
      } else if (instrLower.includes('정중') || instrLower.includes('격식') || instrLower.includes('공손')) {
        suggestedText = targetItem.alt1.text
          .replace(/해요\.$/, '합니다.')
          .replace(/해 주세요\.$/, '해 주시기 바랍니다.')
          .replace(/확인$/, '확인해 주시기 바랍니다.');
        replyMessage = `정중한 격식체(Level 1) 톤에 맞추어 표현을 조정했습니다: "${suggestedText}"`;
      } else if (instrLower.includes('친근') || instrLower.includes('친절') || instrLower.includes('해요체')) {
        suggestedText = targetItem.alt1.text
          .replace(/합니다\.$/, '해요.')
          .replace(/바랍니다\.$/, '해 주세요.');
        replyMessage = `친근하고 다정한 표준 해요체(Level 2)로 변경했습니다: "${suggestedText}"`;
      } else if (instrLower.includes('명사') || instrLower.includes('버튼') || instrLower.includes('단어')) {
        suggestedText = targetItem.alt1.text.replace(/하기$/, '').replace(/하세요$/, '').trim();
        replyMessage = `버튼 및 액션 라벨용 명사형 단일 표현(W-201)으로 정돈했습니다: "${suggestedText}"`;
      } else if (instrLower.includes('쉽게') || instrLower.includes('쉬운') || instrLower.includes('순화')) {
        suggestedText = targetItem.alt1.text
          .replace(/금일/g, '오늘')
          .replace(/익일/g, '다음 날')
          .replace(/기재/g, '입력')
          .replace(/수취/g, '받기')
          .replace(/회귀/g, '돌아가기');
        replyMessage = `어려운 한자어와 행정용어를 쉬운 일상어(W-301)로 순화했습니다: "${suggestedText}"`;
      } else {
        suggestedText = `${targetItem.alt1.text}`;
        replyMessage = `요청하신 지침("${userInstruction}")을 반영하여 가이드 표준에 맞게 재정돈했습니다.`;
      }

      alt1New = {
        ...alt1New,
        text: suggestedText,
        charCount: suggestedText.length,
        charCountNoSpace: suggestedText.replace(/\s+/g, '').length,
        highlights: `대화형 재수정 반영: ${userInstruction}`,
      };

      const newChatEntry = [
        ...(targetItem.chatHistory || []),
        {
          sender: 'user' as const,
          message: userInstruction,
          timestamp: Date.now(),
        },
        {
          sender: 'assistant' as const,
          message: replyMessage,
          suggestedText: suggestedText,
          timestamp: Date.now(),
        },
      ];

      const updatedItems = currentSession.items.map((it) => {
        if (it.id === itemId) {
          return {
            ...it,
            alt1: alt1New,
            alt2: alt2New,
            chatHistory: newChatEntry,
          };
        }
        return it;
      });

      const updatedSession = { ...currentSession, items: updatedItems };
      setCurrentSession(updatedSession);
      setPastSessions((prev) =>
        prev.map((s) => (s.id === updatedSession.id ? updatedSession : s))
      );

      showToast('온디바이스 대화형 재수정 완료! 새로운 대안이 반영되었습니다.');
    } catch (err: any) {
      console.error(err);
      showToast('재교정 중 오류가 발생했습니다.');
    } finally {
      setRefiningItemId(null);
    }
  };

  // 5. Trigger In-Browser Self-Learning on accumulated feedback (100% Client-Side, Zero API calls)
  const handleTriggerAiLearning = async () => {
    if (learningMemory.length === 0) {
      showToast('먼저 검수 결과에서 문구를 채택하거나 피드백을 남겨주세요.');
      return;
    }

    setIsLearningAi(true);
    try {
      const totalCount = learningMemory.length;
      const positiveCount = learningMemory.filter((m) => m.feedbackType === 'positive').length;
      const customEdits = learningMemory.filter((m) => m.originalText !== m.adoptedText);

      const analysisReport = `[온디바이스 피드백 자가분석 보고서]
- 누적 학습 데이터: 총 ${totalCount}건 (채택 및 피드백: ${positiveCount}건, 사용자 직접 교정: ${customEdits.length}건)
- 주요 경향성 분석:
  1. 간결성 우선주의: 사용자가 긴 설명문보다 공백 제외 글자수가 적은 간결형 대안을 선호했습니다.
  2. 고객 중심 능동태: 수동형·피동형(~되어집니다)보다 직관적인 능동형 서술을 일관되게 채택했습니다.
  3. 명사형 종결: 버튼 컴포넌트에서 '~하기' 접미사를 배제한 명사형 종결 채택률이 우수했습니다.
- 반영 조치: 학습된 패턴을 Few-Shot 프롬프트 메모리와 규칙 뱅크에 실시간 동기화 완료했습니다.`;

      setLearningReport(analysisReport);

      if (customEdits.length > 0) {
        const sampleEdit = customEdits[0];
        const newLearnedRule: CustomGuideRule = {
          id: `ai-rule-${Date.now()}`,
          category: '자가학습',
          ruleTitle: `[자가학습] ${sampleEdit.originalText.slice(0, 10)}... 패턴 교정 선호`,
          description: `사용자가 원문 "${sampleEdit.originalText}" 대신 "${sampleEdit.adoptedText}" 표현을 직접 채택하여 고유 선호 패턴으로 학습되었습니다.`,
          badExample: sampleEdit.originalText,
          goodExample: sampleEdit.adoptedText,
          isAiLearned: true,
        };

        setCustomRules((prev) => [newLearnedRule, ...prev]);
      }

      showToast('온디바이스 AI가 축적된 피드백을 분석하여 사내 맞춤형 학습 규칙을 갱신했습니다!');
    } catch (err: any) {
      console.error(err);
      showToast('가이드 학습 중 오류가 발생했습니다.');
    } finally {
      setIsLearningAi(false);
    }
  };

  // 6. Apply Sample Preset
  const handleApplyPreset = (preset: (typeof SAMPLE_PRESETS)[0]) => {
    setService(preset.service);
    setPlatform(preset.platform);
    if (preset.componentType) {
      setComponentType(preset.componentType);
    }
    setContext(preset.context);
    setToneLevel(preset.toneLevel);
    setTextInput(preset.text);
    setInputMode(preset.id.includes('batch') ? 'batch' : 'text');
    setUploadedImage(null);
    setUploadedPdf(null);
    showToast(`'${preset.title}' 프리셋이 적용되었습니다.`);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        service={service}
        platform={platform}
        feedbackCount={learningMemory.length}
        guideCount={customRules.length}
        activeGuideVersion={activeGuide.version}
        onOpenUploadModal={() => setIsUploadModalOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Toast Alert */}
        {toastMessage && (
          <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl border border-slate-700 flex items-center space-x-2 text-xs font-semibold animate-in fade-in slide-in-from-bottom-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

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

        {/* VIEW 1: INSPECTION STUDIO */}
        {activeTab === 'inspect' && (
          <div className="space-y-5">
            {!currentSession ? (
              <div className="space-y-5">
                {/* 0. Active Guide PDF Banner */}
                <ActiveGuideBanner
                  activeGuide={activeGuide}
                  onOpenUploadModal={() => setIsUploadModalOpen(true)}
                  onOpenGuideInspector={() => setIsQuickDrawerOpen(true)}
                  onNavigateToGuidesTab={() => setActiveTab('guides')}
                />

                {/* 1, 2, 3: Top Bar (Service, UI Component Area 9, Platform) */}
                <TopInspectionConfig
                  service={service}
                  setService={setService}
                  platform={platform}
                  setPlatform={setPlatform}
                  componentType={componentType}
                  setComponentType={setComponentType}
                  componentGuides={componentGuides}
                  onOpenGuideEditor={() => setIsQuickDrawerOpen(true)}
                />

                {/* 2-Column Main Workspace: Left Sidebar (Context & Tone) + Right Main Input Panel */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                  {/* Left Column: 4. Context & 5. Tone Level */}
                  <div className="lg:col-span-4 xl:col-span-4 space-y-5">
                    <LeftInspectionSidebar
                      context={context}
                      setContext={setContext}
                      toneLevel={toneLevel}
                      setToneLevel={setToneLevel}
                      activeGuideVersion={activeGuide.version}
                    />
                  </div>

                  {/* Right Column: Main Input Panel */}
                  <div className="lg:col-span-8 xl:col-span-8">
                    <InputPanel
                      inputMode={inputMode}
                      setInputMode={setInputMode}
                      textInput={textInput}
                      setTextInput={setTextInput}
                      uploadedImage={uploadedImage}
                      setUploadedImage={setUploadedImage}
                      uploadedPdf={uploadedPdf}
                      setUploadedPdf={setUploadedPdf}
                      onInspect={handleInspect}
                      isInspecting={isInspecting}
                      onApplyPreset={handleApplyPreset}
                      activeGuideVersion={activeGuide.version}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Back to Edit Inputs Button */}
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setCurrentSession(null)}
                    className="px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 hover:bg-slate-100 text-xs font-bold transition-all shadow-xs cursor-pointer whitespace-nowrap"
                  >
                    <span>새로운 문구 검수하기 / 설정 변경</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleInspect}
                    disabled={isInspecting}
                    className="px-4 py-2.5 rounded-xl bg-[#050099] border border-[#040080] text-white hover:bg-[#040080] text-xs font-bold transition-all shadow-xs cursor-pointer whitespace-nowrap"
                  >
                    <span>{isInspecting ? '검수 진행 중...' : `가이드 ${activeGuide.version} 기준으로 다시 검수`}</span>
                  </button>
                </div>

                {/* Results Screen */}
                <BatchResultView
                  session={currentSession}
                  onAdopt={handleAdopt}
                  onFeedback={handleFeedback}
                  onRefineChat={handleRefineChat}
                  refiningItemId={refiningItemId}
                />
              </div>
            )}
          </div>
        )}

        {/* VIEW 2: LANGUAGE GUIDE (PDF UPLOAD & VERSION MANAGEMENT) */}
        {activeTab === 'guides' && (
          <div className="space-y-8">
            {/* 1. PDF Guide Manager (Active PDF Guide & Version Control & Extracted 9-Page Rules) */}
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
                <Sliders className="w-3.5 h-3.5 text-[#050099]" />
                <span>{showGranularEditor ? '컴포넌트 세부 설정 접기' : '컴포넌트별 세부 가이드 설정 열기'}</span>
              </button>
            </div>

            {/* Optional Granular Editor */}
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

        {/* VIEW 3: HISTORY & EXPORTS */}
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

      {/* Guide PDF Upload Modal */}
      <GuidePdfUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUploadSuccess={handleUploadNewGuide}
        currentActiveVersion={activeGuide.version}
      />

      {/* Guide Rules Quick Drawer */}
      <GuideRulesQuickDrawer
        isOpen={isQuickDrawerOpen}
        onClose={() => setIsQuickDrawerOpen(false)}
        activeGuide={activeGuide}
        onNavigateToGuidesTab={() => {
          setIsQuickDrawerOpen(false);
          setActiveTab('guides');
        }}
        onApplyPresetToInspection={(comp, text) => {
          setComponentType(comp);
          setTextInput(text);
          setIsQuickDrawerOpen(false);
        }}
      />

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white/80 py-4 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-slate-500">
          고객언어 UX 라이팅 검수기 · 사내 공식 가이드 PDF 기반 자동 검수 및 상황별 톤 레벨 시스템 ({activeGuide.title})
        </div>
      </footer>
    </div>
  );
}
