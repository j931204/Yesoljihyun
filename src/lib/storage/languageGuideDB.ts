/**
 * IndexedDB storage for Language Guides, Chunks, and Structured Rules
 * Runs 100% on client browser with zero server DB dependency.
 */

import { UploadedGuideVersion, StructuredGuideRule } from '../../types';
import { INITIAL_PDF_GUIDE_V03 } from '../../data/defaultGuides';
import { buildStructuredRulesFromGuide } from '../rag/ruleExtractor';

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
const DB_VERSION = 2;

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

      // Structured Rules store
      if (!db.objectStoreNames.contains('structured_rules')) {
        const ruleStore = db.createObjectStore('structured_rules', { keyPath: 'id' });
        ruleStore.createIndex('guideId', 'guideId', { unique: false });
        ruleStore.createIndex('category', 'category', { unique: false });
        ruleStore.createIndex('type', 'type', { unique: false });
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
 * Saves a guide, its chunks, and structured rules to IndexedDB
 */
export async function saveGuideWithChunksAndRules(
  guide: UploadedGuideVersion,
  chunks: GuideChunk[],
  rules: StructuredGuideRule[]
): Promise<void> {
  const db = await openGuideDB();
  const tx = db.transaction(['guides', 'chunks', 'structured_rules'], 'readwrite');

  const guideStore = tx.objectStore('guides');
  const chunkStore = tx.objectStore('chunks');
  const ruleStore = tx.objectStore('structured_rules');

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

  // Update guide with rules
  guideStore.put({
    ...guide,
    structuredRules: rules,
  });

  // Store raw chunks
  chunks.forEach((chunk) => {
    chunkStore.put(chunk);
  });

  // Store structured rules
  rules.forEach((rule) => {
    ruleStore.put({
      ...rule,
      guideId: guide.id,
    });
  });

  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Backward compatibility wrapper
 */
export async function saveGuideWithChunks(
  guide: UploadedGuideVersion,
  chunks: GuideChunk[]
): Promise<void> {
  const rules = guide.structuredRules || buildStructuredRulesFromGuide(guide, chunks);
  return saveGuideWithChunksAndRules(guide, chunks, rules);
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
 * Returns all RAG chunks for a guide (or all chunks)
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
 * Returns all Structured Rules for a guide (or all structured rules)
 */
export async function getStructuredRulesFromDB(guideId?: string): Promise<StructuredGuideRule[]> {
  const db = await openGuideDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('structured_rules', 'readonly');
    const store = tx.objectStore('structured_rules');

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
 * Deletes a guide and its associated chunks and rules
 */
export async function deleteGuideFromDB(guideId: string): Promise<void> {
  const db = await openGuideDB();
  const tx = db.transaction(['guides', 'chunks', 'structured_rules'], 'readwrite');
  const guideStore = tx.objectStore('guides');
  const chunkStore = tx.objectStore('chunks');
  const ruleStore = tx.objectStore('structured_rules');

  guideStore.delete(guideId);

  const chunkIndex = chunkStore.index('guideId');
  const chunkReq = chunkIndex.getAllKeys(guideId);
  chunkReq.onsuccess = () => {
    const keys = chunkReq.result || [];
    keys.forEach((k) => chunkStore.delete(k));
  };

  const ruleIndex = ruleStore.index('guideId');
  const ruleReq = ruleIndex.getAllKeys(guideId);
  ruleReq.onsuccess = () => {
    const keys = ruleReq.result || [];
    keys.forEach((k) => ruleStore.delete(k));
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
  const defaultGuide = INITIAL_PDF_GUIDE_V03;

  if (guides.length > 0) {
    const active = guides.find((g) => g.isActive) || guides[0];
    const existingRules = await getStructuredRulesFromDB(defaultGuide.id);
    const existingChunks = await getChunksFromDB(defaultGuide.id);

    const hasLatest =
      existingRules.length > 0 &&
      existingChunks.some((c) => c.ruleId === 'W-210' || c.prohibitedPattern?.includes('포커스를 이동하여')) &&
      existingChunks.some((c) => c.prohibitedPattern?.includes('예약해주세요')) &&
      existingChunks.some((c) => c.ruleId === 'W-201-1' || c.id.includes('sub'));

    if (hasLatest) {
      return active;
    }
  }

  // Generate chunks from default v0.3 guide
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

  // 2. Component Rules (W-201 ~ W-211)
  defaultGuide.extractedRules.componentRules.forEach((cr) => {
    // Main component chunk
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

    // Also add granular individual pair chunks if slash separated
    const badParts = cr.badExample.split(/[\/\n|]+/).map((s) => s.trim()).filter(Boolean);
    const goodParts = cr.goodExample.split(/[\/\n|]+/).map((s) => s.trim()).filter(Boolean);
    if (badParts.length === goodParts.length && badParts.length > 1) {
      badParts.forEach((bad, i) => {
        const good = goodParts[i];
        if (bad && good && bad !== good) {
          chunks.push({
            id: `chunk-${defaultGuide.id}-${cr.ruleId}-sub-${i + 1}`,
            guideId: defaultGuide.id,
            ruleId: `${cr.ruleId}-${i + 1}`,
            componentType: cr.componentType,
            category: '컴포넌트규칙',
            title: `${cr.title}: ${bad} -> ${good}`,
            description: cr.description,
            prohibitedPattern: bad,
            recommendedPattern: good,
            beforeExample: bad,
            afterExample: good,
            pageNumber: cr.page,
            keywords: [cr.ruleId, cr.componentType, bad, good],
            createdAt: Date.now(),
          });
        }
      });
    }
  });

  // 3. Terminology Rules (W-301 ~ W-303, TV, etc.)
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

  const structuredRules = buildStructuredRulesFromGuide(defaultGuide, chunks);
  await saveGuideWithChunksAndRules(defaultGuide, chunks, structuredRules);
  return defaultGuide;
}
