export type ServiceType = 'broadcast' | 'banking' | 'commerce' | 'intro' | 'custom';
export type PlatformType = 'tv' | 'pc' | 'mobile';
export type ContextType = 'guide' | 'error' | 'promotion' | 'confirmation' | 'empty';

export type ToneLevel = 1 | 2 | 3 | 4;

export type UIComponentType =
  | 'button'
  | 'bottom_sheet'
  | 'label'
  | 'tooltip'
  | 'textfield'
  | 'popup'
  | 'toast'
  | 'notice_error'
  | 'precaution'
  | 'general';

export interface ServiceMeta {
  id: ServiceType;
  title: string;
  subtitle: string;
  description: string;
  iconName: string;
  badge: string;
}

export interface PlatformMeta {
  id: PlatformType;
  title: string;
  subtitle: string;
  constraints: string;
  iconName: string;
}

export interface ContextMeta {
  id: ContextType;
  title: string;
  description: string;
  defaultToneLevel: ToneLevel;
  iconName: string;
}

export interface ToneLevelMeta {
  level: ToneLevel;
  name: string;
  description: string;
  example: string;
  endingPattern: string;
}

export interface ComponentGuideRule {
  componentType: UIComponentType;
  title: string;
  subtitle: string;
  badge: string;
  charLimitRule: {
    singleMax: number; // 공백 제외 최대 글자 수 (예: 버튼 4자)
    ctaMax?: number; // 행동유도 CTA 확장 허용 글자 수 (예: 12자)
    maxLines?: number; // 최대 줄 수 (예: 토스트 1줄)
    unitDescription: string; // "공백 제외 4자 이내의 한 단어"
    notes: string;
  };
  toneEndingRule: {
    preferredForm: string; // "명사형 종결" or "해요체" or "명령형 배제"
    endingPattern: string; // "확인, 조회, 등록 등"
    forbiddenPatterns: string[]; // ["~하기", "~되어집니다", "~요망합니다"]
    description: string;
  };
  corePrinciples: string[];
  goodExamples: Array<{ text: string; note: string; context?: string }>;
  badExamples: Array<{ text: string; reason: string; fix: string }>;
  restrictedCases?: string[];
}

export interface RuleViolation {
  category: '간결성' | '명확성' | '직관성' | '일관성' | '플랫폼제약' | '어법/맞춤법' | '브랜드보이스' | '글자수초과' | '컴포넌트규칙';
  severity: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  violatedTextPart?: string;
}

export interface CharEvaluation {
  currentCharsNoSpace: number;
  currentCharsWithSpace: number;
  limitChars: number;
  status: 'optimal' | 'warning' | 'exceeded'; // optimal(적합), warning(주의), exceeded(초과)
  diff: number; // 기준 대비 초과/여유 글자 수
  message: string;
}

export interface ToneEvaluation {
  status: 'passed' | 'warning' | 'failed';
  detectedForm: string; // 예: "명사형 종결", "해요체", "피동체"
  targetForm: string;
  score: number; // 0-100
  message: string;
  ruleChecks: Array<{
    ruleName: string;
    passed: boolean;
    detail: string;
  }>;
}

export interface SimilarCase {
  original: string;
  revised: string;
  serviceCategory: string;
  reason: string;
}

export interface InspectionItemResult {
  id: string;
  originalText: string;
  locationLabel?: string; // e.g. "확인 버튼", "에러 팝업 본문", "바텀시트 타이틀"
  componentType?: UIComponentType;
  score: {
    clarity: number; // 0 - 100
    conciseness: number;
    toneFit: number;
    platformFit: number;
    componentGuideFit?: number;
  };
  charEvaluation?: CharEvaluation;
  toneEvaluation?: ToneEvaluation;
  alt1: {
    title: string; // e.g. "직관·간결형 (추천)"
    text: string;
    highlights: string;
    charCount: number;
    charCountNoSpace?: number;
    charFitStatus?: 'optimal' | 'warning' | 'exceeded';
  };
  alt2: {
    title: string; // e.g. "친절·공감형"
    text: string;
    highlights: string;
    charCount: number;
    charCountNoSpace?: number;
    charFitStatus?: 'optimal' | 'warning' | 'exceeded';
  };
  violations: RuleViolation[];
  explanation: string;
  similarCases: SimilarCase[];
  selectedAlt?: 1 | 2 | 'custom';
  customAdoptedText?: string;
  feedback?: {
    type: 'positive' | 'negative' | 'neutral';
    comment?: string;
    timestamp: number;
  };
  chatHistory?: Array<{
    sender: 'user' | 'assistant';
    message: string;
    timestamp: number;
    suggestedText?: string;
  }>;
}

export interface InspectionSession {
  id: string;
  timestamp: number;
  service: ServiceType;
  platform: PlatformType;
  componentType: UIComponentType;
  context: ContextType;
  toneLevel: ToneLevel;
  inputMode: 'text' | 'batch' | 'image' | 'pdf';
  sourceFileName?: string;
  sourcePreviewUrl?: string;
  items: InspectionItemResult[];
  overallSummary?: string;
}

export interface CustomGuideRule {
  id: string;
  category: string;
  ruleTitle: string;
  description: string;
  componentType?: UIComponentType | 'all';
  service?: ServiceType | 'all';
  platform?: PlatformType | 'all';
  badExample: string;
  goodExample: string;
  isAiLearned?: boolean;
}

export interface TerminologyRule {
  id: string;
  prohibitedTerm: string;
  recommendedTerm: string;
  reason: string;
  service?: ServiceType | 'all';
}

export interface FeedbackMemoryItem {
  id: string;
  timestamp: number;
  service: ServiceType;
  platform: PlatformType;
  componentType?: UIComponentType;
  context: ContextType;
  toneLevel: ToneLevel;
  originalText: string;
  adoptedText: string;
  rejectedText?: string;
  userComment?: string;
  feedbackType: 'positive' | 'negative';
}
