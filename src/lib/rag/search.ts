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

/**
 * Tokenize Korean and English text into normalized words and n-grams
 */
function tokenizeText(text: string): string[] {
  if (!text) return [];
  const clean = text
    .toLowerCase()
    .replace(/[^\w\s가-힣]/g, ' ')
    .trim();

  const words = clean.split(/\s+/).filter((w) => w.length >= 1);
  const tokens = new Set<string>();

  words.forEach((w) => {
    tokens.add(w);
    // Add 2-gram substrings for Korean morpheme matching
    if (w.length >= 3) {
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
  const limit = options.limit || 7;
  if (!chunks || chunks.length === 0) return [];
  if (!inputSentence || !inputSentence.trim()) {
    // If no text, return default top component rules
    return chunks.slice(0, limit).map((c) => ({
      chunk: c,
      score: 1.0,
      matchReasons: ['기본 필수 원칙'],
    }));
  }

  const queryTokens = tokenizeText(inputSentence);
  const cleanInput = inputSentence.trim();
  const isButton =
    options.componentType === 'button' ||
    cleanInput.endsWith('하기') ||
    cleanInput.endsWith('버튼');

  const scored: ScoredChunk[] = chunks.map((chunk) => {
    let score = 0;
    const matchReasons: string[] = [];

    // 1. Direct Prohibited Term Substring Match (Highest priority)
    if (chunk.prohibitedPattern && chunk.prohibitedPattern.trim()) {
      const patterns = chunk.prohibitedPattern
        .split(/[/,\s]+/)
        .map((p) => p.replace(/~/, '').trim())
        .filter((p) => p.length >= 2);

      for (const pattern of patterns) {
        if (cleanInput.includes(pattern)) {
          score += 25;
          matchReasons.push(`금지/지양 표현 '${pattern}' 검출`);
          break;
        }
      }
    }

    // 2. Button-specific rules
    if (isButton && (chunk.componentType === 'button' || chunk.ruleId === 'W-201')) {
      score += 15;
      matchReasons.push('버튼 컴포넌트 특화 규정');
    }

    // 3. Component Type Alignment
    if (options.componentType && chunk.componentType === options.componentType) {
      score += 8;
      matchReasons.push(`[${options.componentType}] 대상 영역 일치`);
    }

    // 4. Double-passive detector (~되어집니다, ~지급되어집니다 -> W-204)
    if (
      (cleanInput.includes('되어집') || cleanInput.includes('지급되어') || cleanInput.includes('소멸되어')) &&
      (chunk.ruleId === 'W-204' || chunk.title.includes('능동') || chunk.title.includes('피동'))
    ) {
      score += 20;
      matchReasons.push('이중 피동 표현 검출 (W-204 능동태)');
    }

    // 5. Hanja / Administrative words detector
    const commonHanja = ['금일', '익일', '기재', '수취', '회귀', '상이', '명기', '송부', '차감'];
    for (const h of commonHanja) {
      if (cleanInput.includes(h) && (chunk.title.includes(h) || chunk.description.includes(h))) {
        score += 18;
        matchReasons.push(`어려운 한자어 '${h}' 순화 규정`);
      }
    }

    // 6. Token Overlap across title, description, and keywords
    const chunkContent = `${chunk.title} ${chunk.description} ${chunk.beforeExample} ${chunk.afterExample} ${chunk.keywords.join(' ')}`;
    const chunkTokens = tokenizeText(chunkContent);
    const chunkTokenSet = new Set(chunkTokens);

    let tokenMatchCount = 0;
    for (const qToken of queryTokens) {
      if (chunkTokenSet.has(qToken)) {
        tokenMatchCount++;
      }
    }

    if (tokenMatchCount > 0) {
      score += Math.min(15, tokenMatchCount * 3);
      if (matchReasons.length === 0) {
        matchReasons.push(`문맥 키워드 일치 (${tokenMatchCount}건)`);
      }
    }

    // 7. General baseline bonus for core principles
    if (chunk.ruleId.startsWith('W-1') || chunk.category === '총칙') {
      score += 2;
    }

    return {
      chunk,
      score,
      matchReasons,
    };
  });

  // Sort descending by score
  scored.sort((a, b) => b.score - a.score);

  // Take top N (between 5 and 10)
  const topResults = scored.slice(0, Math.max(5, Math.min(10, limit)));
  return topResults;
}
