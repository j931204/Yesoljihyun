/**
 * Semantic Language Guide Chunker
 * Chunks documents into meaningful rule and section units without blindly cutting across sentences or examples.
 */

import { GuideChunk } from '../storage/languageGuideDB';

export interface ChunkingOptions {
  guideId: string;
  defaultCategory?: string;
  componentType?: string;
}

/**
 * Parses raw text, markdown, or text-extracted documents into structured GuideChunks
 */
export function chunkLanguageGuideText(
  rawText: string,
  options: ChunkingOptions
): GuideChunk[] {
  const chunks: GuideChunk[] = [];
  const lines = rawText.split(/\r?\n/);

  let currentRuleId = '';
  let currentTitle = '';
  let currentDescLines: string[] = [];
  let currentCategory = options.defaultCategory || '일반원칙';
  let currentComponent = options.componentType || 'all';
  let currentProhibited = '';
  let currentRecommended = '';
  let currentBefore = '';
  let currentAfter = '';
  let chunkIndex = 1;

  const flushCurrentChunk = () => {
    if (!currentTitle.trim() && currentDescLines.length === 0) return;

    const fullDesc = currentDescLines.join(' ').trim();
    const ruleId = currentRuleId || `R-${String(chunkIndex).padStart(3, '0')}`;
    const title = currentTitle || `규칙 ${chunkIndex}`;

    // Extract keywords
    const keywords = new Set<string>();
    [ruleId, title, currentCategory, currentComponent, currentProhibited, currentRecommended]
      .filter(Boolean)
      .forEach((s) => {
        s.split(/[\s,·/()[\]]+/).forEach((word) => {
          if (word.length >= 2) keywords.add(word);
        });
      });

    chunks.push({
      id: `chunk-${options.guideId}-${ruleId}-${chunkIndex}`,
      guideId: options.guideId,
      ruleId,
      componentType: currentComponent,
      category: currentCategory,
      title,
      description: fullDesc || title,
      prohibitedPattern: currentProhibited || currentBefore,
      recommendedPattern: currentRecommended || currentAfter,
      beforeExample: currentBefore || currentProhibited,
      afterExample: currentAfter || currentRecommended,
      keywords: Array.from(keywords),
      createdAt: Date.now(),
    });

    chunkIndex++;
    currentRuleId = '';
    currentTitle = '';
    currentDescLines = [];
    currentProhibited = '';
    currentRecommended = '';
    currentBefore = '';
    currentAfter = '';
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) {
      // Empty line could indicate paragraph boundary
      if (currentDescLines.length > 3) {
        flushCurrentChunk();
      }
      continue;
    }

    // Check for Rule ID pattern e.g., [W-201], W-201, # W-201, 1. 규칙명
    const ruleIdMatch = line.match(/^#{1,4}\s*\[?([A-Z]-\d{3})\]?\s*(.*)$/i) ||
                        line.match(/^\[([A-Z]-\d{3})\]\s*(.*)$/i) ||
                        line.match(/^([A-Z]-\d{3})[:.\s]+(.*)$/i);

    if (ruleIdMatch) {
      flushCurrentChunk();
      currentRuleId = ruleIdMatch[1].toUpperCase();
      currentTitle = ruleIdMatch[2].trim() || currentRuleId;

      // Auto detect component from Rule ID
      if (currentRuleId.startsWith('W-2')) {
        currentCategory = '컴포넌트규칙';
        if (currentRuleId === 'W-201') currentComponent = 'button';
        else if (currentRuleId === 'W-202') currentComponent = 'popup';
        else if (currentRuleId === 'W-203') currentComponent = 'toast';
        else if (currentRuleId === 'W-205') currentComponent = 'bottom_sheet';
        else if (currentRuleId === 'W-206') currentComponent = 'label';
        else if (currentRuleId === 'W-207') currentComponent = 'tooltip';
        else if (currentRuleId === 'W-208') currentComponent = 'notice_error';
        else if (currentRuleId === 'W-209') currentComponent = 'precaution';
      } else if (currentRuleId.startsWith('W-3')) {
        currentCategory = '순화어/사전';
      }
      continue;
    }

    // Check for Section Header (Markdown #, ##, ### or 【】)
    const headerMatch = line.match(/^#{1,3}\s+(.+)$/) || line.match(/^【(.+)】$/);
    if (headerMatch) {
      flushCurrentChunk();
      currentTitle = headerMatch[1].trim();
      continue;
    }

    // Check for Prohibited / Bad Example pattern
    const badMatch = line.match(/^(?:지양|금지|Bad|X|X표시|피해야할|오류)\s*[:：\-]\s*(.*)$/i);
    if (badMatch) {
      currentProhibited = badMatch[1].trim();
      currentBefore = badMatch[1].trim();
      continue;
    }

    // Check for Recommended / Good Example pattern
    const goodMatch = line.match(/^(?:권장|추천|Good|O|바른표현|개선안)\s*[:：\-]\s*(.*)$/i);
    if (goodMatch) {
      currentRecommended = goodMatch[1].trim();
      currentAfter = goodMatch[1].trim();
      continue;
    }

    // Arrow notation e.g., 금일 -> 오늘
    const arrowMatch = line.match(/^([가-힣\w\s]+)\s*(?:->|→|=>)\s*([가-힣\w\s]+)(?:\s*\((.*)\))?$/);
    if (arrowMatch) {
      flushCurrentChunk();
      currentTitle = `${arrowMatch[1].trim()} 순화`;
      currentProhibited = arrowMatch[1].trim();
      currentRecommended = arrowMatch[2].trim();
      if (arrowMatch[3]) currentDescLines.push(arrowMatch[3].trim());
      flushCurrentChunk();
      continue;
    }

    // Regular descriptive content
    currentDescLines.push(line);
  }

  flushCurrentChunk();

  // If text was unstructured and produced 0 chunks, chunk by paragraph
  if (chunks.length === 0 && rawText.trim()) {
    const paragraphs = rawText.split(/\n\s*\n/).filter((p) => p.trim());
    paragraphs.forEach((p, idx) => {
      const pLines = p.trim().split('\n');
      const title = pLines[0].slice(0, 40);
      chunks.push({
        id: `chunk-${options.guideId}-p-${idx + 1}`,
        guideId: options.guideId,
        ruleId: `P-${idx + 1}`,
        componentType: options.componentType || 'all',
        category: options.defaultCategory || '일반원칙',
        title,
        description: p.trim(),
        beforeExample: '',
        afterExample: '',
        keywords: title.split(/\s+/).filter((w) => w.length >= 2),
        createdAt: Date.now(),
      });
    });
  }

  return chunks;
}
