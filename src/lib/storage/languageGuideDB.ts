/**
 * IndexedDB storage for Language Guides and Chunks
 * Runs 100% on client browser with zero server DB dependency.
 */

import { UploadedGuideVersion } from '../../types';
import { INITIAL_PDF_GUIDE_V03 } from '../../data/defaultGuides';

export interface GuideChunk {
  id: string;
  guideId: string;
  ruleId: string; // e.g. "W-201", "W-204", "W-301"
  componentType: string;
  category: string;
  title: string;
  description: string;
  prohibitedPattern?: string;
  recommendedPattern?: string;
  beforeExample: string;
  afterExample: string;
  pageNumber?: number;
  keywords: string[];
  createdAt: number;
}

const DB_NAME = 'ux_writing_rag_db';
const DB_VERSION = 1;

let dbInstance: IDBDatabase | null = null;

export async function openGuideDB(): Promise<IDBDatabase> {
  if (dbInstance) return dbInstance;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Guides store
      if (!db.objectStoreNames.contains('guides')) {
        const guideStore = db.createObjectStore('guides', { keyPath: 'id' });
        guideStore.createIndex('version', 'version', { unique: false });
        guideStore.createIndex('isActive', 'isActive', { unique: false });
      }

      // Chunks store for RAG
      if (!db.objectStoreNames.contains('chunks')) {
        const chunkStore = db.createObjectStore('chunks', { keyPath: 'id' });
        chunkStore.createIndex('guideId', 'guideId', { unique: false });
        chunkStore.createIndex('ruleId', 'ruleId', { unique: false });
        chunkStore.createIndex('componentType', 'componentType', { unique: false });
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
 * Saves a guide and its parsed chunks to IndexedDB
 */
export async function saveGuideWithChunks(
  guide: UploadedGuideVersion,
  chunks: GuideChunk[]
): Promise<void> {
  const db = await openGuideDB();
  const tx = db.transaction(['guides', 'chunks'], 'readwrite');

  const guideStore = tx.objectStore('guides');
  const chunkStore = tx.objectStore('chunks');

  // If this guide is active, mark all others as inactive
  if (guide.isActive) {
    const allGuidesReq = guideStore.getAll();
    allGuidesReq.onsuccess = () => {
      const existing = allGuidesReq.result || [];
      existing.forEach((g: UploadedGuideVersion) => {
        if (g.id !== guide.id && g.isActive) {
          guideStore.put({ ...g, isActive: false });
        }
      });
    };
  }

  guideStore.put(guide);

  // Store chunks
  chunks.forEach((chunk) => {
    chunkStore.put(chunk);
  });

  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Returns all registered guides
 */
export async function getAllGuidesFromDB(): Promise<UploadedGuideVersion[]> {
  const db = await openGuideDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('guides', 'readonly');
    const store = tx.objectStore('guides');
    const req = store.getAll();

    req.onsuccess = () => {
      resolve(req.result || []);
    };
    req.onerror = () => reject(req.error);
  });
}

/**
 * Returns the currently active guide, or null
 */
export async function getActiveGuideFromDB(): Promise<UploadedGuideVersion | null> {
  const guides = await getAllGuidesFromDB();
  return guides.find((g) => g.isActive) || guides[0] || null;
}

/**
 * Sets a specific guide as active
 */
export async function setActiveGuideInDB(guideId: string): Promise<void> {
  const db = await openGuideDB();
  const tx = db.transaction('guides', 'readwrite');
  const store = tx.objectStore('guides');
  const req = store.getAll();

  return new Promise((resolve, reject) => {
    req.onsuccess = () => {
      const guides = req.result || [];
      guides.forEach((g: UploadedGuideVersion) => {
        store.put({
          ...g,
          isActive: g.id === guideId,
        });
      });
      tx.oncomplete = () => resolve();
    };
    req.onerror = () => reject(req.error);
  });
}

/**
 * Returns all RAG chunks for a guide (or all active chunks)
 */
export async function getChunksFromDB(guideId?: string): Promise<GuideChunk[]> {
  const db = await openGuideDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('chunks', 'readonly');
    const store = tx.objectStore('chunks');

    if (guideId) {
      const index = store.index('guideId');
      const req = index.getAll(guideId);
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    } else {
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    }
  });
}

/**
 * Deletes a guide and its associated chunks
 */
export async function deleteGuideFromDB(guideId: string): Promise<void> {
  const db = await openGuideDB();
  const tx = db.transaction(['guides', 'chunks'], 'readwrite');

  const guideStore = tx.objectStore('guides');
  const chunkStore = tx.objectStore('chunks');

  guideStore.delete(guideId);

  // Remove corresponding chunks
  const chunkIndex = chunkStore.index('guideId');
  const keyRange = IDBKeyRange.only(guideId);
  const cursorReq = chunkIndex.openCursor(keyRange);

  cursorReq.onsuccess = (e) => {
    const cursor = (e.target as IDBRequest).result;
    if (cursor) {
      cursor.delete();
      cursor.continue();
    }
  };

  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Initializes DB with INITIAL_PDF_GUIDE_V03 if database is empty
 */
export async function seedDefaultGuideIfNeeded(): Promise<UploadedGuideVersion> {
  const guides = await getAllGuidesFromDB();
  if (guides.length > 0) {
    const active = guides.find((g) => g.isActive) || guides[0];
    return active;
  }

  // Generate chunks from default v0.3 guide
  const defaultGuide = INITIAL_PDF_GUIDE_V03;
  const chunks: GuideChunk[] = [];

  // 1. General Principles
  defaultGuide.extractedRules.generalPrinciples.forEach((gp) => {
    chunks.push({
      id: `chunk-${defaultGuide.id}-${gp.id}`,
      guideId: defaultGuide.id,
      ruleId: gp.id,
      componentType: 'all',
      category: '총칙',
      title: gp.title,
      description: gp.description,
      beforeExample: '',
      afterExample: '',
      pageNumber: 2,
      keywords: [gp.id, gp.title, '원칙', '고객중심', '간결성', '명확성'],
      createdAt: Date.now(),
    });
  });

  // 2. Component Rules (W-201 ~ W-209)
  defaultGuide.extractedRules.componentRules.forEach((cr) => {
    chunks.push({
      id: `chunk-${defaultGuide.id}-${cr.ruleId}`,
      guideId: defaultGuide.id,
      ruleId: cr.ruleId,
      componentType: cr.componentType,
      category: '컴포넌트규칙',
      title: cr.title,
      description: cr.description,
      prohibitedPattern: cr.badExample,
      recommendedPattern: cr.goodExample,
      beforeExample: cr.badExample,
      afterExample: cr.goodExample,
      pageNumber: cr.page,
      keywords: [
        cr.ruleId,
        cr.componentType,
        cr.title,
        cr.limit,
        ...cr.badExample.split(/\s+/),
        ...cr.goodExample.split(/\s+/),
      ].filter(Boolean),
      createdAt: Date.now(),
    });
  });

  // 3. Terminology Rules (W-301 ~ W-303)
  defaultGuide.extractedRules.terminology.forEach((term) => {
    chunks.push({
      id: `chunk-${defaultGuide.id}-${term.id}`,
      guideId: defaultGuide.id,
      ruleId: term.id.toUpperCase(),
      componentType: 'all',
      category: term.category,
      title: `${term.category} 순화 (${term.prohibited} -> ${term.recommended})`,
      description: term.reason,
      prohibitedPattern: term.prohibited,
      recommendedPattern: term.recommended,
      beforeExample: term.prohibited,
      afterExample: term.recommended,
      pageNumber: 9,
      keywords: [term.prohibited, term.recommended, term.category, '순화', '지양'],
      createdAt: Date.now(),
    });
  });

  await saveGuideWithChunks(defaultGuide, chunks);
  return defaultGuide;
}
