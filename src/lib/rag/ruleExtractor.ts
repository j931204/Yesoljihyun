/**
 * Structured Guide Rule Extractor
 * Extracts explicit structured rules (avoid, preferred, type, examples, sourceText)
 * alongside raw GuideChunks to establish a deterministic rule foundation.
 */

import { StructuredGuideRule, RuleType, UploadedGuideVersion } from '../../types';
import { GuideChunk } from '../storage/languageGuideDB';
import { parseChangeSentence } from './chunker';

function cleanText(str: string): string {
  if (!str) return '';
  return str
    .replace(/^['"“‘\[\(]+/, '')
    .replace(/['"”’\]\)]+$/, '')
    .replace(/^[-*•\d.)\s]+/, '')
    .replace(/[-*•\s]+$/, '')
    .trim();
}

function classifyRuleType(avoid: string, preferred: string, desc: string): RuleType {
  const combined = `${avoid} ${preferred} ${desc}`.toLowerCase();
  if (combined.includes('해요체') || combined.includes('하십시오') || combined.includes('어미') || combined.includes('톤') || combined.includes('말투')) {
    return 'tone';
  }
  if (combined.includes('피동') || combined.includes('사동') || combined.includes('이중 피동') || combined.includes('문법') || combined.includes('조사')) {
    return 'grammar';
  }
  if (avoid.length > 25 || preferred.length > 25 || avoid.includes('.') || preferred.includes('.')) {
    return 'example';
  }
  if (avoid.includes(' ') || preferred.includes(' ')) {
    return 'phrase';
  }
  return 'word';
}

function detectCategory(text: string): string {
  if (text.includes('버튼') || text.includes('button')) return '버튼 규칙';
  if (text.includes('리모컨') || text.includes('tv') || text.includes('포커스')) return 'TV 리모컨 규칙';
  if (text.includes('팝업') || text.includes('모달')) return '팝업 규칙';
  if (text.includes('토스트')) return '토스트 규칙';
  if (text.includes('한자') || text.includes('순화')) return '한자어 순화';
  if (text.includes('외래') || text.includes('외국어')) return '외래어 순화';
  if (text.includes('피동') || text.includes('능동')) return '능동태 원칙';
  if (text.includes('고객') || text.includes('사용자')) return '고객 중심 표현';
  return '일반 표현 규칙';
}

/**
 * Extracts StructuredGuideRule array from raw guide document text
 */
export function extractStructuredRulesFromText(
  rawText: string,
  guideId: string
): StructuredGuideRule[] {
  if (!rawText || !rawText.trim()) return [];

  const rules: StructuredGuideRule[] = [];
  const lines = rawText.split(/\r?\n/);
  let ruleIdx = 1;

  let currentCategory = '사내 언어가이드';
  let currentComponent = 'all';

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.trim();
    if (!line) continue;

    // Check header
    if (line.startsWith('#') || line.startsWith('【')) {
      currentCategory = detectCategory(line);
      if (line.includes('버튼')) currentComponent = 'button';
      else if (line.includes('팝업')) currentComponent = 'popup';
      else if (line.includes('토스트')) currentComponent = 'toast';
      else currentComponent = 'all';
      continue;
    }

    // 1. Table row parser: | 기존/지양/Before | 권장/개선/After | 이유 |
    if (line.startsWith('|') && line.endsWith('|')) {
      const cells = line
        .split('|')
        .map((c) => c.trim())
        .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);

      if (cells.length >= 2 && !cells[0].includes('---') && !cells[0].includes('기존') && !cells[0].includes('지양') && !cells[0].includes('Before')) {
        const col1 = cleanText(cells[0]);
        const col2 = cleanText(cells[1]);
        const col3 = cells[2] ? cleanText(cells[2]) : '';

        if (col1 && col2 && col1 !== col2) {
          const cat = detectCategory(`${col1} ${col2} ${col3}`);
          const type = classifyRuleType(col1, col2, col3);
          rules.push({
            id: `rule-${guideId}-${ruleIdx++}`,
            category: cat,
            type,
            avoid: Array.from(new Set([col1, col1.replace(/[.!?~,\s]+$/, '')])).filter(Boolean),
            preferred: [col2],
            description: col3 || `${col1} 대신 ${col2} 권장`,
            examples: [{ before: col1, after: col2 }],
            sourceText: rawLine,
            componentType: currentComponent,
          });
          continue;
        }
      }
    }

    // 2. Comprehensive rule parser for sentences: "A는 B로 변경", "A -> B", "A 대신 B", etc.
    const parsedPair = parseChangeSentence(line);
    if (parsedPair) {
      const fromPart = cleanText(parsedPair.from);
      const toPart = cleanText(parsedPair.to);
      if (fromPart && toPart && fromPart !== toPart) {
        const cat = detectCategory(`${fromPart} ${toPart} ${line}`);
        const type = classifyRuleType(fromPart, toPart, line);
        rules.push({
          id: `rule-${guideId}-${ruleIdx++}`,
          category: cat,
          type,
          avoid: Array.from(new Set([fromPart, fromPart.replace(/[.!?~,\s]+$/, '')])).filter(Boolean),
          preferred: [toPart],
          description: parsedPair.note || line,
          examples: [{ before: fromPart, after: toPart }],
          sourceText: rawLine,
          componentType: currentComponent,
        });
        continue;
      }
    }
  }

  return rules;
}

/**
 * Builds structured rules from an existing UploadedGuideVersion and its GuideChunks
 */
export function buildStructuredRulesFromGuide(
  guide: UploadedGuideVersion,
  chunks: GuideChunk[]
): StructuredGuideRule[] {
  const result: StructuredGuideRule[] = [];
  const seenPairs = new Set<string>();

  // 1. From rawContent if present
  if (guide.rawContent) {
    const extracted = extractStructuredRulesFromText(guide.rawContent, guide.id);
    extracted.forEach((r) => {
      const key = `${r.avoid.join(',')}=>${r.preferred.join(',')}`;
      if (!seenPairs.has(key)) {
        seenPairs.add(key);
        result.push(r);
      }
    });
  }

  // 2. From extractedRules.componentRules
  if (guide.extractedRules?.componentRules) {
    guide.extractedRules.componentRules.forEach((cr, idx) => {
      const badItems = cr.badExample.split(/[\/\n|]+/).map(cleanText).filter(Boolean);
      const goodItems = cr.goodExample.split(/[\/\n|]+/).map(cleanText).filter(Boolean);

      if (badItems.length === goodItems.length && badItems.length > 1) {
        badItems.forEach((b, i) => {
          const g = goodItems[i];
          const key = `${b}=>${g}`;
          if (b && g && b !== g && !seenPairs.has(key)) {
            seenPairs.add(key);
            result.push({
              id: `${cr.ruleId}-${i + 1}`,
              category: cr.title,
              type: classifyRuleType(b, g, cr.description),
              avoid: Array.from(new Set([b, b.replace(/[.!?~,\s]+$/, '')])).filter(Boolean),
              preferred: [g],
              description: cr.description,
              examples: [{ before: b, after: g }],
              sourceText: `[${cr.ruleId}] ${cr.title}: ${b} -> ${g}`,
              componentType: cr.componentType,
            });
          }
        });
      } else if (badItems.length > 0 && goodItems.length > 0) {
        badItems.forEach((b) => {
          const g = goodItems[0];
          const key = `${b}=>${g}`;
          if (b && g && b !== g && !seenPairs.has(key)) {
            seenPairs.add(key);
            result.push({
              id: `${cr.ruleId}-${idx}`,
              category: cr.title,
              type: classifyRuleType(b, g, cr.description),
              avoid: Array.from(new Set([b, b.replace(/[.!?~,\s]+$/, '')])).filter(Boolean),
              preferred: [g],
              description: cr.description,
              examples: [{ before: b, after: g }],
              sourceText: `[${cr.ruleId}] ${cr.title}: ${b} -> ${g}`,
              componentType: cr.componentType,
            });
          }
        });
      }
    });
  }

  // 3. From extractedRules.terminology
  if (guide.extractedRules?.terminology) {
    guide.extractedRules.terminology.forEach((term, idx) => {
      const avoid = cleanText(term.prohibited);
      const preferred = cleanText(term.recommended);
      const key = `${avoid}=>${preferred}`;
      if (avoid && preferred && avoid !== preferred && !seenPairs.has(key)) {
        seenPairs.add(key);
        result.push({
          id: `term-${term.id || idx}`,
          category: term.category || '용어 순화 사전',
          type: classifyRuleType(avoid, preferred, term.reason),
          avoid: Array.from(new Set([avoid, avoid.replace(/[.!?~,\s]+$/, '')])).filter(Boolean),
          preferred: [preferred],
          description: term.reason,
          examples: [{ before: avoid, after: preferred }],
          sourceText: `용어 순화: ${avoid} -> ${preferred} (${term.reason})`,
          componentType: 'all',
        });
      }
    });
  }

  // 4. From chunks that have explicit before/after pairs
  chunks.forEach((chunk, idx) => {
    const before = cleanText(chunk.beforeExample || chunk.prohibitedPattern || '');
    const after = cleanText(chunk.afterExample || chunk.recommendedPattern || '');
    if (before && after && before !== after) {
      const key = `${before}=>${after}`;
      if (!seenPairs.has(key)) {
        seenPairs.add(key);
        result.push({
          id: chunk.ruleId || `chunk-rule-${idx}`,
          category: chunk.category || chunk.title,
          type: classifyRuleType(before, after, chunk.description),
          avoid: Array.from(new Set([before, before.replace(/[.!?~,\s]+$/, '')])).filter(Boolean),
          preferred: [after],
          description: chunk.description,
          examples: [{ before, after }],
          sourceText: `[${chunk.ruleId}] ${chunk.title}: ${before} -> ${after}`,
          componentType: chunk.componentType,
        });
      }
    }
  });

  return result;
}
