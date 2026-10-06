/**
 * IndexedDB storage for User Correction History & Few-Shot Learning
 * Saves accepted and customized revisions to serve as few-shot examples for local LLM.
 */

export interface PastCorrectionCase {
  id: string;
  original: string;
  aiRevision: string;
  finalRevision: string;
  appliedRules: string[];
  componentType?: string;
  service?: string;
  platform?: string;
  actionType: 'accepted' | 'custom_edited';
  userNotes?: string;
  timestamp: number;
}

const DB_NAME = 'ux_correction_history_db';
const DB_VERSION = 1;

let dbInstance: IDBDatabase | null = null;

export async function openHistoryDB(): Promise<IDBDatabase> {
  if (dbInstance) return dbInstance;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('cases')) {
        const store = db.createObjectStore('cases', { keyPath: 'id' });
        store.createIndex('timestamp', 'timestamp', { unique: false });
        store.createIndex('actionType', 'actionType', { unique: false });
      }
    };

    request.onsuccess = (event) => {
      dbInstance = (event.target as IDBOpenDBRequest).result;
      resolve(dbInstance);
    };

    request.onerror = (event) => {
      reject((event.target as IDBOpenDBRequest).error);
    };
  });
}

/**
 * Save a newly adopted or custom-edited correction case
 */
export async function saveCorrectionCase(
  item: Omit<PastCorrectionCase, 'id' | 'timestamp'> & { id?: string; timestamp?: number }
): Promise<PastCorrectionCase> {
  const db = await openHistoryDB();
  const tx = db.transaction('cases', 'readwrite');
  const store = tx.objectStore('cases');

  const record: PastCorrectionCase = {
    ...item,
    id: item.id || `case-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp: item.timestamp || Date.now(),
  };

  store.put(record);

  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve(record);
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Get all historical correction cases, sorted newest first
 */
export async function getAllCorrectionCases(): Promise<PastCorrectionCase[]> {
  const db = await openHistoryDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('cases', 'readonly');
    const store = tx.objectStore('cases');
    const index = store.index('timestamp');
    const req = index.getAll();

    req.onsuccess = () => {
      const list = req.result || [];
      resolve(list.reverse());
    };
    req.onerror = () => reject(req.error);
  });
}

/**
 * Search past correction cases that match input sentence keywords to inject as Few-Shot examples
 */
export async function findSimilarPastCases(
  inputSentence: string,
  limit: number = 3
): Promise<PastCorrectionCase[]> {
  const allCases = await getAllCorrectionCases();
  if (allCases.length === 0) return [];

  const tokens = inputSentence
    .replace(/[^\w\s가-힣]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length >= 2);

  const scored = allCases.map((c) => {
    let score = 0;
    const combined = `${c.original} ${c.finalRevision} ${c.appliedRules.join(' ')}`;

    for (const token of tokens) {
      if (c.original.includes(token)) score += 3;
      if (c.finalRevision.includes(token)) score += 2;
      if (combined.includes(token)) score += 1;
    }

    return { item: c, score };
  });

  // Sort by relevance score, fallback to recency
  scored.sort((a, b) => b.score - a.score || b.item.timestamp - a.item.timestamp);

  // Return top matches, even with 0 keyword match if we have strong recent examples
  const top = scored.slice(0, limit).map((s) => s.item);
  return top;
}

/**
 * Calculate frequently applied rules from saved history
 */
export async function getFrequentlyAppliedRules(): Promise<Array<{ rule: string; count: number }>> {
  const cases = await getAllCorrectionCases();
  const map: Record<string, number> = {};

  for (const c of cases) {
    for (const r of c.appliedRules) {
      map[r] = (map[r] || 0) + 1;
    }
  }

  return Object.entries(map)
    .map(([rule, count]) => ({ rule, count }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Delete a specific correction case
 */
export async function deleteCorrectionCase(id: string): Promise<void> {
  const db = await openHistoryDB();
  const tx = db.transaction('cases', 'readwrite');
  const store = tx.objectStore('cases');
  store.delete(id);

  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
