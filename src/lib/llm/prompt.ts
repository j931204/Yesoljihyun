/**
 * Prompt Builder for In-Browser Local LLM
 * Separates Deterministic Exact Match Rules from Reference RAG Rules.
 * Prevents identical same-word replacements and false-positive violations.
 */

import { ScoredChunk } from '../rag/search';
import { PastCorrectionCase } from '../storage/correctionHistoryDB';
import { StructuredGuideRule } from '../../types';

export interface PromptPayload {
  inputSentence: string;
  guideTitle: string;
  guideVersion: string;
  componentType: string;
  service: string;
  context: string;
  toneLevel: number;
  exactMatchRules: StructuredGuideRule[];
  relevantRules: ScoredChunk[];
  pastCases: PastCorrectionCase[];
  retryReason?: string;
}

export function buildSystemPrompt(guideTitle: string, guideVersion: string): string {
  return `당신은 사내 공식 언어가이드[${guideTitle} (${guideVersion})]를 철저히 준수하는 전문 UX Writer이자 검수자입니다.

핵심 원칙:
1. 사내 공식 언어가이드가 일반적인 문법 지식보다 항상 최우선합니다.
2. 시스템이 탐지한 [확정 적용 규칙]은 반드시 추천 문장에 반영해야 하며, 반대로 적용하거나 무시해서는 안 됩니다.
3. [동일 단어 교정 금지] 수정 전 표현(originalPart)과 추천 표현(suggestion)이 동일한 단어라면 절대로 교정 사항(violations)으로 보고하지 마세요.
4. [불필요한 억지 교정 금지] 가이드 규정상 문제가 없는 문장이거나 이미 권장 표현을 사용하고 있다면 needsRevision: false, violations: [] 로 반환하세요.
5. 가이드에 근거하지 않은 가짜 회사 규정을 임의로 지어내지 마세요.
6. 원문의 본래 의도와 핵심 정보를 훼손하지 마세요.
7. 반드시 설명이나 추가 문장 없이 지정된 단일 JSON 객체 형식으로만 응답하세요.`;
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
    exactMatchRules,
    relevantRules,
    pastCases,
    retryReason,
  } = payload;

  const toneNames: Record<number, string> = {
    1: 'Level 1: 매우 정중 / 격식체 (~하십시오, ~바랍니다)',
    2: 'Level 2: 친절 / 표준 해요체 (~해요, ~해 주세요)',
    3: 'Level 3: 직관 / 간결 명사형 (명사형 종결, ~하기 지양)',
    4: 'Level 4: 친근 / 대화체',
  };

  // 1. Format Confirmed Exact Match Rules (Highest Priority)
  const exactRulesText =
    exactMatchRules.length > 0
      ? `\n[확정 적용 규칙 (시스템이 문장에서 직접 탐지함 - 반드시 반영)]\n` +
        exactMatchRules
          .map(
            (r, i) =>
              `규칙 ${i + 1} [${r.id}]:
- 카테고리: ${r.category}
- 지양 표현(Avoid): "${r.avoid.join('", "')}"
- 권장 표현(Preferred): "${r.preferred.join('", "')}"
- 사유 및 원칙: ${r.description}
${r.sourceText ? `- 가이드 출처: "${r.sourceText}"` : ''}`
          )
          .join('\n\n')
      : '';

  // 2. Format Reference RAG Rules (Filtered without duplicates of exact rules)
  const exactIds = new Set(exactMatchRules.map((e) => e.id));
  const referenceRules = relevantRules.filter((r) => !exactIds.has(r.chunk.ruleId));

  const referenceRulesText =
    referenceRules.length > 0
      ? `\n[관련 참고 언어가이드 규칙 (Semantic RAG)]\n` +
        referenceRules
          .map((r, i) => {
            const c = r.chunk;
            return `참고 ${i + 1} [${c.ruleId} ${c.title}]:
- 분류: ${c.category} (적용영역: ${c.componentType})
- 규정: ${c.description}
${c.prohibitedPattern ? `- 지양 예시: "${c.prohibitedPattern}"` : ''}
${c.recommendedPattern ? `- 권장 예시: "${c.recommendedPattern}"` : ''}`;
          })
          .join('\n\n')
      : '';

  // 3. Format Few-Shot Past Examples
  const pastCasesText =
    pastCases.length > 0
      ? `\n[과거 사용자가 채택한 회사 언어 교정 모범 사례]\n` +
        pastCases
          .map(
            (pc, i) =>
              `사례 ${i + 1}:
- 원문: "${pc.original}"
- 최종 채택: "${pc.finalRevision}"
- 적용 규칙: ${pc.appliedRules.join(', ') || '가이드 표준 준수'}`
          )
          .join('\n\n')
      : '';

  const retryNotice = retryReason
    ? `\n[이전 생성 검증 실패에 따른 재작성 요청]
주의: ${retryReason}
반드시 지양 표현을 권장 표현으로 수정한 새 추천 문장을 작성하세요.\n`
    : '';

  return `[가이드 문서: ${guideTitle} (${guideVersion})]
[작업 환경]
- 대상 컴포넌트: ${componentType}
- 서비스 도메인: ${service}
- 상황 맥락: ${context}
- 목표 톤 레벨: ${toneNames[toneLevel] || `Level ${toneLevel}`}
${retryNotice}${exactRulesText}${referenceRulesText}${pastCasesText}

[검수할 원본 문장]
"${inputSentence}"

위 문장을 언어가이드에 따라 검수하고 다음 JSON 형식으로만 응답하세요:
{
  "needsRevision": true 또는 false,
  "original": "${inputSentence}",
  "revised": "교정된 최종 추천 문장 (수정이 불필요한 경우 원문과 동일하게 작성)",
  "violations": [
    {
      "rule": "위반한 규칙명 (예: [W-201] 버튼 표기 원칙)",
      "originalPart": "문장에서 문제가 된 지양 단어/어미",
      "suggestion": "수정된 권장 단어/어미 (originalPart와 절대로 같으면 안 됨)",
      "reason": "사내 언어가이드에 근거한 교정 사유"
    }
  ],
  "summary": "1~2문장의 간결한 교정 요약 총평 (수정 없음인 경우 가이드 준수 안내)"
}

중요:
- originalPart와 suggestion이 같은 단어인 항목은 violations에 절대 포함하지 마세요.
- needsRevision이 false이면 violations는 빈 배열 []이어야 합니다.
- [확정 적용 규칙]의 지양어는 revised 문장에 남겨두지 마세요.`;
}
