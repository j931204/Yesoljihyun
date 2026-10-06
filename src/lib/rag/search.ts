/**
 * Client-side BM25 / Semantic RAG Search Engine
 * Retrieves the Top 5~10 most relevant language guide rules for a given input sentence.
 */

import { GuideChunk } from '../storage/languageGuideDB';

export interface SearchOptions {
  componentType?: string;
  category?: string;
  limit?: number; // default: 7 (Top 5~10)
}

export interface ScoredChunk {
  chunk: GuideChunk;
  score: number;
  matchReasons: string[];
}

function normalizeKorean(str: string): string {
  return (str || '')
    .toLowerCase()
    .replace(/[^\w\s가-힣]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Tokenize Korean and English text into normalized words and n-grams
 */
function tokenizeText(text: string): string[] {
  if (!text) return [];
  const clean = normalizeKorean(text);
  const words = clean.split(' ').filter((w) => w.length >= 1);
  const tokens = new Set<string>();

  words.forEach((w) => {
    tokens.add(w);
    // 2-gram substrings for Korean morpheme matching
    if (w.length >= 2) {
      for (let i = 0; i <= w.length - 2; i++) {
        tokens.add(w.slice(i, i + 2));
      }
    }
  });

  return Array.from(tokens);
}

/**
 * Retrieve Top 5~10 most relevant guide rules for an input sentence
 */
export function searchRelevantGuideRules(
  inputSentence: string,
  chunks: GuideChunk[],
  options: SearchOptions = {}
): ScoredChunk[] {
  const limit = options.limit || 8;
  if (!chunks || chunks.length === 0) return [];
  if (!inputSentence || !inputSentence.trim()) {
    return chunks.slice(0, limit).map((c) => ({
      chunk: c,
      score: 1.0,
      matchReasons: ['기본 필수 가이드 규정'],
    }));
  }

  const cleanInput = inputSentence.trim();
  const normalizedInput = normalizeKorean(cleanInput);
  const queryTokens = tokenizeText(inputSentence);

  const isButton =
    options.componentType === 'button' ||
    cleanInput.endsWith('하기') ||
    cleanInput.endsWith('버튼') ||
    cleanInput.includes('버튼') ||
    cleanInput.includes('해주세요');

  const isTvRemote =
    cleanInput.includes('리모컨') ||
    cleanInput.includes('방향키') ||
    cleanInput.includes('포커스') ||
    cleanInput.includes('선택하십시오');

  const scored: ScoredChunk[] = chunks.map((chunk) => {
    let score = 0;
    const matchReasons: string[] = [];

    const normBefore = normalizeKorean(chunk.beforeExample || chunk.prohibitedPattern || '');
    const normProhibited = normalizeKorean(chunk.prohibitedPattern || '');
    const normTitle = normalizeKorean(chunk.title || '');
    const normDesc = normalizeKorean(chunk.description || '');

    // 1. Direct Example / Prohibited Full or Substring Match (Highest priority)
    if (normBefore && (normalizedInput.includes(normBefore) || normBefore.includes(normalizedInput))) {
      score += 100;
      matchReasons.push(`가이드 지양/개선 예시 직접 일치 ('${chunk.beforeExample}')`);
    } else if (normProhibited && normalizedInput.includes(normProhibited)) {
      score += 80;
      matchReasons.push(`금지/지양 표현 '${chunk.prohibitedPattern}' 직접 검출`);
    }

    // Check multiple bad patterns split by slash
    if (chunk.prohibitedPattern && chunk.prohibitedPattern.includes('/')) {
      const parts = chunk.prohibitedPattern.split('/').map((p) => normalizeKorean(p)).filter((p) => p.length >= 2);
      for (const p of parts) {
        if (normalizedInput.includes(p)) {
          score += 70;
          matchReasons.push(`지양 패턴 '${p}' 검출`);
          break;
        }
      }
    }

    // 2. TV / Remote control specific rules
    if (isTvRemote) {
      if (
        chunk.category === 'TV리모컨규칙' ||
        chunk.ruleId === 'W-210' ||
        normTitle.includes('리모컨') ||
        normTitle.includes('포커스') ||
        normDesc.includes('포커스') ||
        normBefore.includes('포커스')
      ) {
        score += 60;
        matchReasons.push('TV/리모컨 인터랙션 특화 규정');
      }
    }

    // 3. Button Component Rules
    if (isButton) {
      if (
        chunk.componentType === 'button' ||
        chunk.ruleId === 'W-201' ||
        normTitle.includes('버튼') ||
        normBefore.includes('해주세요') ||
        normBefore.includes('하기')
      ) {
        score += 50;
        matchReasons.push('버튼 컴포넌트 필수 규정');
      }
    }

    // 4. Component Type Alignment
    if (options.componentType && chunk.componentType === options.componentType) {
      score += 20;
      matchReasons.push(`[${options.componentType}] 대상 컴포넌트 일치`);
    }

    // 5. Double-passive detector (~되어집니다, ~지급되어집니다 -> W-204)
    if (
      (cleanInput.includes('되어집') || cleanInput.includes('지급되어') || cleanInput.includes('소멸되어')) &&
      (chunk.ruleId === 'W-204' || normTitle.includes('능동') || normTitle.includes('피동'))
    ) {
      score += 40;
      matchReasons.push('이중 피동 표현 검출 (능동태 원칙)');
    }

    // 6. Token Overlap across title, description, keywords, before/after
    const chunkCombined = `${chunk.title} ${chunk.description} ${chunk.beforeExample} ${chunk.afterExample} ${(chunk.keywords || []).join(' ')}`;
    const chunkTokenSet = new Set(tokenizeText(chunkCombined));

    let tokenMatchCount = 0;
    for (const qToken of queryTokens) {
      if (chunkTokenSet.has(qToken)) {
        tokenMatchCount++;
      }
    }

    if (tokenMatchCount > 0) {
      score += Math.min(30, tokenMatchCount * 4);
      if (matchReasons.length === 0) {
        matchReasons.push(`키워드 일치 (${tokenMatchCount}건)`);
      }
    }

    return {
      chunk,
      score,
      matchReasons,
    };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
