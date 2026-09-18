import React, { useState } from 'react';
import {
  MousePointerClick,
  Layers,
  Tag,
  HelpCircle,
  FormInput,
  MessageSquare,
  Bell,
  AlertCircle,
  FileText,
  Sparkles,
  Edit3,
  Save,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Plus,
  Trash2,
  Sliders,
  Type,
  AlignLeft,
  ChevronRight,
  BookOpen,
} from 'lucide-react';
import { UIComponentType, ComponentGuideRule, ServiceType } from '../types';
import { DEFAULT_COMPONENT_GUIDES, SERVICES_CONFIG } from '../data/defaultGuides';

interface ComponentGuideManagerProps {
  componentGuides: Record<UIComponentType, ComponentGuideRule>;
  onUpdateGuide: (type: UIComponentType, updated: ComponentGuideRule) => void;
  onResetGuide: (type: UIComponentType) => void;
  activeComponentType: UIComponentType;
  onSelectComponentType: (type: UIComponentType) => void;
  selectedService: ServiceType;
  onSelectService: (s: ServiceType) => void;
  onApplyPresetToInspection?: (componentType: UIComponentType, sampleText: string) => void;
}

const COMPONENT_TAB_CONFIG: Array<{
  id: UIComponentType;
  label: string;
  icon: React.ReactNode;
  badge: string;
}> = [
  { id: 'button', label: '버튼', icon: <MousePointerClick className="w-4 h-4" />, badge: '4자 원칙' },
  { id: 'bottom_sheet', label: '바텀시트', icon: <Layers className="w-4 h-4" />, badge: '18자·2줄' },
  { id: 'popup', label: '팝업/모달', icon: <MessageSquare className="w-4 h-4" />, badge: '두괄식·3줄' },
  { id: 'label', label: '레이블/태그', icon: <Tag className="w-4 h-4" />, badge: '6자 이내' },
  { id: 'tooltip', label: '툴팁/도움말', icon: <HelpCircle className="w-4 h-4" />, badge: '40자·2줄' },
  { id: 'textfield', label: '텍스트 필드', icon: <FormInput className="w-4 h-4" />, badge: '플레이스홀더' },
  { id: 'toast', label: '토스트', icon: <Bell className="w-4 h-4" />, badge: '25자·1줄' },
  { id: 'notice_error', label: '헤드/오류메시지', icon: <AlertCircle className="w-4 h-4" />, badge: '원인+행동' },
  { id: 'precaution', label: '유의사항', icon: <FileText className="w-4 h-4" />, badge: '불릿 포인트' },
];

export const ComponentGuideManager: React.FC<ComponentGuideManagerProps> = ({
  componentGuides,
  onUpdateGuide,
  onResetGuide,
  activeComponentType,
  onSelectComponentType,
  selectedService,
  onSelectService,
  onApplyPresetToInspection,
}) => {
  const currentGuide = componentGuides[activeComponentType] || DEFAULT_COMPONENT_GUIDES[activeComponentType];
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState<ComponentGuideRule>(currentGuide);
  const [newForbiddenPattern, setNewForbiddenPattern] = useState('');
  const [newPrinciple, setNewPrinciple] = useState('');
  const [saveToast, setSaveToast] = useState(false);

  // Sync edit form when active component changes
  React.useEffect(() => {
    setEditFormData(componentGuides[activeComponentType] || DEFAULT_COMPONENT_GUIDES[activeComponentType]);
    setIsEditing(false);
  }, [activeComponentType, componentGuides]);

  const handleSave = () => {
    onUpdateGuide(activeComponentType, editFormData);
    setIsEditing(false);
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2500);
  };

  const handleReset = () => {
    if (confirm(`'${currentGuide.title}' 가이드를 기본 표준 가이드로 초기화하시겠습니까?`)) {
      onResetGuide(activeComponentType);
      setEditFormData(DEFAULT_COMPONENT_GUIDES[activeComponentType]);
      setIsEditing(false);
    }
  };

  const addForbiddenPattern = () => {
    if (!newForbiddenPattern.trim()) return;
    setEditFormData((prev) => ({
      ...prev,
      toneEndingRule: {
        ...prev.toneEndingRule,
        forbiddenPatterns: [...prev.toneEndingRule.forbiddenPatterns, newForbiddenPattern.trim()],
      },
    }));
    setNewForbiddenPattern('');
  };

  const removeForbiddenPattern = (index: number) => {
    setEditFormData((prev) => ({
      ...prev,
      toneEndingRule: {
        ...prev.toneEndingRule,
        forbiddenPatterns: prev.toneEndingRule.forbiddenPatterns.filter((_, i) => i !== index),
      },
    }));
  };

  const addPrinciple = () => {
    if (!newPrinciple.trim()) return;
    setEditFormData((prev) => ({
      ...prev,
      corePrinciples: [...prev.corePrinciples, newPrinciple.trim()],
    }));
    setNewPrinciple('');
  };

  const removePrinciple = (index: number) => {
    setEditFormData((prev) => ({
      ...prev,
      corePrinciples: prev.corePrinciples.filter((_, i) => i !== index),
    }));
  };

  return (
    <div id="component-guide-manager-root" className="space-y-4">
      {/* Header Bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-[#050099] mb-1">
            <BookOpen className="w-4 h-4" />
            <span>표준 UX 라이팅 & 엔터프라이즈 가이드라인</span>
            <span className="text-slate-300">|</span>
            <span className="text-slate-500 font-normal">콘텐츠 유형별 글쓰기 원칙</span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
            <span>콘텐츠 유형별 평가 기준 가이드 관리</span>
            <span className="text-xs bg-[#050099]/10 text-[#050099] px-2.5 py-0.5 rounded-full border border-[#050099]/20 font-medium">
              실시간 AI 검수 연동
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            버튼, 팝업, 바텀시트 등 UI 영역별 최적 글자 수 규정(공백 제외 기준)과 말투 규칙을 직접 설정하고 즉시 검수에 적용합니다.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2 shrink-0">
          {isEditing ? (
            <>
              <button
                type="button"
                id="btn-cancel-edit-guide"
                onClick={() => {
                  setEditFormData(currentGuide);
                  setIsEditing(false);
                }}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all cursor-pointer whitespace-nowrap"
              >
                취소
              </button>
              <button
                type="button"
                id="btn-save-guide"
                onClick={handleSave}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#050099] hover:bg-[#040080] transition-all shadow-xs cursor-pointer whitespace-nowrap"
              >
                <span>가이드 저장 및 검수 반영</span>
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                id="btn-reset-guide-default"
                onClick={handleReset}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-all cursor-pointer whitespace-nowrap"
                title="기본 표준 가이드로 되돌리기"
              >
                <span>표준 가이드 초기화</span>
              </button>
              <button
                type="button"
                id="btn-start-edit-guide"
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 transition-all shadow-xs cursor-pointer whitespace-nowrap"
              >
                <span>이 컴포넌트 가이드 수정</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Save Notification Toast */}
      {saveToast && (
        <div className="bg-emerald-600 text-white text-xs font-semibold py-2.5 px-4 rounded-xl shadow-md flex items-center space-x-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>가이드가 성공적으로 저장되었습니다. 이후 수행되는 모든 문구 검수에 실시간 적용됩니다.</span>
        </div>
      )}

      {/* 9-Component Tabs Bar (표준 UX 라이팅 네비게이션) */}
      <div className="bg-white rounded-2xl p-2 border border-slate-200 shadow-xs overflow-x-auto">
        <div className="flex items-center space-x-1.5 min-w-max">
          {COMPONENT_TAB_CONFIG.map((tab) => {
            const isSelected = activeComponentType === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                id={`guide-tab-${tab.id}`}
                onClick={() => onSelectComponentType(tab.id)}
                className={`flex items-center space-x-2 py-2 px-3.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#050099] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono ${
                    isSelected ? 'bg-[#040080] text-white' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {tab.badge}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column (7 cols): Guidelines, Char limits, Tone rules */}
        <div className="lg:col-span-7 space-y-4">
          {/* Card: 글자 수 규정 & 말투 기준 */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#050099]"></span>
                <h3 className="text-base font-bold text-slate-900">
                  {isEditing ? editFormData.title : currentGuide.title} 평가 가이드
                </h3>
              </div>
              <span className="text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg font-mono font-medium">
                {currentGuide.badge}
              </span>
            </div>

            {/* 1. 글자 수 규정 섹션 */}
            <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-xs font-bold text-slate-800">
                  <Type className="w-4 h-4 text-[#050099]" />
                  <span>글자 수 규정 (공백 제외 기준)</span>
                </div>
                <span className="text-[11px] text-[#050099] font-semibold bg-[#050099]/10 px-2 py-0.5 rounded border border-[#050099]/20">
                  가이드 엄수
                </span>
              </div>

              {isEditing ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      기본 단일(Single) 최대 글자수
                    </label>
                    <div className="flex items-center space-x-1.5">
                      <input
                        type="number"
                        min="1"
                        max="200"
                        value={editFormData.charLimitRule.singleMax}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            charLimitRule: {
                              ...editFormData.charLimitRule,
                              singleMax: parseInt(e.target.value) || 4,
                            },
                          })
                        }
                        className="w-20 px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#050099]/20 focus:outline-hidden font-bold"
                      />
                      <span className="text-xs text-slate-500">글자 이내</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      행동 유도 CTA 확장 허용치
                    </label>
                    <div className="flex items-center space-x-1.5">
                      <input
                        type="number"
                        min="1"
                        max="200"
                        value={editFormData.charLimitRule.ctaMax || 12}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            charLimitRule: {
                              ...editFormData.charLimitRule,
                              ctaMax: parseInt(e.target.value) || 12,
                            },
                          })
                        }
                        className="w-20 px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#050099]/20 focus:outline-hidden font-bold"
                      />
                      <span className="text-xs text-slate-500">글자 이내</span>
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      글자 수 기준 해설 문구
                    </label>
                    <input
                      type="text"
                      value={editFormData.charLimitRule.unitDescription}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          charLimitRule: {
                            ...editFormData.charLimitRule,
                            unitDescription: e.target.value,
                          },
                        })
                      }
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#050099]/20 focus:outline-hidden"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-xs">
                    <span className="font-bold text-[#050099] bg-[#050099]/10 px-2 py-0.5 rounded">
                      권장: {currentGuide.charLimitRule.singleMax}자 이내
                    </span>
                    {currentGuide.charLimitRule.ctaMax && (
                      <span className="text-slate-600 bg-slate-200/70 px-2 py-0.5 rounded">
                        CTA 행동유도 시: 최대 {currentGuide.charLimitRule.ctaMax}자
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-700 font-medium leading-relaxed">
                    • {currentGuide.charLimitRule.notes}
                  </p>
                </div>
              )}
            </div>

            {/* 2. 말투 및 어조 기준 섹션 */}
            <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-xs font-bold text-slate-800">
                  <AlignLeft className="w-4 h-4 text-[#050099]" />
                  <span>말투 및 종결어미 기준</span>
                </div>
              </div>

              {isEditing ? (
                <div className="space-y-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      선호 어조 / 종결 형태
                    </label>
                    <input
                      type="text"
                      value={editFormData.toneEndingRule.preferredForm}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          toneEndingRule: {
                            ...editFormData.toneEndingRule,
                            preferredForm: e.target.value,
                          },
                        })
                      }
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#050099]/20 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      절대 금지 표현 및 패턴 목록
                    </label>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {editFormData.toneEndingRule.forbiddenPatterns.map((pat, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center space-x-1 text-xs bg-rose-50 text-rose-700 px-2 py-0.5 rounded-lg border border-rose-200"
                        >
                          <span>{pat}</span>
                          <button
                            type="button"
                            onClick={() => removeForbiddenPattern(idx)}
                            className="hover:text-rose-900 cursor-pointer ml-1"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        placeholder="새 금지어 입력 (예: ~하기, ~되어집니다)"
                        value={newForbiddenPattern}
                        onChange={(e) => setNewForbiddenPattern(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addForbiddenPattern())}
                        className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#050099]/20 focus:outline-hidden"
                      />
                      <button
                        type="button"
                        onClick={addForbiddenPattern}
                        className="px-3 py-1.5 text-xs font-semibold text-[#050099] bg-[#050099]/10 hover:bg-[#050099]/20 rounded-lg border border-[#050099]/20 transition-all flex items-center space-x-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>추가</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2.5">
                  <div className="flex items-start space-x-2 text-xs">
                    <span className="font-semibold text-slate-500 shrink-0">선호 형태:</span>
                    <span className="font-bold text-slate-900">{currentGuide.toneEndingRule.preferredForm}</span>
                  </div>
                  <div className="text-xs text-slate-700">
                    <p className="leading-relaxed">• {currentGuide.toneEndingRule.description}</p>
                  </div>
                  <div className="flex items-start space-x-2 text-xs pt-1">
                    <span className="font-semibold text-rose-600 shrink-0">금지 패턴:</span>
                    <div className="flex flex-wrap gap-1">
                      {currentGuide.toneEndingRule.forbiddenPatterns.map((pat, idx) => (
                        <span
                          key={idx}
                          className="text-[11px] bg-rose-50 text-rose-700 px-2 py-0.5 rounded border border-rose-200 font-mono font-medium"
                        >
                          {pat}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 3. 핵심 원칙 목록 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                <span>핵심 작성 원칙 (Core Principles)</span>
              </div>

              {isEditing ? (
                <div className="space-y-2">
                  <div className="space-y-1.5">
                    {editFormData.corePrinciples.map((pr, idx) => (
                      <div key={idx} className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-[#050099]">{idx + 1}.</span>
                        <input
                          type="text"
                          value={pr}
                          onChange={(e) => {
                            const newPr = [...editFormData.corePrinciples];
                            newPr[idx] = e.target.value;
                            setEditFormData({ ...editFormData, corePrinciples: newPr });
                          }}
                          className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#050099]/20 focus:outline-hidden"
                        />
                        <button
                          type="button"
                          onClick={() => removePrinciple(idx)}
                          className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center space-x-2 pt-1">
                    <input
                      type="text"
                      placeholder="새 원칙 추가..."
                      value={newPrinciple}
                      onChange={(e) => setNewPrinciple(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addPrinciple())}
                      className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#050099]/20 focus:outline-hidden"
                    />
                    <button
                      type="button"
                      onClick={addPrinciple}
                      className="px-3 py-1.5 text-xs font-semibold text-[#050099] bg-[#050099]/10 hover:bg-[#050099]/20 rounded-lg border border-[#050099]/20 transition-all flex items-center space-x-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>추가</span>
                    </button>
                  </div>
                </div>
              ) : (
                <ul className="space-y-1.5">
                  {currentGuide.corePrinciples.map((principle, idx) => (
                    <li key={idx} className="flex items-start space-x-2 text-xs text-slate-700 leading-relaxed">
                      <span className="flex items-center justify-center w-4 h-4 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span>{principle}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): Live UI Mockup Preview + Good/Bad Cases */}
        <div className="lg:col-span-5 space-y-4">
          {/* Real UI Component Live Mockup Card */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#050099]" />
                <span>UI 컴포넌트 실물 프리뷰</span>
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                {SERVICES_CONFIG[selectedService]?.title.split(' ')[0]} 테마
              </span>
            </div>

            {/* Dynamic UI Component Mockup Rendering */}
            <div className="p-4 bg-slate-900 rounded-xl text-slate-100 min-h-[160px] flex flex-col items-center justify-center">
              {activeComponentType === 'button' && (
                <div className="w-full space-y-3 text-center">
                  <span className="text-[11px] text-slate-400 font-medium">Primary 버튼 4자 표준 목업</span>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
                    <button className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#050099] text-white font-bold text-sm shadow-md hover:bg-[#040080] transition-all">
                      확인
                    </button>
                    <button className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-800 text-slate-300 font-bold text-sm border border-slate-700 hover:bg-slate-700 transition-all">
                      취소
                    </button>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    CTA 확장형 예시:{' '}
                    <span className="text-blue-300 font-bold">인증서 발급받기 (8자)</span>
                  </div>
                </div>
              )}

              {activeComponentType === 'bottom_sheet' && (
                <div className="w-full bg-slate-950 rounded-xl p-3 border border-slate-800 space-y-2">
                  <div className="w-10 h-1 bg-slate-700 rounded-full mx-auto mb-1"></div>
                  <div className="text-xs font-bold text-slate-200">출금 계좌를 선택해 주세요</div>
                  <div className="space-y-1 text-xs">
                    <div className="p-2 bg-slate-900 rounded-lg border border-[#050099]/50 flex justify-between">
                      <span>주거래 우대통장</span>
                      <span className="text-blue-300 font-bold">선택됨</span>
                    </div>
                  </div>
                </div>
              )}

              {activeComponentType === 'popup' && (
                <div className="w-full max-w-xs bg-slate-950 rounded-xl p-3.5 border border-slate-800 space-y-2 text-center">
                  <div className="text-xs font-bold text-white">비밀번호를 3회 잘못 입력했어요</div>
                  <p className="text-[11px] text-slate-400">
                    안전한 이용을 위해 본인 인증 후 다시 설정해 주세요.
                  </p>
                  <div className="flex gap-1.5 pt-1">
                    <button className="flex-1 py-1.5 bg-slate-800 rounded-lg text-[11px] font-bold text-slate-300">
                      다음에
                    </button>
                    <button className="flex-1 py-1.5 bg-[#050099] rounded-lg text-[11px] font-bold text-white">
                      본인인증
                    </button>
                  </div>
                </div>
              )}

              {activeComponentType === 'toast' && (
                <div className="bg-slate-800/90 text-white px-4 py-2.5 rounded-xl border border-slate-700 text-xs font-medium flex items-center space-x-2 shadow-lg">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>계좌번호를 복사했어요. (공백포함 11자)</span>
                </div>
              )}

              {activeComponentType === 'label' && (
                <div className="flex items-center space-x-2">
                  <span className="bg-[#050099] text-white text-xs font-bold px-2.5 py-1 rounded-md">
                    인증완료
                  </span>
                  <span className="bg-emerald-500 text-white text-xs font-bold px-2.5 py-1 rounded-md">
                    추천
                  </span>
                  <span className="bg-rose-500 text-white text-xs font-bold px-2.5 py-1 rounded-md">
                    마감임박
                  </span>
                </div>
              )}

              {activeComponentType === 'tooltip' && (
                <div className="bg-slate-800 text-slate-200 p-3 rounded-xl border border-slate-700 text-xs max-w-xs space-y-1">
                  <div className="font-bold text-blue-300">💡 영업일 기준 안내</div>
                  <p className="text-[11px] text-slate-300">
                    주말 및 공휴일을 제외한 영업일 기준 2~3일 이내에 입금돼요.
                  </p>
                </div>
              )}

              {activeComponentType === 'textfield' && (
                <div className="w-full max-w-xs space-y-1 text-left">
                  <label className="text-[11px] font-bold text-slate-300">보낼 금액</label>
                  <div className="bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-slate-400">
                    금액을 입력해 주세요 (원 단위)
                  </div>
                  <span className="text-[10px] text-blue-300">1회 최대 1,000만원까지 가능해요</span>
                </div>
              )}

              {activeComponentType === 'notice_error' && (
                <div className="w-full max-w-xs space-y-1 text-left bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <span className="text-xs font-bold text-rose-400">1일 이체 한도를 초과했어요</span>
                  <p className="text-[11px] text-slate-400">
                    보안매체 인증 후 1일 이체 한도를 상향할 수 있어요.
                  </p>
                </div>
              )}

              {activeComponentType === 'precaution' && (
                <div className="w-full text-left text-[11px] text-slate-300 space-y-1 bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <p>• 중도 해지 시 약정된 이자가 지급되지 않을 수 있습니다.</p>
                  <p>• 본 상품은 1인당 3개 계좌까지 개설할 수 있습니다.</p>
                </div>
              )}
            </div>
          </div>

          {/* Good & Bad Case Cards with Quick Inspection Test Button */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
            <h4 className="text-xs font-bold text-slate-800 flex items-center justify-between">
              <span>모범 사례 (Good) & 지양 사례 (Bad)</span>
            </h4>

            {/* Bad Case */}
            <div className="space-y-2">
              {currentGuide.badExamples.map((bad, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-rose-50/70 rounded-xl border border-rose-200 text-xs space-y-1.5"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-1.5 text-rose-700 font-bold">
                      <XCircle className="w-3.5 h-3.5 shrink-0" />
                      <span className="line-through">{bad.text}</span>
                    </div>
                    {onApplyPresetToInspection && (
                      <button
                        type="button"
                        onClick={() => onApplyPresetToInspection(activeComponentType, bad.text)}
                        className="text-[10px] bg-white border border-rose-300 text-rose-700 hover:bg-rose-100 font-semibold px-2 py-0.5 rounded cursor-pointer transition-all shrink-0 ml-2"
                        title="이 지양 문구로 즉시 검수 테스트하기"
                      >
                        검수 테스트 ⚡
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-rose-800">사유: {bad.reason}</p>
                  <div className="text-[11px] font-bold text-[#050099] pt-0.5">
                    권장 수정: <span className="bg-[#050099]/10 px-1.5 py-0.5 rounded border border-[#050099]/20">{bad.fix}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Good Case */}
            <div className="space-y-2 pt-1">
              {currentGuide.goodExamples.map((good, idx) => (
                <div
                  key={idx}
                  className="p-2.5 bg-emerald-50/70 rounded-xl border border-emerald-200 text-xs flex items-center justify-between"
                >
                  <div className="flex items-center space-x-2 text-emerald-800">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="font-bold">"{good.text}"</span>
                  </div>
                  <span className="text-[11px] text-emerald-700 font-medium">{good.note}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
