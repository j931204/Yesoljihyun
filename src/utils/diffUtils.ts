/**
 * Visual Diff Utility for UX Writing Revisions
 * Highlights changes between original copy and AI revised copy.
 */

export interface DiffPart {
  type: 'same' | 'removed' | 'added';
  text: string;
}

/**
 * Computes word-level diff between original and revised text
 */
export function computeWordDiff(original: string, revised: string): {
  parts: DiffPart[];
  hasDiff: boolean;
} {
  if (original === revised) {
    return {
      parts: [{ type: 'same', text: original }],
      hasDiff: false,
    };
  }

  const origWords = original.split(/(\s+)/);
  const revWords = revised.split(/(\s+)/);

  // Simple LCS diff for words
  const dp: number[][] = Array(origWords.length + 1)
    .fill(0)
    .map(() => Array(revWords.length + 1).fill(0));

  for (let i = 0; i < origWords.length; i++) {
    for (let j = 0; j < revWords.length; j++) {
      if (origWords[i] === revWords[j]) {
        dp[i + 1][j + 1] = dp[i][j] + 1;
      } else {
        dp[i + 1][j + 1] = Math.max(dp[i + 1][j], dp[i][j + 1]);
      }
    }
  }

  const parts: DiffPart[] = [];
  let i = origWords.length;
  let j = revWords.length;

  const backtrack: DiffPart[] = [];
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && origWords[i - 1] === revWords[j - 1]) {
      backtrack.push({ type: 'same', text: origWords[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      backtrack.push({ type: 'added', text: revWords[j - 1] });
      j--;
    } else if (i > 0 && (j === 0 || dp[i][j - 1] < dp[i - 1][j])) {
      backtrack.push({ type: 'removed', text: origWords[i - 1] });
      i--;
    }
  }

  backtrack.reverse();

  // Consolidate adjacent parts of same type
  backtrack.forEach((p) => {
    const last = parts[parts.length - 1];
    if (last && last.type === p.type) {
      last.text += p.text;
    } else {
      parts.push({ ...p });
    }
  });

  return {
    parts,
    hasDiff: parts.some((p) => p.type !== 'same'),
  };
}
