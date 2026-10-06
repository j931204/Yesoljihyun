/**
 * Prompt Builder for In-Browser Local LLM
 * Formats System Prompt, RAG Guide Rules, Few-Shot Past Cases, and JSON Schema instructions.
 */

import { ScoredChunk } from '../rag/search';
import { PastCorrectionCase } from '../storage/correctionHistoryDB';

export interface PromptPayload {
  inputSentence: string;
  guideTitle: string;
  guideVersion: string;
  componentType: string;
  service: string;
  context: string;
  toneLevel: number;
  relevantRules: ScoredChunk[];
  pastCases: PastCorrectionCase[];
}

export function buildSystemPrompt(guideTitle: string, guideVersion: string): string {
  return `당신은 회사의 전문 UX Writer이자 사내 공식 언어가이드 검수자입니다.
반드시 제공된 언어가이드[${guideTitle} (${guideVersion})]를 가장 우선적인 절대적 판단 기준으로 사용합니다.
일반적인 사전적 문법 지식보다 사내 공식 언어가이드 규정이 우선합니다.
가이드에 없는 내용을 임의로 회사 정책인 것처럼 지어내지 마세요.
원문의 핵심 의미와 의도를 왜곡하거나 변경하지 마세요.
불필요하게 문장을 과도하게 재작성하지 마세요.
가이드 기준상 문제가 없는 문장은 억지로 수정하지 마세요 (needsRevision: false).
교정이 필요한 경우 어떤 가이드 규칙을 위반했는지 명확한 규칙명과 이유를 밝히세요.

반드시 다른 부가적인 인사말 없이 오직 순수한 JSON 객체 하나만 출력하세요.`;
}

export function buildUserPrompt(payload: PromptPayload): string {
  const {
    inputSentence,
    guideTitle,
    guideVersion,
    componentType,
    service,
    context,
    toneLevel,
    relevantRules,
    pastCases,
  } = payload;

  const toneNames: Record<number, string> = {
    1: 'Level 1: 매우 정중 / 격식체 (~하십시오, ~바랍니다)',
    2: 'Level 2: 친절 / 표준 해요체 (~해요, ~해 주세요)',
    3: 'Level 3: 직관 / 간결 명사형 (명사형 종결, ~하기 지양)',
    4: 'Level 4: 친근 / 대화체',
  };

  // 1. Format Relevant RAG Guide Rules (Top 5~10)
  const rulesText = relevantRules.length > 0
    ? relevantRules
        .map((r, i) => {
          const c = r.chunk;
          return `[규칙 ${i + 1}: ${c.ruleId} ${c.title}]
- 분류: ${c.category} (적용영역: ${c.componentType})
- 규정 내용: ${c.description}
${c.prohibitedPattern ? `- 지양 표현(Bad): "${c.prohibitedPattern}"` : ''}
${c.recommendedPattern ? `- 권장 표현(Good): "${c.recommendedPattern}"` : ''}`;
        })
        .join('\n\n')
    : `(기본 원칙: 명사형 간결 종결, 불필요한 '~하기' 접미사 지양, 어려운 한자어 배제, 표준 해요체)`;

  // 2. Format Past Similar Cases (Few-Shot Examples)
  const pastCasesText = pastCases.length > 0
    ? `\n[사용자가 과거에 채택한 회사 언어 교정 모범 사례 (Few-Shot)]\n` +
      pastCases
        .map(
          (pc, i) =>
            `사례 ${i + 1}:
- 원문: "${pc.original}"
- 최종 채택 교정문: "${pc.finalRevision}"
- 적용 규칙: ${pc.appliedRules.join(', ') || '가이드 표준 준수'}`
        )
        .join('\n\n')
    : '';

  const componentSpecificHint = componentType === 'button'
    ? `\n[버튼 컴포넌트 특화 필수 규정]
- 버튼에 대화체 문장형 서술어(~해주세요, ~해 주세요, ~바랍니다, ~하세요 등)를 사용하는 것은 절대 금지됩니다.
- 사내 가이드 W-201에 따라 '예약하기', '신청하기', '결제하기', '확인하기' 등 행동을 명확하게 지시하는 액션 CTA(~하기) 또는 명사형으로 교정해야 합니다. (예: "예약해주세요" -> "예약하기")`
    : '';

  return `[사내 공식 언어가이드: ${guideTitle} (${guideVersion})]
[작업 환경 및 타깃]
- 대상 컴포넌트: ${componentType}
- 서비스 도메인: ${service}
- 상황 맥락: ${context}
- 목표 톤 레벨: ${toneNames[toneLevel] || `Level ${toneLevel}`}
${componentSpecificHint}

[검색된 관련 언어가이드 규칙 (RAG Top Matches)]
${rulesText}
${pastCasesText}

[검수할 원본 문장]
"${inputSentence}"

위 문장을 관련 가이드 규정에 따라 검수하고, 다음 JSON 형식으로만 응답하세요:
{
  "needsRevision": true 또는 false,
  "original": "${inputSentence}",
  "revised": "교정된 최종 추천 문장 (수정이 필요 없으면 원문 그대로)",
  "violations": [
    {
      "rule": "위반한 규칙명 (예: [W-201] 버튼 명사형 종결 또는 [W-301] 한자어 순화)",
      "originalPart": "문장에서 문제가 된 부분",
      "suggestion": "수정 제안 단어/어미",
      "reason": "사내 언어가이드에 따른 교정 사유"
    }
  ],
  "summary": "1~2문장의 간결한 교정 요약 총평"
}`;
}
