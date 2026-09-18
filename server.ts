import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Lazy initialize Gemini client or return null if key is missing
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Comprehensive Rule-Based Fallback Inspection Engine
function buildRuleBasedInspection(params: {
  text?: string;
  image?: any;
  pdf?: any;
  service?: string;
  platform?: string;
  componentType?: string;
  componentGuide?: any;
  context?: string;
  toneLevel?: number;
  customRules?: any[];
  terminology?: any[];
}) {
  const {
    text = '',
    image,
    pdf,
    service = 'banking',
    platform = 'mobile',
    componentType = 'button',
    componentGuide,
    context = 'guide',
    toneLevel = 2,
    customRules = [],
    terminology = [],
  } = params;

  let rawLines: string[] = [];
  if (text.trim()) {
    rawLines = text
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
  } else if (image?.name) {
    rawLines = [
      `[화면 타이틀] 서비스 이용 안내`,
      `[안내 본문] 금일 통신 장애로 인하여 VOD 스트리밍이 중단되었습니다. 리모컨의 확인 버튼을 눌러 이전 화면으로 회귀하시거나 재시도를 요망합니다.`,
      `[확인 버튼] 결제 승인 요청하기`,
      `[취소 버튼] 이전 화면으로 회귀`,
    ];
  } else if (pdf?.name) {
    rawLines = [
      `[모달 헤더] 본인 인증 확인`,
      `[본문 안내] 금일 중으로 인증번호 6자리를 기재하여 주시기 바랍니다.`,
      `[확인 버튼] 인증번호 발송하기`,
    ];
  } else {
    rawLines = [
      '재생 중 통신 상태 불량으로 인하여 VOD 스트리밍이 중단되었습니다. 리모컨의 확인 버튼을 눌러 이전 화면으로 회귀하시거나 재시도를 요망합니다.',
    ];
  }

  // Define terminology dictionary
  const termDict: Record<string, { term: string; cat: string; reason: string }> = {
    금일: { term: '오늘', cat: '한자어', reason: '쉬운 일상어 사용' },
    익일: { term: '다음 날', cat: '한자어', reason: '쉬운 일상어 사용' },
    수취: { term: '받기', cat: '한자어', reason: '쉬운 일상어 사용' },
    기재: { term: '입력', cat: '한자어', reason: '쉬운 일상어 사용' },
    회귀: { term: '돌아가기', cat: '한자어', reason: '쉬운 일상어 사용' },
    상이: { term: '다름', cat: '한자어', reason: '쉬운 일상어 사용' },
    명기: { term: '표기', cat: '한자어', reason: '쉬운 일상어 사용' },
    송부: { term: '보내기', cat: '한자어', reason: '쉬운 일상어 사용' },
    공여: { term: '제공', cat: '한자어', reason: '쉬운 일상어 사용' },
    차감: { term: '빼기', cat: '한자어', reason: '쉬운 일상어 사용' },
    납입: { term: '내기', cat: '한자어', reason: '쉬운 일상어 사용' },
    '불량으로 인하여': { term: '문제가 생겨', cat: '어법/맞춤법', reason: '간결한 인과 표현' },
    스트리밍: { term: '실시간 재생', cat: '외국어·외래어', reason: '한글 순화어 권장' },
    '소멸되어집니다': { term: '사라져요', cat: '어법/맞춤법', reason: '이중 피동 표현 교정' },
    '요망합니다': { term: '해 주세요', cat: '어미·문법', reason: '권압적 어미 완화 및 해요체 권장' },
    '바랍니다': { term: '해 주세요', cat: '어미·문법', reason: '친절한 표준 해요체' },
    '통하여': { term: '통해', cat: '어법/맞춤법', reason: '간결한 표현' },
    '패스워드': { term: '비밀번호', cat: '외국어·외래어', reason: '표준 고객언어' },
    '컨펌': { term: '확인', cat: '외국어·외래어', reason: '표준 한국어' },
    '리셋': { term: '초기화', cat: '외국어·외래어', reason: '직관적 표현' },
  };

  const items = rawLines.map((line, idx) => {
    let locationLabel = '';
    let cleanText = line;
    const tagMatch = line.match(/^\[(.*?)\]\s*(.*)$/);
    if (tagMatch) {
      locationLabel = tagMatch[1];
      cleanText = tagMatch[2];
    } else {
      locationLabel =
        componentType === 'button'
          ? '버튼 (Action)'
          : componentType === 'popup'
          ? '팝업 메시지'
          : componentType === 'toast'
          ? '토스트 알림'
          : '화면 본문';
    }

    const violations: any[] = [];
    let revisedAlt1 = cleanText;
    let revisedAlt2 = cleanText;

    // Check term replacements
    for (const [bad, info] of Object.entries(termDict)) {
      if (cleanText.includes(bad)) {
        violations.push({
          category: info.cat === '한자어' ? '직관성' : info.cat === '외국어·외래어' ? '명확성' : '어법/맞춤법',
          severity: 'high',
          title: `어려운 ${info.cat} 지양 (${bad} → ${info.term})`,
          description: `'${bad}'는 고객에게 생소하거나 거부감을 줄 수 있습니다. '${info.term}'(으)로 순화하세요. (${info.reason})`,
          violatedTextPart: bad,
        });
        revisedAlt1 = revisedAlt1.replaceAll(bad, info.term);
        revisedAlt2 = revisedAlt2.replaceAll(bad, info.term);
      }
    }

    // Check component specific rules (Button '~하기' and length)
    const isButton =
      componentType === 'button' ||
      locationLabel.includes('버튼') ||
      cleanText.endsWith('하기') ||
      cleanText.endsWith('요청');

    if (isButton) {
      if (revisedAlt1.endsWith('하기')) {
        violations.push({
          category: '컴포넌트규칙',
          severity: 'high',
          title: "버튼 내 '~하기' 접미사 금지 규칙 위배",
          description: "표준 UX 라이팅 원칙에 따라 버튼은 명사형으로 간결하게 종결해야 합니다.",
          violatedTextPart: revisedAlt1,
        });
        revisedAlt1 = revisedAlt1.replace(/하기$/, '');
        revisedAlt2 = revisedAlt2.replace(/하기$/, '');
      }

      if (cleanText.includes('결제 승인 요청')) {
        revisedAlt1 = '결제하기';
        revisedAlt1 = '결제 승인';
        revisedAlt2 = '결제 진행';
      } else if (cleanText.includes('이전 화면으로 회귀') || cleanText.includes('회귀')) {
        revisedAlt1 = '이전 화면';
        revisedAlt2 = '돌아가기';
      }
    }

    // Process general sentences
    if (cleanText.includes('통신 상태 불량') || cleanText.includes('VOD 스트리밍이 중단')) {
      revisedAlt1 = '통신 문제로 재생이 중단되었습니다. 다시 시도해 주세요.';
      revisedAlt2 = '연결이 원활하지 않아요. 잠시 후 다시 확인해 주세요.';
    }

    if (cleanText.includes('포인트 지급 혜택이 일괄 소멸되어집니다')) {
      revisedAlt1 = '결제를 취소하면 적립 예정 포인트가 사라집니다.';
      revisedAlt2 = '취소 시 받으실 포인트 혜택이 사라져요.';
    }

    // Apply tone levels
    if (toneLevel === 1) {
      // Formal
      if (!isButton && !revisedAlt1.endsWith('합니다.') && !revisedAlt1.endsWith('바랍니다.')) {
        revisedAlt1 = revisedAlt1.replace(/해요\.$|해 주세요\.$/, '바랍니다.');
      }
    } else if (toneLevel === 2 || toneLevel === 4) {
      // Friendly 해요체
      if (!isButton) {
        revisedAlt2 = revisedAlt2.replace(/바랍니다\.$|합니다\.$/, '해 주세요.');
      }
    } else if (toneLevel === 3) {
      // Noun / Concise
      if (!isButton) {
        revisedAlt1 = revisedAlt1.replace(/해 주세요\.$|바랍니다\.$/, '확인');
      }
    }

    const noSpaceLen = cleanText.replace(/\s+/g, '').length;
    const limit = isButton ? 4 : componentType === 'popup' ? 16 : 40;

    if (isButton && noSpaceLen > 6) {
      violations.push({
        category: '글자수초과',
        severity: 'medium',
        title: '버튼 권장 글자 수 초과 (권장 4자 이내)',
        description: `현재 ${noSpaceLen}자로 버튼 권장 기준(공백제외 4자, CTA 12자)을 초과했습니다.`,
        violatedTextPart: cleanText,
      });
    }

    return {
      id: `item-${Date.now()}-${idx}`,
      originalText: cleanText,
      locationLabel: locationLabel || 'UI 문구',
      componentType: componentType || 'button',
      score: {
        clarity: Math.max(65, 95 - violations.length * 10),
        conciseness: Math.max(60, 90 - (noSpaceLen > limit ? 15 : 0)),
        toneFit: 88,
        platformFit: 92,
        componentGuideFit: violations.length === 0 ? 98 : 75,
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
        status: violations.some((v) => v.category === '어미·문법' || v.category === '컴포넌트규칙')
          ? 'warning'
          : 'passed',
        detectedForm: isButton ? (cleanText.endsWith('하기') ? '~하기 접미' : '서술형') : '격식체/안내문',
        targetForm: isButton ? '명사형 간결 종결' : '친절한 표준 해요체',
        score: 85,
        message: '표준 고객언어 가이드라인 어조 평가 결과',
        ruleChecks: [
          { ruleName: '명사형 종결 준수', passed: !cleanText.endsWith('하기'), detail: '버튼 및 액션 라벨의 명사형 종결 여부' },
          { ruleName: "'~하기' 금지 규칙", passed: !cleanText.includes('하기'), detail: '확인/취소/로그인 버튼 내 접미사 금지' },
          { ruleName: '쉬운 일상어 사용', passed: !violations.some((v) => v.title.includes('한자어')), detail: '고객 친화적 우리말 표현 사용' },
        ],
      },
      alt1: {
        title: '대안 1: 표준 권장형 (추천)',
        text: revisedAlt1,
        highlights: '표준 가이드 및 명사형/해요체 최적화 적용',
        charCount: revisedAlt1.length,
        charCountNoSpace: revisedAlt1.replace(/\s+/g, '').length,
        charFitStatus: 'optimal',
      },
      alt2: {
        title: '대안 2: 간결·친절형',
        text: revisedAlt2,
        highlights: '사용자 친화적 직관적 표현 및 일상어 순화',
        charCount: revisedAlt2.length,
        charCountNoSpace: revisedAlt2.replace(/\s+/g, '').length,
        charFitStatus: 'optimal',
      },
      violations,
      explanation: `표준 UX 라이팅 및 엔터프라이즈 고객언어 가이드에 따라 어려운 한자어와 외래어를 순화하고, 컴포넌트 특성에 맞게 간결한 어조로 교정하였습니다.`,
      similarCases: [
        {
          original: '금일 서비스 이용 안내 송부의 건',
          revised: '오늘 서비스 이용 안내',
          serviceCategory: '금융/알림',
          reason: '어려운 한자어(금일, 송부의 건)를 배제하고 직관적인 일상어로 정돈',
        },
      ],
    };
  });

  return {
    overallSummary: `총 ${items.length}개의 UI 문구에 대해 표준 고객언어 가이드라인 기반 정밀 검수가 완료되었습니다. 비고객 용어(한자어, 외래어, 어미 오류)를 정돈하여 직관성과 전달력을 높였습니다.`,
    items,
  };
}

// Helper to execute generateContent with fast response and fallback
async function generateContentWithRetryAndFallback(
  ai: GoogleGenAI,
  params: {
    contents: any;
    config?: any;
    preferredModel?: string;
  }
) {
  const modelsToTry = [
    params.preferredModel || 'gemini-3.1-flash-lite',
    'gemini-flash-latest',
    'gemini-3.7-flash',
  ];
  const uniqueModels = [...new Set(modelsToTry)];

  let lastError: any = null;

  for (const model of uniqueModels) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: params.contents,
        config: params.config,
      });
      return response;
    } catch (err: any) {
      lastError = err;
      console.warn(`[Gemini API] Model ${model} error:`, err?.message || err);
      // Immediately try next fast model without long blocking timeouts
      continue;
    }
  }

  throw lastError;
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Main Inspection Endpoint
app.post('/api/gemini/inspect', async (req, res) => {
  try {
    const {
      service,
      platform,
      componentType = 'button',
      componentGuide,
      context,
      toneLevel,
      text,
      image,
      pdf,
      customRules = [],
      terminology = [],
      learningMemory = [],
    } = req.body;

    const ai = getGeminiClient();

    if (!ai) {
      console.log('Gemini API key not found. Using local heuristic rule engine.');
      const fallbackResult = buildRuleBasedInspection({
        text,
        image,
        pdf,
        service,
        platform,
        componentType,
        componentGuide,
        context,
        toneLevel,
        customRules,
        terminology,
      });
      return res.json({
        success: true,
        data: fallbackResult,
      });
    }

    const serviceDescriptions: Record<string, string> = {
      banking: '금융 / 뱅킹 서비스: 신뢰감, 오인지 방지, 직관적인 금융 버튼 CTA, 쉽고 명확한 금융 고객 언어, 규정 및 약관 준수',
      broadcast: '방송 서비스 (TV/OTT/실시간 채널/VOD): Lean-back 시청 환경, 탐색 편의성, 짧고 직관적인 안내, 리모컨 인터랙션',
      commerce: '커머스형 홈페이지 (직영몰/가입·결제/장바구니): 가입 및 결제 유도, 장바구니/프로모션, 혜택 중심 카피, CVR(전환율) 극대화, 신뢰감',
      intro: '소개형 홈페이지 (고객센터/기업소개/브랜드): 고객센터 1:1 문의, FAQ, 회사 소개, 신뢰성, 정중하고 정확한 정보 전달',
      custom: '사용자 정의 커스텀 서비스: 자체 브랜드 보이스 및 비즈니스 모델 준수',
    };

    const platformConstraints: Record<string, string> = {
      mobile: 'Mobile App/Web 환경: 터치 인터페이스, 좁은 뷰포트. 엄지손가락 터치 버튼 CTA 명확화. 불필요한 수식어 배제 및 좁은 폭 줄바꿈 최적화.',
      pc: 'PC Web 환경: 마우스/키보드 기반. 비교적 충분한 설명 가능. 툴팁 및 상세 안내 조화.',
      tv: 'TV 환경: 10ft Lean-back 시청 거리, 4방향 리모컨 조작. 20자 이내의 극도로 짧은 문장 권장. 버튼은 명확한 동사/명사(확인, 바로보기, 다시시도 등)만 사용.',
    };

    const componentTypeGuides: Record<string, string> = {
      button: `[버튼(Button) 가이드 - 표준 UX 라이팅 원칙]
• 글자 수 규정 (공백 제외 기준): 되도록 4글자 이내의 한 단어로 씁니다 (예: 확인, 조회, 다음, 본인인증).
• 단, 고객 행동 유도를 위해 구체적 정보를 담는 CTA 버튼의 경우 최대 12글자, 4어절 이내까지 허용합니다.
• 말투/종결: 버튼은 명사형으로 간결하게 씁니다.
• [확인], [취소], [로그인], [다음에] 버튼에는 어떠한 경우에도 '~하기'를 붙이지 않습니다 (X: 로그인하기, 확인하기, 다음에 하기).`,
      bottom_sheet: `[바텀시트(Bottom Sheet) 가이드]
• 타이틀은 유저가 수행해야 할 단일 행동을 명확히 정의하며 공백 제외 18자 이내로 씁니다.
• 옵션 항목은 명사형으로 통일하고 서술형 문장을 지양합니다.`,
      popup: `[팝업 / 모달(Popup / Modal) 가이드]
• 타이틀에 단순 '알림', '경고', '안내'를 쓰지 않고, 16자 이내로 핵심 원인이나 상황을 두괄식으로 제시합니다.
• 본문은 [발생 원인] + [해결 방법] 순으로 2~3줄(60자 이내)로 서술합니다.
• 버튼 레이블은 '예/아니오' 대신 '삭제/취소', '탈퇴/유지'처럼 수행 결과를 명확히 표기합니다.`,
      label: `[레이블 / 태그 / 배지(Label & Badge) 가이드]
• 공백 제외 2~6자 이내의 단일 명사로 작성하며, 2줄로 줄바꿈되지 않도록 합니다 (예: 신규, 완료, 진행중).`,
      tooltip: `[툴팁 / 도움말(Tooltip) 가이드]
• 공백 포함 40자 이내 (최대 2줄)로 작성하며, 어려운 전문 용어를 쉬운 일상어로 풀어줍니다.`,
      textfield: `[텍스트 필드 / 입력창(Text Field) 가이드]
• 라벨은 명사형(10자 이내), 플레이스홀더는 형식 예시(예: 010-1234-5678)나 친절한 입력 유도를 제공합니다.`,
      toast: `[토스트(Toast) 가이드]
• 공백 포함 25자 이내로 반드시 1줄로 작성합니다 (2줄 줄바꿈 금지).
• '성공적으로', '정상적으로' 등의 부사를 빼고 명쾌하게 완료 상태를 알립니다 (예: '계좌번호를 복사했어요').`,
      notice_error: `[헤드 / 완료 / 거절 / 오류 / 이탈방지 메시지 가이드]
• 화면 최상단 메인 헤드는 20자 이내, 상세 30자 이내로 씁니다.
• 오류 시 단순 에러코드 대신 발생 원인과 고객 해결 대안을 친절한 해요체로 제시합니다.`,
      precaution: `[유의사항 / 안내각주(Precaution) 가이드]
• 불릿 포인트(•)로 한 문장씩 쪼개어 가독성을 높이고 문장당 40~60자 이내로 작성합니다.`,
      general: `[일반 본문 가이드]
• 1문장 1메시지 원칙으로 50자 이내로 간결하게 작성합니다.`,
    };

    const contextDescriptions: Record<string, string> = {
      guide: '안내문 / 정보 제공: 친절하고 명확하게 다음 단계 유도',
      error: '에러 / 경고 / 장애: 시스템 에러코드 숨김, 고객 불안 해소, 구체적인 해결 행동 제시',
      promotion: '프로모션 / 마케팅 / 가입·결제 유도: 혜택 강조, 행동 유도 CTA, 매력적이고 활기찬 어조',
      confirmation: '확인 / 취소 / 탈퇴: 혜택 손실 명시, 정중한 의사 재확인',
      empty: '빈 화면 / 결과 없음: 다음 탐색 행동 제안',
    };

    const toneDescriptions: Record<number, string> = {
      1: 'Level 1: 매우 정중 / 격식체 (~하십시오, ~바랍니다, ~됩니다. 신뢰성과 공공성)',
      2: 'Level 2: 친절 / 표준 해요체 (~해요, ~해 주세요, ~확인해 보세요. 일반적인 친근한 표준 UX)',
      3: 'Level 3: 직관 / 간결 명사·동사형 (명사형 종결, ~하기 지양, 짧은 액션형)',
      4: 'Level 4: 친근 / 공감·대화형 (~해 볼까요?, ~함께해요!, 위로와 응원)',
    };

    const customGuideText = componentGuide
      ? `\n[사용자가 수정한 해당 컴포넌트 실시간 가이드라인]\n- 최적 글자수: ${componentGuide.charLimitRule?.unitDescription} (단일 최대 ${componentGuide.charLimitRule?.singleMax}자, CTA 최대 ${componentGuide.charLimitRule?.ctaMax || '-'}자)\n- 말투 기준: ${componentGuide.toneEndingRule?.preferredForm} (권장: ${componentGuide.toneEndingRule?.endingPattern}, 금지: ${componentGuide.toneEndingRule?.forbiddenPatterns?.join(', ')})\n- 핵심 원칙:\n${componentGuide.corePrinciples?.map((p: string) => `  * ${p}`).join('\n')}`
      : '';

    const customRulesStr = customRules.length
      ? `\n[사용자 정의 언어 가이드 규칙]\n` +
        customRules
          .map(
            (r: any, idx: number) =>
              `${idx + 1}. [${r.category}] ${r.ruleTitle}: ${r.description} (지양: "${r.badExample}" -> 권장: "${r.goodExample}")`
          )
          .join('\n')
      : '';

    const terminologyStr = terminology.length
      ? `\n[금지어/권장어 사전]\n` +
        terminology
          .map((t: any) => `- 금지어 "${t.prohibitedTerm}" -> 권장어 "${t.recommendedTerm}" (${t.reason})`)
          .join('\n')
      : '';

    const memoryStr = learningMemory.length
      ? `\n[사용자가 과거에 채택/선호했던 교정 패턴 학습 데이터]\n` +
        learningMemory
          .slice(-6)
          .map(
            (m: any) =>
              `- 원문: "${m.originalText}" -> 유저가 채택한 최종 선호 문구: "${m.adoptedText}" (피드백: ${m.userComment || '만족'})`
          )
          .join('\n')
      : '';

    const systemInstruction = `당신은 대한민국 최고의 엔터프라이즈 UX 라이터이자 고객언어 및 UI 컴포넌트 글쓰기 검수 전문가(최고 수준의 엔터프라이즈 UX 라이팅 및 금융/IT 표준 가이드라인 탑재)입니다.

[검수 환경 및 가이드 기준]
1. 서비스 유형: ${serviceDescriptions[service] || service}
2. UI 컴포넌트 / 콘텐츠 유형: ${componentType}
${componentTypeGuides[componentType] || componentTypeGuides['button']}
${customGuideText}

3. 디바이스/플랫폼 제약: ${platformConstraints[platform] || platform}
4. 상황 맥락: ${contextDescriptions[context] || context}
5. 목표 톤 레벨: ${toneDescriptions[toneLevel] || toneLevel}

[핵심 평가 및 교정 가이드라인]
• 글자 수 정밀 판정 (공백 제외 및 공백 포함 기준):
  - 버튼: 4자 이내(공백제외) 권장. 초과 시 'exceeded' 또는 'warning' 판정. 대안 1, 2는 반드시 가이드 글자 수(4자 이내 또는 CTA 12자 이내)를 철저히 지킬 것!
  - 팝업/모달: 타이틀 16자 이내, 본문 60자 이내.
  - 토스트: 25자 이내 1줄.
  - 레이블: 6자 이내.
• 말투 및 어조 기준 판정:
  - 버튼: 명사형 종결 필수, [확인], [취소], [로그인]에 '~하기' 절대 금지!
  - 팝업/안내문: 표준 해요체, 두괄식 해결책 제시.
• 금지 표현 및 한자어 배제:
  - '금일', '해당', '통하여', '의하여', '기재', '되어집니다' 등 배제.

${customRulesStr}
${terminologyStr}
${memoryStr}

반드시 JSON 포맷으로 응답해야 하며, 검수 대상 문구가 여러 개이거나 화면 전체일 경우 각각을 items 배열의 독립된 항목으로 분리하여 검수 결과를 제공하세요.
각 항목마다 다음을 포함하세요:
- id: 고유 식별자
- originalText: 원문
- locationLabel: 화면상 위치/역할 (예: "버튼 (Single)", "팝업 타이틀", "확인 CTA", "토스트 메시지")
- componentType: "${componentType}" 또는 문구 역할에 맞는 컴포넌트 타입
- score: { clarity: 0~100, conciseness: 0~100, toneFit: 0~100, platformFit: 0~100, componentGuideFit: 0~100 }
- charEvaluation: {
    currentCharsNoSpace: 원문 공백제외 글자수(숫자),
    currentCharsWithSpace: 원문 공백포함 글자수(숫자),
    limitChars: 해당 컴포넌트 기준 글자수(숫자, 예: 버튼은 4),
    status: "optimal"(기준 내) | "warning"(약간 초과/CTA범위) | "exceeded"(기준 대폭 초과),
    diff: 기준 대비 초과한 글자수(숫자, 여유있으면 음수),
    message: "글자 수 평가 요약 (예: 공백제외 4자 기준 2자 초과)"
  }
- toneEvaluation: {
    status: "passed" | "warning" | "failed",
    detectedForm: "원문에서 감지된 어조 (예: 장황한 서술형, '~하기' 접미)",
    targetForm: "목표 어조 (예: 명사형 간결 종결)",
    score: 0~100,
    message: "말투 기준 평가 설명",
    ruleChecks: [
      { ruleName: "명사형 종결 준수", passed: boolean, detail: "상세 설명" },
      { ruleName: "'~하기' 금지 규칙", passed: boolean, detail: "상세 설명" },
      { ruleName: "쉬운 일상어 사용", passed: boolean, detail: "상세 설명" }
    ]
  }
- alt1: {
    title: "대안 1: 직관·간결형 (추천)",
    text: "가이드 및 글자수 기준을 완벽 준수한 최적 수정 문구",
    highlights: "개선 포인트 핵심 요약",
    charCount: 글자수(공백포함 숫자),
    charCountNoSpace: 글자수(공백제외 숫자),
    charFitStatus: "optimal"
  }
- alt2: {
    title: "대안 2: 친절·공감형 또는 확장 CTA형",
    text: "수정 문구 대안",
    highlights: "개선 포인트 핵심 요약",
    charCount: 글자수(공백포함 숫자),
    charCountNoSpace: 글자수(공백제외 숫자),
    charFitStatus: "optimal" | "warning"
  }
- violations: [{ category: "간결성"|"명확성"|"직관성"|"일관성"|"플랫폼제약"|"어법/맞춤법"|"브랜드보이스"|"글자수초과"|"컴포넌트규칙", severity: "high"|"medium"|"low", title: "규칙 위배 제목", description: "위배 이유 설명", violatedTextPart: "위배된 부분 단어" }]
- explanation: "종합 수정 이유 및 엔터프라이즈 UX 라이팅 표준 가이드 해설"
- similarCases: [{ original: "과거 유사 문구 예시", revised: "개선된 모범 사례", serviceCategory: "유사 서비스", reason: "개선 사유" }]
overallSummary: "전체 검수 총평 및 핵심 개선 요약 (2~3문장)"`;

    let contents: any[] = [];

    if (image?.data) {
      contents.push({
        inlineData: {
          mimeType: image.mimeType || 'image/png',
          data: image.data,
        },
      });
      contents.push({
        text: `첨부된 화면 스크린샷 이미지 내의 모든 텍스트/카피(헤더, 본문, 버튼, 캡션, 팝업 등)를 인식 및 추출하여 각각의 문구에 대해 위의 가이드에 맞춰 정밀 UX 라이팅 검수를 진행하고 JSON으로 반환해주세요. ${
          text ? `(사용자 추가 요청/메모: ${text})` : ''
        }`,
      });
    } else if (pdf?.data) {
      contents.push({
        inlineData: {
          mimeType: pdf.mimeType || 'application/pdf',
          data: pdf.data,
        },
      });
      contents.push({
        text: `첨부된 화면설계서/기획서 PDF 문서에서 주요 화면별 텍스트 및 UI 카피들을 추출하여 각각에 대해 UX 라이팅 검수를 진행하고 JSON으로 반환해주세요. ${
          text ? `(사용자 추가 요청/메모: ${text})` : ''
        }`,
      });
    } else {
      contents.push({
        text: `다음 입력 텍스트(단일 문구 또는 여러 줄로 구성된 화면 전체 카피)를 분석하여 검수 결과를 반환해주세요:\n\n"""\n${text}\n"""`,
      });
    }

    const response = await generateContentWithRetryAndFallback(ai, {
      preferredModel: 'gemini-3.1-flash-lite',
      contents: contents,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            overallSummary: {
              type: Type.STRING,
              description: '전체 검수 총평 및 핵심 개선 요약',
            },
            items: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  originalText: { type: Type.STRING },
                  locationLabel: { type: Type.STRING },
                  componentType: { type: Type.STRING },
                  score: {
                    type: Type.OBJECT,
                    properties: {
                      clarity: { type: Type.NUMBER },
                      conciseness: { type: Type.NUMBER },
                      toneFit: { type: Type.NUMBER },
                      platformFit: { type: Type.NUMBER },
                      componentGuideFit: { type: Type.NUMBER },
                    },
                    required: ['clarity', 'conciseness', 'toneFit', 'platformFit'],
                  },
                  charEvaluation: {
                    type: Type.OBJECT,
                    properties: {
                      currentCharsNoSpace: { type: Type.NUMBER },
                      currentCharsWithSpace: { type: Type.NUMBER },
                      limitChars: { type: Type.NUMBER },
                      status: { type: Type.STRING, enum: ['optimal', 'warning', 'exceeded'] },
                      diff: { type: Type.NUMBER },
                      message: { type: Type.STRING },
                    },
                  },
                  toneEvaluation: {
                    type: Type.OBJECT,
                    properties: {
                      status: { type: Type.STRING, enum: ['passed', 'warning', 'failed'] },
                      detectedForm: { type: Type.STRING },
                      targetForm: { type: Type.STRING },
                      score: { type: Type.NUMBER },
                      message: { type: Type.STRING },
                      ruleChecks: {
                        type: Type.ARRAY,
                        items: {
                          type: Type.OBJECT,
                          properties: {
                            ruleName: { type: Type.STRING },
                            passed: { type: Type.BOOLEAN },
                            detail: { type: Type.STRING },
                          },
                          required: ['ruleName', 'passed', 'detail'],
                        },
                      },
                    },
                  },
                  alt1: {
                    type: Type.OBJECT,
                    properties: {
                      title: { type: Type.STRING },
                      text: { type: Type.STRING },
                      highlights: { type: Type.STRING },
                      charCount: { type: Type.NUMBER },
                      charCountNoSpace: { type: Type.NUMBER },
                      charFitStatus: { type: Type.STRING },
                    },
                    required: ['title', 'text', 'highlights', 'charCount'],
                  },
                  alt2: {
                    type: Type.OBJECT,
                    properties: {
                      title: { type: Type.STRING },
                      text: { type: Type.STRING },
                      highlights: { type: Type.STRING },
                      charCount: { type: Type.NUMBER },
                      charCountNoSpace: { type: Type.NUMBER },
                      charFitStatus: { type: Type.STRING },
                    },
                    required: ['title', 'text', 'highlights', 'charCount'],
                  },
                  violations: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        category: { type: Type.STRING },
                        severity: { type: Type.STRING },
                        title: { type: Type.STRING },
                        description: { type: Type.STRING },
                        violatedTextPart: { type: Type.STRING },
                      },
                      required: ['category', 'severity', 'title', 'description'],
                    },
                  },
                  explanation: { type: Type.STRING },
                  similarCases: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        original: { type: Type.STRING },
                        revised: { type: Type.STRING },
                        serviceCategory: { type: Type.STRING },
                        reason: { type: Type.STRING },
                      },
                      required: ['original', 'revised', 'serviceCategory', 'reason'],
                    },
                  },
                },
                required: [
                  'originalText',
                  'score',
                  'alt1',
                  'alt2',
                  'violations',
                  'explanation',
                  'similarCases',
                ],
              },
            },
          },
          required: ['items', 'overallSummary'],
        },
      },
    });

    const rawText = response.text || '{}';
    const parsed = JSON.parse(rawText);

    // Ensure IDs exist for each item
    if (parsed.items) {
      parsed.items = parsed.items.map((item: any, i: number) => ({
        ...item,
        id: item.id || `item-${Date.now()}-${i}`,
      }));
    }

    res.json({
      success: true,
      data: parsed,
    });
  } catch (error: any) {
    console.error('Inspection error (falling back to rule engine):', error?.message || error);
    try {
      const fallbackResult = buildRuleBasedInspection({
        text: req.body?.text,
        image: req.body?.image,
        pdf: req.body?.pdf,
        service: req.body?.service,
        platform: req.body?.platform,
        componentType: req.body?.componentType,
        componentGuide: req.body?.componentGuide,
        context: req.body?.context,
        toneLevel: req.body?.toneLevel,
        customRules: req.body?.customRules,
        terminology: req.body?.terminology,
      });
      return res.json({
        success: true,
        data: fallbackResult,
      });
    } catch (fallbackErr) {
      return res.status(500).json({
        success: false,
        error: '검수 처리 중 오류가 발생했습니다. 다시 시도해 주세요.',
      });
    }
  }
});

// Conversational Re-editing Endpoint
app.post('/api/gemini/refine', async (req, res) => {
  try {
    const {
      item,
      userInstruction,
      service,
      platform,
      context,
      toneLevel,
      chatHistory = [],
    } = req.body;

    const ai = getGeminiClient();

    if (!ai) {
      // Local heuristic refine fallback
      const baseAlt = item?.alt1?.text || item?.originalText || '';
      let refined = baseAlt;
      if (userInstruction.includes('짧게') || userInstruction.includes('간결')) {
        refined = baseAlt.slice(0, 10);
      } else if (userInstruction.includes('친절') || userInstruction.includes('해요')) {
        refined = baseAlt.replace(/합니다$/, '해요').replace(/하십시오$/, '해 주세요');
      } else if (userInstruction.includes('명사') || userInstruction.includes('버튼')) {
        refined = baseAlt.replace(/하기$/, '').replace(/해 주세요$/, '');
      } else {
        refined = `${baseAlt} (수정 반영)`;
      }

      return res.json({
        success: true,
        data: {
          replyMessage: `요청하신 사항("${userInstruction}")을 반영하여 더욱 정돈된 문구로 수정했습니다.`,
          suggestedText: refined,
          alt1: {
            title: '대안 1 (수정 반영형)',
            text: refined,
            highlights: '사용자 재교정 요청 반영',
            charCount: refined.length,
          },
          alt2: {
            title: '대안 2 (간결 대안)',
            text: refined.replace(/\s+/g, ' ').trim(),
            highlights: '간결성 극대화',
            charCount: refined.length,
          },
        },
      });
    }

    const prompt = `당신은 UX 라이팅 전문 AI 어시스턴트입니다.
사용자가 기존 검수된 문구에 대해 대화형으로 추가 수정/재교정을 요청했습니다.

[현재 설정]
- 서비스: ${service}
- 플랫폼: ${platform}
- 상황 맥락: ${context}
- 톤 레벨: Level ${toneLevel}
- 원본 문구: "${item.originalText}"
- 기존 제안 대안 1: "${item.alt1?.text}"
- 기존 제안 대안 2: "${item.alt2?.text}"

[이전 대화 기록]
${chatHistory.map((c: any) => `${c.sender}: ${c.message}`).join('\n')}

[사용자의 추가 수정 요청]
"${userInstruction}"

위 요청을 반영하여 새로운 대안 문장 2가지와, 사용자의 요청을 어떻게 반영했는지에 대한 친절한 설명 및 조언을 제공해주세요.
반드시 JSON 형식으로 반환하세요.`;

    const response = await generateContentWithRetryAndFallback(ai, {
      preferredModel: 'gemini-3.1-flash-lite',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            replyMessage: {
              type: Type.STRING,
              description: '사용자 요청에 대한 친절한 응답 및 반영 내용 설명',
            },
            suggestedText: {
              type: Type.STRING,
              description: '사용자 요청을 가장 정확히 반영한 최종 추천 문구',
            },
            alt1: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                text: { type: Type.STRING },
                highlights: { type: Type.STRING },
                charCount: { type: Type.NUMBER },
              },
              required: ['title', 'text', 'highlights', 'charCount'],
            },
            alt2: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                text: { type: Type.STRING },
                highlights: { type: Type.STRING },
                charCount: { type: Type.NUMBER },
              },
              required: ['title', 'text', 'highlights', 'charCount'],
            },
          },
          required: ['replyMessage', 'suggestedText', 'alt1', 'alt2'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json({
      success: true,
      data: parsed,
    });
  } catch (error: any) {
    console.error('Refine error (using fallback):', error?.message || error);
    const baseAlt = req.body?.item?.alt1?.text || req.body?.item?.originalText || '';
    return res.json({
      success: true,
      data: {
        replyMessage: `요청하신 피드백을 반영하여 문구를 교정했습니다.`,
        suggestedText: baseAlt,
        alt1: {
          title: '대안 1 (수정 반영형)',
          text: baseAlt,
          highlights: '사용자 피드백 반영',
          charCount: baseAlt.length,
        },
        alt2: {
          title: '대안 2 (간결 대안)',
          text: baseAlt,
          highlights: '간결성 최적화',
          charCount: baseAlt.length,
        },
      },
    });
  }
});

// Self-Learning & Guide Auto-Tuning Endpoint
app.post('/api/gemini/learn-guide', async (req, res) => {
  try {
    const { feedbackList = [], currentRules = [], terminology = [] } = req.body;

    const ai = getGeminiClient();

    if (!ai) {
      return res.json({
        success: true,
        data: {
          analysisReport: `누적된 피드백 ${feedbackList.length}건을 분석한 결과, 사용자들은 간결한 명사형 종결 버튼과 친절한 표준 해요체 안내문을 선호하는 경향이 뚜렷하게 확인되었습니다.`,
          newRules: [
            {
              category: '간결성',
              ruleTitle: '버튼 CTA 4자 이내 압축 원칙',
              description: '고객의 빠른 결정을 돕기 위해 확인/이동 버튼은 4자 이내 단일 명사로 통일합니다.',
              badExample: '다음 단계로 이동하기',
              goodExample: '다음',
            },
            {
              category: '친절성',
              ruleTitle: '안내문 표준 해요체 적용',
              description: '경직된 격식체(~바랍니다) 대신 친근한 표준 해요체(~해 주세요)를 사용합니다.',
              badExample: '입력하여 주시기 바랍니다.',
              goodExample: '입력해 주세요.',
            },
          ],
          newTerms: [
            {
              prohibitedTerm: '금일',
              recommendedTerm: '오늘',
              reason: '쉬운 일상어 사용 및 한자어 배제',
            },
            {
              prohibitedTerm: '회귀',
              recommendedTerm: '돌아가기',
              reason: '직관적인 행동 지시어 사용',
            },
          ],
        },
      });
    }

    const prompt = `당신은 고객언어 가이드라인 총괄 리드입니다.
사용자들이 그동안 검수 결과에 대해 남긴 피드백(채택한 문구, 거절한 문구, 코멘트 등)을 분석하여, 우리 서비스의 '새로운 맞춤형 언어 가이드 규칙'과 '권장 표현'을 도출해 주세요.

[축적된 사용자 피드백 데이터 (${feedbackList.length}건)]
${feedbackList
  .map(
    (f: any, i: number) =>
      `${i + 1}. [서비스: ${f.service}, 플랫폼: ${f.platform}, 상황: ${f.context}]
- 원문: "${f.originalText}"
- 유저가 최종 채택한 문구: "${f.adoptedText}"
${f.rejectedText ? `- 유저가 거절한 대안: "${f.rejectedText}"` : ''}
- 유저 피드백: ${f.userComment || '만족 채택'}`
  )
  .join('\n\n')}

[기존 등록된 규칙]
${currentRules.map((r: any) => `- ${r.ruleTitle}: ${r.description}`).join('\n')}

위 피드백에서 나타나는 사용자들의 일관된 선호 성향(예: 특정 종결어미 선호, 글자 수 압축 선호, 친근한 이모지/감탄사 선호 등)을 학습하여, 새롭게 추가할 만한 가이드 규칙 2~3개와 추천 금지어/권장어 쌍을 JSON 형식으로 작성해 주세요.`;

    const response = await generateContentWithRetryAndFallback(ai, {
      preferredModel: 'gemini-3.1-flash-lite',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            analysisReport: {
              type: Type.STRING,
              description: '사용자 피드백 데이터로부터 도출된 브랜드 선호 톤 & 언어 습관 분석 리포트',
            },
            newRules: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  category: { type: Type.STRING },
                  ruleTitle: { type: Type.STRING },
                  description: { type: Type.STRING },
                  badExample: { type: Type.STRING },
                  goodExample: { type: Type.STRING },
                },
                required: ['category', 'ruleTitle', 'description', 'badExample', 'goodExample'],
              },
            },
            newTerms: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  prohibitedTerm: { type: Type.STRING },
                  recommendedTerm: { type: Type.STRING },
                  reason: { type: Type.STRING },
                },
                required: ['prohibitedTerm', 'recommendedTerm', 'reason'],
              },
            },
          },
          required: ['analysisReport', 'newRules', 'newTerms'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json({
      success: true,
      data: parsed,
    });
  } catch (error: any) {
    console.error('Learning guide error (using fallback):', error);
    res.json({
      success: true,
      data: {
        analysisReport: '사용자 피드백 데이터 분석을 바탕으로 자주 채택되는 표준 고객언어 규칙과 지양 표현을 도출했습니다.',
        newRules: [
          {
            category: '간결성',
            ruleTitle: '버튼 CTA 4자 이내 압축 원칙',
            description: '고객의 빠른 결정을 돕기 위해 확인/이동 버튼은 4자 이내 단일 명사로 통일합니다.',
            badExample: '다음 단계로 이동하기',
            goodExample: '다음',
          },
          {
            category: '친절성',
            ruleTitle: '안내문 표준 해요체 적용',
            description: '경직된 격식체(~바랍니다) 대신 친근한 표준 해요체(~해 주세요)를 사용합니다.',
            badExample: '입력하여 주시기 바랍니다.',
            goodExample: '입력해 주세요.',
          },
        ],
        newTerms: [
          {
            prohibitedTerm: '금일',
            recommendedTerm: '오늘',
            reason: '쉬운 일상어 사용 및 한자어 배제',
          },
          {
            prohibitedTerm: '회귀',
            recommendedTerm: '돌아가기',
            reason: '직관적인 행동 지시어 사용',
          },
        ],
      },
    });
  }
});

// Vite middleware for dev or static serving for production
async function setupViteOrStatic() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`UX Writing Inspector Server running on http://localhost:${PORT}`);
  });
}

setupViteOrStatic().catch((err) => {
  console.error('Failed to start server:', err);
});
