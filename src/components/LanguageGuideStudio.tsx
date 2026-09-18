import React, { useState } from 'react';
import {
  BookOpen,
  BrainCircuit,
  Plus,
  Trash2,
  Sparkles,
  CheckCircle2,
  RefreshCw,
  Sliders,
  AlertCircle,
  TrendingUp,
  FileCheck,
  ShieldCheck,
  Tag,
  ThumbsUp,
  MessageSquare,
} from 'lucide-react';
import {
  CustomGuideRule,
  TerminologyRule,
  FeedbackMemoryItem,
  ServiceType,
  PlatformType,
} from '../types';

interface LanguageGuideStudioProps {
  customRules: CustomGuideRule[];
  setCustomRules: React.Dispatch<React.SetStateAction<CustomGuideRule[]>>;
  terminology: TerminologyRule[];
  setTerminology: React.Dispatch<React.SetStateAction<TerminologyRule[]>>;
  learningMemory: FeedbackMemoryItem[];
  onTriggerAiLearning: () => Promise<void>;
  isLearningAi: boolean;
  learningReport: string | null;
}

export const LanguageGuideStudio: React.FC<LanguageGuideStudioProps> = ({
  customRules,
  setCustomRules,
  terminology,
  setTerminology,
  learningMemory,
  onTriggerAiLearning,
  isLearningAi,
  learningReport,
}) => {
  const [activeTab, setActiveTab] = useState<'rules' | 'terms' | 'memory'>('rules');

  // New Rule Form State
  const [showAddRuleModal, setShowAddRuleModal] = useState(false);
  const [newCategory, setNewCategory] = useState('간결성');
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newBad, setNewBad] = useState('');
  const [newGood, setNewGood] = useState('');

  // New Term Form State
  const [showAddTermModal, setShowAddTermModal] = useState(false);
  const [newProhibited, setNewProhibited] = useState('');
  const [newRecommended, setNewRecommended] = useState('');
  const [newReason, setNewReason] = useState('');

  const handleAddRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDesc.trim()) return;

    const newRule: CustomGuideRule = {
      id: `rule-${Date.now()}`,
      category: newCategory,
      ruleTitle: newTitle.trim(),
      description: newDesc.trim(),
      badExample: newBad.trim(),
      goodExample: newGood.trim(),
      isAiLearned: false,
    };

    setCustomRules((prev) => [newRule, ...prev]);
    setNewTitle('');
    setNewDesc('');
    setNewBad('');
    setNewGood('');
    setShowAddRuleModal(false);
  };

  const handleAddTerm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProhibited.trim() || !newRecommended.trim()) return;

    const newTerm: TerminologyRule = {
      id: `term-${Date.now()}`,
      prohibitedTerm: newProhibited.trim(),
      recommendedTerm: newRecommended.trim(),
      reason: newReason.trim(),
    };

    setTerminology((prev) => [newTerm, ...prev]);
    setNewProhibited('');
    setNewRecommended('');
    setNewReason('');
    setShowAddTermModal(false);
  };

  const handleDeleteRule = (id: string) => {
    setCustomRules((prev) => prev.filter((r) => r.id !== id));
  };

  const handleDeleteTerm = (id: string) => {
    setTerminology((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Banner & AI Learning Trigger */}
      <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#050099]/30 text-blue-200 border border-[#050099]/40 flex items-center space-x-1">
              <BrainCircuit className="w-3.5 h-3.5 text-blue-300" />
              <span>Self-Learning Language Guide Studio</span>
            </span>
          </div>
          <h2 className="text-xl font-bold tracking-tight">
            고객언어 가이드 & 피드백 자가 학습 뱅크
          </h2>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            검수 결과에서 사용자가 채택하고 남긴 피드백(대화 및 좋아요) 데이터를 지속적으로 축적하여,
            우리 서비스에 꼭 맞는 상황별 톤 레벨과 UX 라이팅 원칙을 AI가 스스로 학습·업그레이드합니다.
          </p>
        </div>

        {/* AI Guide Auto-Tune Button */}
        <div className="shrink-0 flex flex-col items-start md:items-end space-y-2">
          <button
            type="button"
            id="trigger-ai-learn-btn"
            onClick={onTriggerAiLearning}
            disabled={isLearningAi || learningMemory.length === 0}
            className="px-5 py-3 rounded-2xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold text-xs shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap"
          >
            {isLearningAi
              ? '누적 피드백 분석 & 가이드 자동 학습 중...'
              : `누적 피드백 기반 가이드 자동 학습 (${learningMemory.length}건)`}
          </button>
          <span className="text-[11px] text-slate-400">
            {learningMemory.length > 0
              ? `현재 ${learningMemory.length}개의 실제 선호 데이터가 축적되어 있습니다.`
              : '문구를 검수하고 채택/피드백하면 학습 데이터가 쌓입니다.'}
          </span>
        </div>
      </div>

      {/* AI Learning Report Box (if available) */}
      {learningReport && (
        <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 shadow-sm space-y-2">
          <div className="flex items-center space-x-2 text-amber-900 font-bold text-sm">
            <Sparkles className="w-4 h-4 text-amber-600" />
            <span>AI 가이드 학습 결과 리포트</span>
          </div>
          <p className="text-xs text-amber-950 leading-relaxed whitespace-pre-line bg-white/70 p-3.5 rounded-xl border border-amber-200">
            {learningReport}
          </p>
        </div>
      )}

      {/* 2. Sub-Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div className="flex items-center space-x-2 bg-slate-100 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveTab('rules')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'rules'
                ? 'bg-white text-[#050099] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>언어 가이드 원칙 ({customRules.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('terms')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'terms'
                ? 'bg-white text-[#050099] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>금지어/권장어 사전 ({terminology.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('memory')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'memory'
                ? 'bg-white text-[#050099] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>자가 학습 피드백 뱅크 ({learningMemory.length})</span>
          </button>
        </div>

        {activeTab === 'rules' && (
          <button
            type="button"
            onClick={() => setShowAddRuleModal(true)}
            className="px-3.5 py-2 bg-[#050099] hover:bg-[#040080] text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer whitespace-nowrap"
          >
            <span>새 가이드 규칙 추가</span>
          </button>
        )}

        {activeTab === 'terms' && (
          <button
            type="button"
            onClick={() => setShowAddTermModal(true)}
            className="px-3.5 py-2 bg-[#050099] hover:bg-[#040080] text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer whitespace-nowrap"
          >
            <span>금지어/권장어 등록</span>
          </button>
        )}
      </div>

      {/* 3. Tab Content */}

      {/* Tab A: Rules Matrix */}
      {activeTab === 'rules' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {customRules.map((rule) => (
            <div
              key={rule.id}
              className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="px-2.5 py-0.5 rounded-md bg-[#050099]/10 text-[#050099] border border-[#050099]/20 text-xs font-bold">
                      {rule.category}
                    </span>
                    {rule.isAiLearned && (
                      <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold flex items-center space-x-1">
                        <Sparkles className="w-3 h-3 text-amber-500" />
                        <span>AI 자가학습 규칙</span>
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteRule(rule.id)}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <h3 className="text-sm font-bold text-slate-900 mb-1">{rule.ruleTitle}</h3>
                <p className="text-xs text-slate-600 leading-relaxed mb-3">{rule.description}</p>
              </div>

              <div className="pt-3 border-t border-slate-100 space-y-1.5 text-xs bg-slate-50 p-3 rounded-xl">
                <div className="flex items-start space-x-2 text-rose-700">
                  <span className="font-bold text-[10px] bg-rose-100 px-1.5 py-0.5 rounded shrink-0">
                    지양
                  </span>
                  <span className="line-through">{rule.badExample}</span>
                </div>
                <div className="flex items-start space-x-2 text-emerald-700">
                  <span className="font-bold text-[10px] bg-emerald-100 px-1.5 py-0.5 rounded shrink-0">
                    권장
                  </span>
                  <span className="font-bold">{rule.goodExample}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab B: Terminology Dictionary */}
      {activeTab === 'terms' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-700 grid grid-cols-12 gap-2">
            <div className="col-span-3">지양하는 금지어</div>
            <div className="col-span-3">권장 고객 언어</div>
            <div className="col-span-5">대체 사유 및 가이드</div>
            <div className="col-span-1 text-center">관리</div>
          </div>
          <div className="divide-y divide-slate-100">
            {terminology.map((term) => (
              <div
                key={term.id}
                className="p-4 text-xs grid grid-cols-12 gap-2 items-center hover:bg-slate-50/80 transition-all"
              >
                <div className="col-span-3 font-semibold text-rose-600 flex items-center space-x-1">
                  <span className="px-2 py-0.5 rounded bg-rose-50 border border-rose-100 font-mono">
                    {term.prohibitedTerm}
                  </span>
                </div>
                <div className="col-span-3 font-bold text-emerald-700 flex items-center space-x-1">
                  <span className="px-2 py-0.5 rounded bg-emerald-50 border border-emerald-100 font-mono">
                    {term.recommendedTerm}
                  </span>
                </div>
                <div className="col-span-5 text-slate-600">{term.reason}</div>
                <div className="col-span-1 text-center">
                  <button
                    type="button"
                    onClick={() => handleDeleteTerm(term.id)}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab C: Feedback & Learning Bank Memory */}
      {activeTab === 'memory' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-[#050099]/5 border border-[#050099]/15 text-xs text-[#050099] leading-relaxed flex items-start space-x-3">
            <Sparkles className="w-5 h-5 text-[#050099] shrink-0 mt-0.5" />
            <div>
              <p className="font-bold mb-0.5">실시간 피드백 퓨샷(Few-shot) 자동 주입 시스템</p>
              <p className="text-slate-700">
                아래에 쌓인 피드백 데이터는 다음번 문구 검수 시 AI 프롬프트에 자동으로 포함되어,
                사용자가 선호하는 종결어미와 톤 스타일을 우선적으로 제안하게 됩니다.
              </p>
            </div>
          </div>

          {learningMemory.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 space-y-2">
              <BrainCircuit className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-slate-700">축적된 피드백 데이터가 없습니다</p>
              <p className="text-xs text-slate-500">
                문구 검수 결과 화면에서 '이 문구 채택'을 누르거나 '좋아요/피드백'을 남겨주시면
                여기에 자동으로 기록됩니다.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {learningMemory.map((mem) => (
                <div
                  key={mem.id}
                  className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2.5 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold text-[10px]">
                      {mem.service} · {mem.platform} · Level {mem.toneLevel}
                    </span>
                    <span className="text-slate-400 text-[10px]">
                      {new Date(mem.timestamp).toLocaleDateString('ko-KR')}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-slate-400 font-medium">검수 전 원본:</span>
                    <p className="p-2 rounded-lg bg-slate-50 text-slate-700 line-through">
                      {mem.originalText}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-emerald-600 font-bold flex items-center space-x-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>유저 최종 채택 문구:</span>
                    </span>
                    <p className="p-2 rounded-lg bg-emerald-50 text-emerald-950 font-bold border border-emerald-100">
                      {mem.adoptedText}
                    </p>
                  </div>

                  {mem.userComment && (
                    <p className="text-slate-500 bg-slate-50 p-2 rounded-lg text-[11px] italic">
                      💬 피드백 코멘트: "{mem.userComment}"
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal: Add New Rule */}
      {showAddRuleModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-base font-bold text-slate-900">새로운 언어 가이드 규칙 추가</h3>
            <form onSubmit={handleAddRule} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">카테고리</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white"
                >
                  <option value="간결성">간결성 (Conciseness)</option>
                  <option value="명확성">명확성 (Clarity)</option>
                  <option value="직관성">직관성 (Intuitiveness)</option>
                  <option value="플랫폼제약">플랫폼 제약 (Platform / TV / Mobile)</option>
                  <option value="어법/맞춤법">어법/맞춤법 (Korean Grammar)</option>
                  <option value="브랜드보이스">브랜드 보이스 (Brand Voice)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">규칙 제목</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="예: 버튼 카피는 동사형 8자 이내로 통일"
                  className="w-full p-2.5 rounded-xl border border-slate-300"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">상세 가이드 설명</label>
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  rows={2}
                  placeholder="예: 모바일 화면 버튼에서 줄바꿈이 발생하지 않도록 8자 이내로 명확하게 행동을 기술합니다."
                  className="w-full p-2.5 rounded-xl border border-slate-300"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-rose-700 mb-1">지양 예시 (Bad)</label>
                  <input
                    type="text"
                    value={newBad}
                    onChange={(e) => setNewBad(e.target.value)}
                    placeholder="예: 지금 바로 구매를 진행하시기 바랍니다"
                    className="w-full p-2 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-bold text-emerald-700 mb-1">권장 예시 (Good)</label>
                  <input
                    type="text"
                    value={newGood}
                    onChange={(e) => setNewGood(e.target.value)}
                    placeholder="예: 바로 구매하기"
                    className="w-full p-2 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddRuleModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-semibold"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#050099] hover:bg-[#040080] text-white font-bold"
                >
                  규칙 등록
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add New Term */}
      {showAddTermModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-base font-bold text-slate-900">금지어 / 권장어 등록</h3>
            <form onSubmit={handleAddTerm} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-rose-700 mb-1">지양할 단어 (금지어)</label>
                <input
                  type="text"
                  value={newProhibited}
                  onChange={(e) => setNewProhibited(e.target.value)}
                  placeholder="예: 금일, 해당, 기재 바랍니다"
                  className="w-full p-2.5 rounded-xl border border-slate-300"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-emerald-700 mb-1">대체 권장 단어</label>
                <input
                  type="text"
                  value={newRecommended}
                  onChange={(e) => setNewRecommended(e.target.value)}
                  placeholder="예: 오늘, 이, 적어 주세요"
                  className="w-full p-2.5 rounded-xl border border-slate-300"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">대체 사유</label>
                <input
                  type="text"
                  value={newReason}
                  onChange={(e) => setNewReason(e.target.value)}
                  placeholder="예: 딱딱한 관공서식 한자어를 친근한 일상어로 개선"
                  className="w-full p-2.5 rounded-xl border border-slate-300"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddTermModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-semibold"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#050099] hover:bg-[#040080] text-white font-bold"
                >
                  사전 등록
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
