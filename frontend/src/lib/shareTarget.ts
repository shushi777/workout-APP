import { openDB } from 'idb';
import type { DBSchema } from 'idb';

interface ShareTargetDB extends DBSchema {
  'shared-videos': {
    key: string;
    value: {
      id: string;
      file: File;
      timestamp: number;
    };
  };
}

const DB_NAME = 'workout-share-target';
const STORE_NAME = 'shared-videos';
const DB_VERSION = 1;

async function getDB() {
  return openDB<ShareTargetDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    },
  });
}

export async function storeSharedVideo(id: string, file: File): Promise<void> {
  const db = await getDB();
  await db.put(STORE_NAME, {
    id,
    file,
    timestamp: Date.now(),
  });
  db.close();
}

export async function getSharedVideo(id: string): Promise<File | null> {
  const db = await getDB();
  const entry = await db.get(STORE_NAME, id);
  db.close();
  return entry?.file || null;
}

export async function deleteSharedVideo(id: string): Promise<void> {
  const db = await getDB();
  await db.delete(STORE_NAME, id);
  db.close();
}

// Cleanup old shared videos (>1 hour old)
export async function cleanupOldSharedVideos(): Promise<void> {
  const db = await getDB();
  const allEntries = await db.getAll(STORE_NAME);
  const oneHourAgo = Date.now() - 60 * 60 * 1000;

  for (const entry of allEntries) {
    if (entry.timestamp < oneHourAgo) {
      await db.delete(STORE_NAME, entry.id);
    }
  }
  db.close();
}
