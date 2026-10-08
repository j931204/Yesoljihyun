/**
 * Semantic Language Guide Chunker & Parser
 * Comprehensively extracts rules, Before/After examples, terminology pairs,
 * and component guidelines from user-uploaded documents (TXT, MD, PDF text, direct input).
 */

import { GuideChunk } from '../storage/languageGuideDB';

export interface ChunkingOptions {
  guideId: string;
  defaultCategory?: string;
  componentType?: string;
}

export function cleanRuleText(str: string): string {
  if (!str) return '';
  return str
    .replace(/^['"“‘\[\(]+/, '')
    .replace(/['"”’\]\)]+$/, '')
    .replace(/^[-*•\d.)\s]+/, '')
    .replace(/[-*•\s]+$/, '')
    .trim();
}

export function detectComponentType(text: string): string {
  const lower = text.toLowerCase();
  if (lower.includes('버튼') || lower.includes('button') || lower.includes('cta')) return 'button';
  if (lower.includes('팝업') || lower.includes('모달') || lower.includes('popup') || lower.includes('modal') || lower.includes('다이얼로그')) return 'popup';
  if (lower.includes('토스트') || lower.includes('toast') || lower.includes('스낵바')) return 'toast';
  if (lower.includes('바텀시트') || lower.includes('bottomsheet') || lower.includes('bottom_sheet') || lower.includes('시트')) return 'bottom_sheet';
  if (lower.includes('레이블') || lower.includes('태그') || lower.includes('배지') || lower.includes('badge') || lower.includes('label')) return 'label';
  if (lower.includes('툴팁') || lower.includes('tooltip') || lower.includes('도움말')) return 'tooltip';
  if (lower.includes('오류') || lower.includes('에러') || lower.includes('error') || lower.includes('notice')) return 'notice_error';
  if (lower.includes('유의사항') || lower.includes('주의사항') || lower.includes('고지') || lower.includes('precaution')) return 'precaution';
  if (lower.includes('인풋') || lower.includes('텍스트필드') || lower.includes('입력창') || lower.includes('textfield')) return 'textfield';
  return 'all';
}

export function detectCategory(text: string): string {
  if (text.includes('리모컨') || text.includes('tv') || text.includes('포커스')) return 'TV리모컨규칙';
  if (text.includes('버튼') || text.includes('팝업') || text.includes('토스트') || text.includes('컴포넌트')) return '컴포넌트규칙';
  if (text.includes('순화') || text.includes('한자어') || text.includes('외래어') || text.includes('용어')) return '순화어/사전';
  if (text.includes('어조') || text.includes('톤') || text.includes('해요체') || text.includes('어미')) return '어조/어미';
  if (text.includes('능동') || text.includes('피동') || text.includes('고객 중심')) return '고객중심표현';
  return '일반원칙';
}

/**
 * Robust parser for Korean UX writing rule lines (e.g. A는 B로 변경, A -> B, A 대신 B, etc.)
 */
export function parseChangeSentence(line: string): { from: string; to: string; note?: string } | null {
  const cleanLine = line.replace(/^[-*•\d.)\s]+/, '').trim();
  if (!cleanLine || cleanLine.length < 3) return null;

  // Pattern 1: Quoted or Bracketed: 'A'는 'B'로 변경 / [A]는 [B]로 변경 / "A" -> "B"
  const quotedMatch = cleanLine.match(
    /^['"“‘\[\(](.+?)['"”’\]\)]\s*(?:은|는|을|를)\s*['"“‘\[\(](.+?)['"”’\]\)]\s*(?:로|으로)\s*(?:변경|수정|바꿈|전환|통일|개선|권장|교정|제시|사용|작성)/i
  );
  if (quotedMatch) {
    const from = cleanRuleText(quotedMatch[1]);
    const to = cleanRuleText(quotedMatch[2]);
    if (from && to && from !== to) return { from, to };
  }

  // Pattern 2: Action suffix at the end e.g. "...로 변경(합니다)?"
  // Handles: "리모컨 방향키로 포커스를 이동하여 선택하십시오.는 리모컨 방향키로 옮겨서 선택해 주세요.로 변경"
  const actionSuffixMatch = cleanLine.match(
    /^(.*?)(?:로|으로)\s*(?:변경|수정|바꿈|전환|통일|개선|권장|교정|제시|사용|작성)(?:합니다|한다|함|됨|\.|!|$)/i
  );
  if (actionSuffixMatch) {
    const content = actionSuffixMatch[1].trim();

    // 2a. Period or quote followed by 는/은: e.g. `하십시오.는 ` or `요.는 ` or `'는 `
    const punctSepMatch = content.match(/^(.*?)(?:[.]|['"”’])(?:는|은)\s*(.*)$/);
    if (punctSepMatch) {
      const from = cleanRuleText(punctSepMatch[1]);
      const to = cleanRuleText(punctSepMatch[2]);
      if (from && to && from !== to) return { from, to };
    }

    // 2b. Space before and after 는/은: e.g. "선택하십시오 는 선택해 주세요"
    const spaceSepMatch = content.match(/^(.*?)\s+(?:는|은)\s+(.*)$/);
    if (spaceSepMatch) {
      const from = cleanRuleText(spaceSepMatch[1]);
      const to = cleanRuleText(spaceSepMatch[2]);
      if (from && to && from !== to) return { from, to };
    }

    // 2c. Direct boundary (e.g. `예약해주세요는 예약하기`)
    const lastSepIdx = Math.max(content.lastIndexOf('는 '), content.lastIndexOf('은 '));
    if (lastSepIdx > 0) {
      const from = cleanRuleText(content.slice(0, lastSepIdx));
      const to = cleanRuleText(content.slice(lastSepIdx + 2));
      if (from && to && from !== to) return { from, to };
    }
  }

  // Pattern 3: Arrow notation: "A -> B", "A → B", "A => B", "A ➔ B"
  const arrowMatch = cleanLine.match(
    /^['"“‘]?([가-힣\w\s.,!?~-]+?)['"”’]?\s*(?:->|→|=>|➔)\s*['"“‘]?([가-힣\w\s.,!?~-]+?)['"”’]?(?:\s*\((.*?)\))?$/
  );
  if (arrowMatch) {
    const from = cleanRuleText(arrowMatch[1]);
    const to = cleanRuleText(arrowMatch[2]);
    const note = arrowMatch[3] ? cleanRuleText(arrowMatch[3]) : undefined;
    if (from && to && from !== to) return { from, to, note };
  }

  // Pattern 4: "A 대신 B (사용/권장/통일)"
  const insteadMatch = cleanLine.match(
    /^['"“‘]?([가-힣\w\s.,!?~-]+?)['"”’]?\s*대신\s*['"“‘]?([가-힣\w\s.,!?~-]+?)['"”’]?\s*(?:사용|권장|통일|적용|제시|작성)/i
  );
  if (insteadMatch) {
    const from = cleanRuleText(insteadMatch[1]);
    const to = cleanRuleText(insteadMatch[2]);
    if (from && to && from !== to) return { from, to };
  }

  return null;
}

/**
 * Parses raw text, markdown, or text-extracted documents into structured GuideChunks
 */
export function chunkLanguageGuideText(
  rawText: string,
  options: ChunkingOptions
): GuideChunk[] {
  if (!rawText || !rawText.trim()) return [];

  const chunks: GuideChunk[] = [];
  const lines = rawText.split(/\r?\n/);
  let chunkIndex = 1;

  let currentRuleId = '';
  let currentTitle = '';
  let currentDescLines: string[] = [];
  let currentCategory = options.defaultCategory || '일반원칙';
  let currentComponent = options.componentType || 'all';
  let currentProhibited = '';
  let currentRecommended = '';
  let currentBefore = '';
  let currentAfter = '';

  const pushChunk = (data: {
    ruleId?: string;
    title: string;
    description: string;
    category?: string;
    componentType?: string;
    prohibited?: string;
    recommended?: string;
    before?: string;
    after?: string;
  }) => {
    const ruleId = data.ruleId || `R-${String(chunkIndex).padStart(3, '0')}`;
    const category = data.category || currentCategory || options.defaultCategory || '일반원칙';
    const componentType = data.componentType || currentComponent || options.componentType || 'all';
    const prohibited = cleanRuleText(data.prohibited || data.before || '');
    const recommended = cleanRuleText(data.recommended || data.after || '');
    const before = cleanRuleText(data.before || data.prohibited || '');
    const after = cleanRuleText(data.after || data.recommended || '');

    const keywords = new Set<string>();
    [ruleId, data.title, category, componentType, prohibited, recommended, before, after]
      .filter(Boolean)
      .forEach((s) => {
        s.split(/[\s,·/()[\]'"`]+/).forEach((word) => {
          if (word.length >= 2) keywords.add(word);
        });
      });

    chunks.push({
      id: `chunk-${options.guideId}-${ruleId}-${chunkIndex}`,
      guideId: options.guideId,
      ruleId,
      componentType,
      category,
      title: data.title,
      description: data.description || data.title,
      prohibitedPattern: prohibited,
      recommendedPattern: recommended,
      beforeExample: before,
      afterExample: after,
      keywords: Array.from(keywords),
      createdAt: Date.now(),
    });

    chunkIndex++;
  };

  const flushCurrentChunk = () => {
    if (!currentTitle.trim() && currentDescLines.length === 0 && !currentProhibited && !currentRecommended) {
      return;
    }

    const fullDesc = currentDescLines.join(' ').trim();
    pushChunk({
      ruleId: currentRuleId,
      title: currentTitle || (currentProhibited && currentRecommended ? `${currentProhibited} -> ${currentRecommended}` : `규칙 ${chunkIndex}`),
      description: fullDesc || currentTitle || '사내 언어가이드 세부 규정',
      category: currentCategory,
      componentType: currentComponent,
      prohibited: currentProhibited,
      recommended: currentRecommended,
      before: currentBefore,
      after: currentAfter,
    });

    currentRuleId = '';
    currentTitle = '';
    currentDescLines = [];
    currentProhibited = '';
    currentRecommended = '';
    currentBefore = '';
    currentAfter = '';
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.trim();
    if (!line) {
      if (currentDescLines.length > 2 || currentBefore || currentProhibited) {
        flushCurrentChunk();
      }
      continue;
    }

    // 1. Table row parser: | 기존/지양/Before | 권장/개선/After | (이유/설명)? |
    if (line.startsWith('|') && line.endsWith('|')) {
      const cells = line
        .split('|')
        .map((c) => c.trim())
        .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);

      if (cells.length >= 2 && !cells[0].includes('---') && !cells[0].includes('기존') && !cells[0].includes('지양') && !cells[0].includes('Before')) {
        const col1 = cleanRuleText(cells[0]);
        const col2 = cleanRuleText(cells[1]);
        const col3 = cells[2] ? cleanRuleText(cells[2]) : '';

        if (col1 && col2 && col1 !== col2) {
          const comp = detectComponentType(`${col1} ${col2} ${col3}`);
          const cat = detectCategory(`${col1} ${col2} ${col3}`);
          pushChunk({
            title: `[표 규정] ${col1} -> ${col2}`,
            description: col3 || `${col1} 대신 ${col2} 표기를 권장합니다.`,
            prohibited: col1,
            recommended: col2,
            before: col1,
            after: col2,
            category: cat,
            componentType: comp,
          });
          continue;
        }
      }
    }

    // 2. Comprehensive rule parser for "A는 B로 변경", "A -> B", "A 대신 B", etc.
    const parsedPair = parseChangeSentence(line);
    if (parsedPair) {
      flushCurrentChunk();
      const comp = detectComponentType(`${parsedPair.from} ${parsedPair.to} ${line}`);
      const cat = detectCategory(`${parsedPair.from} ${parsedPair.to} ${line}`);
      pushChunk({
        title: `${parsedPair.from} -> ${parsedPair.to}`,
        description: parsedPair.note || line,
        prohibited: parsedPair.from,
        recommended: parsedPair.to,
        before: parsedPair.from,
        after: parsedPair.to,
        category: cat,
        componentType: comp,
      });
      continue;
    }

    // 3. Check for Rule ID pattern e.g., [W-201], W-201, # W-201, 1. 규칙명
    const ruleIdMatch =
      line.match(/^#{1,4}\s*\[?([A-Z]-\d{3})\]?\s*(.*)$/i) ||
      line.match(/^\[([A-Z]-\d{3})\]\s*(.*)$/i) ||
      line.match(/^([A-Z]-\d{3})[:.\s]+(.*)$/i);

    if (ruleIdMatch) {
      flushCurrentChunk();
      currentRuleId = ruleIdMatch[1].toUpperCase();
      currentTitle = ruleIdMatch[2].trim() || currentRuleId;
      currentCategory = detectCategory(`${currentRuleId} ${currentTitle}`);
      currentComponent = detectComponentType(`${currentRuleId} ${currentTitle}`);
      continue;
    }

    // 4. Section Header (Markdown #, ##, ### or 【】)
    const headerMatch = line.match(/^#{1,3}\s+(.+)$/) || line.match(/^【(.+)】$/);
    if (headerMatch) {
      flushCurrentChunk();
      currentTitle = headerMatch[1].trim();
      currentCategory = detectCategory(currentTitle);
      currentComponent = detectComponentType(currentTitle);
      continue;
    }

    // 5. Prohibited / Bad / AS-IS pattern
    const badMatch = line.match(
      /^(?:지양|금지|Bad|X|X표시|피해야\s*할|오류|기존|AS-IS|As-Is|수정\s*전|Before)\s*[:：\-]\s*(.*)$/i
    );
    if (badMatch) {
      currentProhibited = cleanRuleText(badMatch[1]);
      currentBefore = currentProhibited;
      continue;
    }

    // 6. Recommended / Good / TO-BE pattern
    const goodMatch = line.match(
      /^(?:권장|추천|Good|O|바른\s*표현|개선안|개선|TO-BE|To-Be|수정\s*후|After|변경|적용)\s*[:：\-]\s*(.*)$/i
    );
    if (goodMatch) {
      currentRecommended = cleanRuleText(goodMatch[1]);
      currentAfter = currentRecommended;
      if (currentBefore && currentAfter) {
        flushCurrentChunk();
      }
      continue;
    }

    // 7. Regular descriptive line
    currentDescLines.push(line);
  }

  flushCurrentChunk();

  // If text was unstructured and produced 0 chunks, chunk by paragraph
  if (chunks.length === 0 && rawText.trim()) {
    const paragraphs = rawText.split(/\n\s*\n/).filter((p) => p.trim());
    paragraphs.forEach((p, idx) => {
      const pLines = p.trim().split('\n');
      const title = pLines[0].slice(0, 50);
      const comp = detectComponentType(p);
      const cat = detectCategory(p);

      // Try finding any embedded change pattern in the paragraph
      const pair = parseChangeSentence(p);
      let prob = '';
      let reco = '';
      if (pair) {
        prob = pair.from;
        reco = pair.to;
      }

      chunks.push({
        id: `chunk-${options.guideId}-p-${idx + 1}`,
        guideId: options.guideId,
        ruleId: `P-${idx + 1}`,
        componentType: comp,
        category: cat,
        title,
        description: p.trim(),
        prohibitedPattern: prob,
        recommendedPattern: reco,
        beforeExample: prob,
        afterExample: reco,
        keywords: title.split(/\s+/).filter((w) => w.length >= 2),
        createdAt: Date.now(),
      });
    });
  }

  return chunks;
}
