/**
 * 3-Stage Hybrid Rule Retrieval Engine
 * 3-1. Exact Match (synthesizes structured rules from both extracted rules and raw chunks)
 * 3-2. Regex / Morphological boundary matching
 * 3-3. Semantic RAG (Keyword / token / morpheme similarity scoring)
 */

import { StructuredGuideRule } from '../../types';
import { GuideChunk } from '../storage/languageGuideDB';
import { searchRelevantGuideRules, ScoredChunk } from './search';

export interface HybridSearchOptions {
  componentType?: string;
  category?: string;
  limitSemantic?: number;
}

export interface HybridSearchResult {
  exactMatchRules: StructuredGuideRule[];
  regexMatchRules: StructuredGuideRule[];
  semanticChunks: ScoredChunk[];
  allMatchedRules: StructuredGuideRule[];
  debugScores: Array<{ id: string; title: string; score: number; reason: string }>;
}

function normalize(str: string): string {
  return (str || '')
    .toLowerCase()
    .replace(/[.!?~,'"`·\s]+/g, ' ')
    .trim();
}

/**
 * Escapes regex special characters
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Executes 3-Stage Hybrid Search over structured rules and raw chunks
 */
export function hybridRetrieveRules(
  inputSentence: string,
  structuredRules: StructuredGuideRule[],
  rawChunks: GuideChunk[],
  options: HybridSearchOptions = {}
): HybridSearchResult {
  if (!inputSentence || !inputSentence.trim()) {
    return {
      exactMatchRules: [],
      regexMatchRules: [],
      semanticChunks: [],
      allMatchedRules: [],
      debugScores: [],
    };
  }

  const cleanInput = inputSentence.trim();
  const normalizedInput = normalize(cleanInput);

  // 1. Synthesize all active rules from structuredRules + rawChunks
  const allCandidateRules: StructuredGuideRule[] = [...structuredRules];
  const seenAvoids = new Set(allCandidateRules.flatMap((r) => r.avoid.map(normalize)));

  for (const chunk of rawChunks) {
    const before = (chunk.beforeExample || chunk.prohibitedPattern || '').trim();
    const after = (chunk.afterExample || chunk.recommendedPattern || '').trim();
    if (before && after && before !== after) {
      const normBefore = normalize(before);
      if (!seenAvoids.has(normBefore)) {
        seenAvoids.add(normBefore);
        allCandidateRules.push({
          id: chunk.ruleId || `synth-${chunk.id}`,
          category: chunk.category || chunk.title,
          type: 'phrase',
          avoid: [before, before.replace(/[.!?~,\s]+$/, '')].filter(Boolean),
          preferred: [after],
          description: chunk.description || `${before} 대신 ${after} 사용 권장`,
          examples: [{ before, after }],
          sourceText: `[${chunk.ruleId}] ${chunk.title}: ${before} -> ${after}`,
          componentType: chunk.componentType,
        });
      }
    }
  }

  const exactMatchRules: StructuredGuideRule[] = [];
  const regexMatchRules: StructuredGuideRule[] = [];
  const debugScores: Array<{ id: string; title: string; score: number; reason: string }> = [];
  const seenRuleIds = new Set<string>();

  // 3-1. Exact Match Stage
  // Check if any avoid expression in candidate rules is directly present in the input sentence
  for (const rule of allCandidateRules) {
    let matchedAvoid: string | null = null;
    for (const av of rule.avoid) {
      const cleanAv = av.trim();
      if (!cleanAv) continue;

      const strippedAv = cleanAv.replace(/[.!?~,\s]+$/, '');
      const normAv = normalize(cleanAv);

      // Direct exact substring match in original, stripped, or normalized input
      if (
        cleanInput.includes(cleanAv) ||
        (strippedAv && cleanInput.includes(strippedAv)) ||
        normalizedInput.includes(normAv) ||
        (normAv && normAv.includes(normalizedInput) && normalizedInput.length >= 4)
      ) {
        matchedAvoid = cleanAv;
        break;
      }
    }

    if (matchedAvoid) {
      exactMatchRules.push(rule);
      seenRuleIds.add(rule.id);
      debugScores.push({
        id: rule.id,
        title: rule.category || rule.description,
        score: 100,
        reason: `[3-1 확정 매칭] 사내 가이드 지양 표현 '${matchedAvoid}' 문장 내 직접 검출`,
      });
    }
  }

  // 3-2. Regex / Morphological Boundary Search
  // Handles variations like particles or endings: e.g., "이용이", "이용을", "이용에" or "예약(을) 해주세요"
  for (const rule of allCandidateRules) {
    if (seenRuleIds.has(rule.id)) continue;

    let regexMatched: string | null = null;
    for (const av of rule.avoid) {
      const cleanAv = av.trim();
      if (cleanAv.length < 3) continue;

      // Build safe boundary / particle flexible regex:
      // Allow flexible spacing between words and optional Korean particles (을/를/이/가/은/는/으로/로)
      const words = cleanAv.split(/\s+/).map(escapeRegex);
      if (words.length >= 2) {
        const pattern = new RegExp(words.join('\\s*(?:[을를이가은는로으로]?\\s*)?'), 'i');
        if (pattern.test(cleanInput)) {
          regexMatched = cleanAv;
          break;
        }
      } else {
        // Single word with verb/ending variation e.g., ~하십시오 -> ~하십시오. or ~하십시요
        const stem = cleanAv.slice(0, Math.max(2, cleanAv.length - 1));
        const pattern = new RegExp(`${escapeRegex(stem)}[가-힣]*`, 'i');
        if (pattern.test(cleanInput)) {
          regexMatched = cleanAv;
          break;
        }
      }
    }

    if (regexMatched) {
      regexMatchRules.push(rule);
      seenRuleIds.add(rule.id);
      debugScores.push({
        id: rule.id,
        title: rule.category || rule.description,
        score: 85,
        reason: `[3-2 형태 변형 매칭] 형태 변형 패턴 '${regexMatched}' 매칭`,
      });
    }
  }

  // 3-3. Semantic RAG Stage
  // Use BM25/keyword/morpheme token scoring across raw chunks
  const semanticChunks = searchRelevantGuideRules(cleanInput, rawChunks, {
    componentType: options.componentType,
    category: options.category,
    limit: options.limitSemantic || 6,
  });

  semanticChunks.forEach((sc) => {
    debugScores.push({
      id: sc.chunk.ruleId,
      title: sc.chunk.title,
      score: sc.score,
      reason: `[3-3 Semantic RAG] ${sc.matchReasons.join(', ') || '문맥 관련도'}`,
    });
  });

  // Combine rules for final reference
  const allMatchedRules = [...exactMatchRules, ...regexMatchRules];

  return {
    exactMatchRules,
    regexMatchRules,
    semanticChunks,
    allMatchedRules,
    debugScores,
  };
}
