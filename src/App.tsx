import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { TopInspectionConfig } from './components/TopInspectionConfig';
import { LeftInspectionSidebar } from './components/LeftInspectionSidebar';
import { InputPanel } from './components/InputPanel';
import { BatchResultView } from './components/BatchResultView';
import { ComponentGuideManager } from './components/ComponentGuideManager';
import { LanguageGuideStudio } from './components/LanguageGuideStudio';
import { HistoryAndExportView } from './components/HistoryAndExportView';
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
} from './types';
import {
  DEFAULT_GUIDE_RULES,
  DEFAULT_TERMINOLOGY,
  SAMPLE_PRESETS,
  DEFAULT_COMPONENT_GUIDES,
} from './data/defaultGuides';
import { Sparkles, CheckCircle2, AlertCircle, ArrowLeft, RefreshCw, Settings2 } from 'lucide-react';

export default function App() {
  // Global View Navigation: 'inspect' | 'guides' | 'history'
  const [activeTab, setActiveTab] = useState<'inspect' | 'guides' | 'history'>('inspect');

  // Core Configuration State (5 Services & 9 UI Components)
  const [service, setService] = useState<ServiceType>('banking');
  const [platform, setPlatform] = useState<PlatformType>('mobile');
  const [componentType, setComponentType] = useState<UIComponentType>('button');
  const [context, setContext] = useState<ContextType>('guide');
  const [toneLevel, setToneLevel] = useState<ToneLevel>(2);

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

  // 1. Run Inspection Handler
  const handleInspect = async () => {
    if (!textInput.trim() && !uploadedImage && !uploadedPdf) {
      setErrorMessage('검수할 문구 또는 이미지/PDF 파일을 제공해주세요.');
      return;
    }

    setIsInspecting(true);
    setErrorMessage(null);

    const activeCompGuide = componentGuides[componentType] || DEFAULT_COMPONENT_GUIDES[componentType];

    try {
      const response = await fetch('/api/gemini/inspect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service,
          platform,
          componentType,
          componentGuide: activeCompGuide,
          context,
          toneLevel,
          text: textInput,
          image: uploadedImage,
          pdf: uploadedPdf,
          customRules,
          terminology,
          learningMemory,
        }),
      });

      const json = await response.json();

      if (!json.success) {
        throw new Error(json.error || '검수 중 오류가 발생했습니다.');
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
        items: json.data.items || [],
        overallSummary: json.data.overallSummary || '',
      };

      setCurrentSession(newSession);
      setPastSessions((prev) => [newSession, ...prev]);
      showToast(`${newSession.items.length}개의 문구가 [${activeCompGuide.title}] 가이드에 맞춰 검수되었습니다!`);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || '검수 통신 중 문제가 발생했습니다. 다시 시도해 주세요.');
    } finally {
      setIsInspecting(false);
    }
  };

  // 2. Handle Copy Adoption
  const handleAdopt = (itemId: string, altNum: 1 | 2 | 'custom', customText?: string) => {
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

    // Record in Learning Memory
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
        adoptedText: adoptedCopy,
        feedbackType: 'positive',
        userComment: `${altNum === 1 ? '대안 1' : altNum === 2 ? '대안 2' : '직접 수정'} 채택`,
      };
      setLearningMemory((prev) => [memoryItem, ...prev]);
    }

    showToast('제안 문구가 채택되었습니다. AI 자가학습 뱅크에 선호 패턴으로 저장되었습니다.');
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

  // 4. Handle Conversational Refine Chat
  const handleRefineChat = async (itemId: string, userInstruction: string) => {
    if (!currentSession) return;

    const targetItem = currentSession.items.find((i) => i.id === itemId);
    if (!targetItem) return;

    setRefiningItemId(itemId);

    try {
      const response = await fetch('/api/gemini/refine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          item: targetItem,
          userInstruction,
          service: currentSession.service,
          platform: currentSession.platform,
          componentType: currentSession.componentType || componentType,
          context: currentSession.context,
          toneLevel: currentSession.toneLevel,
          chatHistory: targetItem.chatHistory || [],
        }),
      });

      const json = await response.json();
      if (!json.success) {
        throw new Error(json.error || '재교정 요청 처리 중 오류가 발생했습니다.');
      }

      const { replyMessage, suggestedText, alt1, alt2 } = json.data;

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
            alt1: alt1 || it.alt1,
            alt2: alt2 || it.alt2,
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

      showToast('대화형 재수정 완료! 새로운 대안이 반영되었습니다.');
    } catch (err: any) {
      console.error(err);
      showToast('재교정 중 오류가 발생했습니다.');
    } finally {
      setRefiningItemId(null);
    }
  };

  // 5. Trigger AI Self-Learning on accumulated feedback
  const handleTriggerAiLearning = async () => {
    if (learningMemory.length === 0) {
      showToast('먼저 검수 결과에서 문구를 채택하거나 피드백을 남겨주세요.');
      return;
    }

    setIsLearningAi(true);
    try {
      const response = await fetch('/api/gemini/learn-guide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feedbackList: learningMemory,
          currentRules: customRules,
          terminology,
        }),
      });

      const json = await response.json();
      if (!json.success) {
        throw new Error(json.error || '가이드 학습에 실패했습니다.');
      }

      const { analysisReport, newRules, newTerms } = json.data;
      setLearningReport(analysisReport);

      if (newRules?.length) {
        const mappedRules: CustomGuideRule[] = newRules.map((r: any, idx: number) => ({
          id: `ai-rule-${Date.now()}-${idx}`,
          category: r.category || '자가학습',
          ruleTitle: r.ruleTitle,
          description: r.description,
          badExample: r.badExample,
          goodExample: r.goodExample,
          isAiLearned: true,
        }));
        setCustomRules((prev) => [...mappedRules, ...prev]);
      }

      if (newTerms?.length) {
        const mappedTerms: TerminologyRule[] = newTerms.map((t: any, idx: number) => ({
          id: `ai-term-${Date.now()}-${idx}`,
          prohibitedTerm: t.prohibitedTerm,
          recommendedTerm: t.recommendedTerm,
          reason: t.reason,
        }));
        setTerminology((prev) => [...mappedTerms, ...prev]);
      }

      showToast('AI가 축적된 피드백을 분석하여 새로운 언어 가이드 규칙을 생성했습니다!');
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
                {/* 1, 2, 3: Top Bar (Service, UI Component Area 9, Platform) */}
                <TopInspectionConfig
                  service={service}
                  setService={setService}
                  platform={platform}
                  setPlatform={setPlatform}
                  componentType={componentType}
                  setComponentType={setComponentType}
                  componentGuides={componentGuides}
                  onOpenGuideEditor={() => setActiveTab('guides')}
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
                    <span>{isInspecting ? '검수 진행 중...' : '현재 설정으로 다시 검수'}</span>
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

        {/* VIEW 2: COMPONENT GUIDELINES & EVALUATION CRITERIA STUDIO */}
        {activeTab === 'guides' && (
          <div className="space-y-8">
            {/* 1. Component Guide Manager (9 UI Areas / Evaluation Rules) */}
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

            {/* 2. Language Rules & AI Self-Learning Bank */}
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

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white/80 py-4 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-slate-500">
          고객언어 UX 라이팅 검수기 · 표준 9대 컴포넌트 가이드라인 & 최적 글자수/말투 평가 시스템
        </div>
      </footer>
    </div>
  );
}
