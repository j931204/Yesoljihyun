/**
 * Client-side Semantic Embedding & Similarity Engine
 * Calculates character n-gram vector representations and cosine similarity in pure JavaScript.
 */

/**
 * Creates a term frequency vector from character 2-grams and 3-grams
 */
export function createFastEmbeddingVector(text: string): Record<string, number> {
  const clean = text.toLowerCase().replace(/[^\w\s가-힣]/g, '');
  const vector: Record<string, number> = {};

  // Unigrams & Bigrams
  for (let i = 0; i < clean.length; i++) {
    const char = clean[i];
    if (char !== ' ') {
      vector[char] = (vector[char] || 0) + 1;
    }

    if (i < clean.length - 1) {
      const bi = clean.slice(i, i + 2);
      if (!bi.includes(' ')) {
        vector[bi] = (vector[bi] || 0) + 2;
      }
    }
  }

  return vector;
}

/**
 * Calculates cosine similarity between two sparse vector representations (0.0 to 1.0)
 */
export function calculateCosineSimilarity(
  vecA: Record<string, number>,
  vecB: Record<string, number>
): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (const key in vecA) {
    const valA = vecA[key];
    normA += valA * valA;
    if (key in vecB) {
      dotProduct += valA * vecB[key];
    }
  }

  for (const key in vecB) {
    const valB = vecB[key];
    normB += valB * valB;
  }

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}
