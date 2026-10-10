import { openDB, type DBSchema, type IDBPDatabase } from 'idb';

interface SkillBridgeDB extends DBSchema {
  draft_assessments: {
    key: string;
    value: {
      id: string;
      worker_id: string;
      qp_id: string;
      results: Record<string, any>;
      updated_at: string;
    };
  };
  sync_queue: {
    key: string;
    value: {
      client_op_id: string;
      type: string;
      payload: any;
      created_at: string;
      status: 'pending' | 'syncing' | 'failed';
    };
  };
}

let dbPromise: Promise<IDBPDatabase<SkillBridgeDB>> | null = null;

export function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<SkillBridgeDB>('skillbridge_rpl_db', 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('draft_assessments')) {
          db.createObjectStore('draft_assessments', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('sync_queue')) {
          db.createObjectStore('sync_queue', { keyPath: 'client_op_id' });
        }
      },
    });
  }
  return dbPromise;
}

export async function saveLocalAssessmentDraft(id: string, worker_id: string, qp_id: string, results: Record<string, any>) {
  const db = await getDB();
  await db.put('draft_assessments', {
    id,
    worker_id,
    qp_id,
    results,
    updated_at: new Date().toISOString()
  });
}

export async function getLocalAssessmentDraft(id: string) {
  const db = await getDB();
  return await db.get('draft_assessments', id);
}

export async function enqueueSyncOperation(type: string, payload: any) {
  const db = await getDB();
  const client_op_id = `OP-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const item = {
    client_op_id,
    type,
    payload,
    created_at: new Date().toISOString(),
    status: 'pending' as const
  };
  await db.put('sync_queue', item);
  return item;
}

export async function getPendingSyncQueue() {
  const db = await getDB();
  return await db.getAll('sync_queue');
}

export async function clearSyncQueueItem(client_op_id: string) {
  const db = await getDB();
  await db.delete('sync_queue', client_op_id);
}
