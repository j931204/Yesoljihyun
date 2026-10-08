/**
 * Post-Processing Validation Layer
 * Enforces strict consistency rules on LLM and heuristic outputs.
 * Eliminates false-positive corrections (e.g. originalPart === suggestion, revised === original).
 * Guarantees that guidelines (e.g. '예약해주세요' -> '예약하기', '포커스를 이동하여...' -> '옮겨서...')
 * are reliably enforced without hallucinated identical suggestions.
 */

import { StructuredGuideRule } from '../../types';
import { LocalInspectionViolation } from './localLLM';

export interface ValidationOutput {
  isValid: boolean;
  needsRevision: boolean;
  original: string;
  revised: string;
  violations: LocalInspectionViolation[];
  summary: string;
  removedSameWordViolations: Array<{ originalPart: string; suggestion: string; reason: string }>;
  isIdenticalOriginalRevised: boolean;
  unresolvedAvoidTerms: string[];
  needRetry: boolean;
  retryReason?: string;
  appliedDeterministicFix: boolean;
}

/**
 * Normalizes string for strict equality checks (removes quotes, outer punctuation, excess whitespace)
 */
export function normalizeCopy(str: string): string {
  if (!str) return '';
  return str
    .replace(/["'“‘”’]/g, '')
    .replace(/[.!?~,\s]+/g, ' ')
    .trim()
    .toLowerCase();
}

/**
 * Deterministically applies exact match rule replacements to original sentence
 */
export function applyDeterministicReplacements(
  original: string,
  matchedRules: StructuredGuideRule[]
): {
  revised: string;
  appliedViolations: LocalInspectionViolation[];
} {
  let revised = original.trim();
  const appliedViolations: LocalInspectionViolation[] = [];

  for (const rule of matchedRules) {
    const preferred = rule.preferred[0]?.trim();
    if (!preferred) continue;

    for (const rawAvoid of rule.avoid) {
      const avoid = rawAvoid?.trim();
      if (!avoid || avoid === preferred) continue;

      let matchedTarget = '';
      if (revised.includes(avoid)) {
        matchedTarget = avoid;
      } else {
        const strippedAvoid = avoid.replace(/[.!?~,\s]+$/, '');
        if (strippedAvoid && revised.includes(strippedAvoid)) {
          matchedTarget = strippedAvoid;
        }
      }

      if (matchedTarget && matchedTarget !== preferred) {
        revised = revised.replaceAll(matchedTarget, preferred);
        appliedViolations.push({
          rule: `[${rule.id}] ${rule.category}`,
          originalPart: matchedTarget,
          suggestion: preferred,
          reason: rule.description || '사내 공식 언어가이드 확정 적용 규칙',
          ruleOrigin: 'guide',
          sourceText: rule.sourceText,
        });
        break; // Match rule once
      }
    }
  }

  return {
    revised,
    appliedViolations,
  };
}

/**
 * Validates and sanitizes correction results according to Conditions A ~ E
 */
export function validateCorrectionResult(
  original: string,
  llmResult: {
    needsRevision: boolean;
    revised: string;
    violations: LocalInspectionViolation[];
    summary?: string;
  },
  exactMatchRules: StructuredGuideRule[] = []
): ValidationOutput {
  const normOriginal = normalizeCopy(original);
  let revised = (llmResult.revised || original).trim();
  let normRevised = normalizeCopy(revised);

  const rawViolations = Array.isArray(llmResult.violations) ? llmResult.violations : [];
  const validViolations: LocalInspectionViolation[] = [];
  const removedSameWordViolations: Array<{ originalPart: string; suggestion: string; reason: string }> = [];

  // Condition A: Strip any violation where originalPart and suggestion are identical
  for (const v of rawViolations) {
    const normPart = normalizeCopy(v.originalPart);
    const normSug = normalizeCopy(v.suggestion);

    if (normPart === normSug || !normPart || !normSug) {
      removedSameWordViolations.push({
        originalPart: v.originalPart,
        suggestion: v.suggestion,
        reason: '수정 전과 수정 후 단어가 완전히 동일하여 false-positive로 감지되어 제거됨',
      });
    } else {
      validViolations.push({
        ...v,
        originalPart: v.originalPart.trim(),
        suggestion: v.suggestion.trim(),
      });
    }
  }

  // Condition E & Guide Enforcement Check:
  // Identify any confirmed guide rules whose avoid terms were in the original sentence
  interface MatchedAvoidInfo {
    rule: StructuredGuideRule;
    avoid: string;
    preferred: string;
  }
  const matchedAvoidsInOriginal: MatchedAvoidInfo[] = [];

  for (const rule of exactMatchRules) {
    const preferred = rule.preferred[0]?.trim();
    if (!preferred) continue;

    for (const rawAvoid of rule.avoid) {
      const avoid = rawAvoid?.trim();
      if (!avoid || avoid === preferred) continue;

      const strippedAvoid = avoid.replace(/[.!?~,\s]+$/, '');
      if (
        original.includes(avoid) ||
        (strippedAvoid && original.includes(strippedAvoid)) ||
        normOriginal.includes(normalizeCopy(avoid))
      ) {
        matchedAvoidsInOriginal.push({
          rule,
          avoid,
          preferred,
        });
        break;
      }
    }
  }

  // Check if those avoid terms are unresolved in revised output
  const unresolvedAvoidTerms: string[] = [];
  let appliedDeterministicFix = false;

  for (const item of matchedAvoidsInOriginal) {
    const strippedAvoid = item.avoid.replace(/[.!?~,\s]+$/, '');
    const isStillPresent =
      revised.includes(item.avoid) ||
      (strippedAvoid && revised.includes(strippedAvoid)) ||
      normRevised.includes(normalizeCopy(item.avoid));

    if (isStillPresent) {
      unresolvedAvoidTerms.push(item.avoid);
    }
  }

  // If prohibited terms from confirmed guidelines are STILL in the sentence,
  // or if the model erroneously reported revised === original, force deterministic fix
  if (unresolvedAvoidTerms.length > 0 && matchedAvoidsInOriginal.length > 0) {
    for (const item of matchedAvoidsInOriginal) {
      const preferred = item.preferred;
      let target = '';

      if (revised.includes(item.avoid)) {
        target = item.avoid;
      } else {
        const strippedAvoid = item.avoid.replace(/[.!?~,\s]+$/, '');
        if (strippedAvoid && revised.includes(strippedAvoid)) {
          target = strippedAvoid;
        }
      }

      if (target && target !== preferred) {
        revised = revised.replaceAll(target, preferred);
        appliedDeterministicFix = true;

        // Ensure violation is registered
        const alreadyHas = validViolations.some(
          (v) => normalizeCopy(v.originalPart) === normalizeCopy(target)
        );
        if (!alreadyHas) {
          validViolations.push({
            rule: `[${item.rule.id}] ${item.rule.category}`,
            originalPart: target,
            suggestion: preferred,
            reason: item.rule.description || '사내 공식 언어가이드 확정 적용 규칙',
            ruleOrigin: 'guide',
            sourceText: item.rule.sourceText,
          });
        }
      }
    }
    normRevised = normalizeCopy(revised);
  }

  // Condition B: Check if original and revised are identical
  const isIdentical = normOriginal === normRevised;
  if (isIdentical) {
    // If there were genuinely no violations, return clean result
    return {
      isValid: true,
      needsRevision: false,
      original,
      revised: original,
      violations: [],
      summary: '사내 언어가이드 기준으로 수정이 필요한 부분이 없습니다.',
      removedSameWordViolations,
      isIdenticalOriginalRevised: true,
      unresolvedAvoidTerms: [],
      needRetry: false,
      appliedDeterministicFix,
    };
  }

  // Condition C & D: If no valid violations exist after filtering, needsRevision = false
  let needsRevision = validViolations.length > 0;
  if (!needsRevision) {
    return {
      isValid: true,
      needsRevision: false,
      original,
      revised: original,
      violations: [],
      summary: llmResult.summary || '사내 언어가이드 기준으로 수정이 필요한 부분이 없습니다.',
      removedSameWordViolations,
      isIdenticalOriginalRevised: false,
      unresolvedAvoidTerms: [],
      needRetry: false,
      appliedDeterministicFix,
    };
  }

  return {
    isValid: true,
    needsRevision: true,
    original,
    revised,
    violations: validViolations,
    summary:
      llmResult.summary ||
      `사내 언어가이드 규정(${validViolations.map((v) => v.rule).join(', ')})에 따라 교정되었습니다.`,
    removedSameWordViolations,
    isIdenticalOriginalRevised: false,
    unresolvedAvoidTerms,
    needRetry: false,
    appliedDeterministicFix,
  };
}
