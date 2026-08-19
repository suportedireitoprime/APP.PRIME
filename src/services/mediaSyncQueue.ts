import { supabase } from '@/integrations/supabase/client';
import { localDb } from './localDb';
import { conectado } from '@/lib/nativo/rede';
import * as idb from 'idb-keyval';
import { toast } from '@/hooks/use-toast';

export interface MediaQueueRow {
  id: number;
  local_blob_id: string; // The key used in idb-keyval
  bucket: string;
  file_path: string;
  mime_type: string;
  db_table: string; // the supabase table to insert metadata into after successful upload
  db_payload: string; // JSON of the row to insert
  retries: number;
  created_at: number;
}

let flushing = false;
let started = false;

async function ensureTable() {
  await localDb.exec(`
    CREATE TABLE IF NOT EXISTS media_sync_queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      local_blob_id TEXT NOT NULL,
      bucket TEXT NOT NULL,
      file_path TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      db_table TEXT NOT NULL,
      db_payload TEXT NOT NULL,
      retries INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL
    );
  `);
}

function isOnline(): boolean {
  return conectado();
}

export const mediaSyncQueue = {
  /**
   * Enqueues a blob for offline storage and later sync.
   */
  async enqueue(
    blob: Blob,
    bucket: string,
    filePath: string,
    dbTable: string,
    dbPayload: Record<string, any>
  ): Promise<void> {
    await ensureTable();

    // 1. Store the Blob in IndexedDB (idb-keyval)
    const localBlobId = `media_blob_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    await idb.set(localBlobId, blob);

    // 2. Queue the metadata in local SQLite
    await localDb.run(
      'INSERT INTO media_sync_queue(local_blob_id, bucket, file_path, mime_type, db_table, db_payload, created_at) VALUES(?, ?, ?, ?, ?, ?, ?)',
      [localBlobId, bucket, filePath, blob.type, dbTable, JSON.stringify(dbPayload), Date.now()]
    );

    // 3. Attempt flush if online
    if (isOnline()) {
      void this.flush();
    }
  },

  async size(): Promise<number> {
    try {
      await ensureTable();
      const rows = await localDb.query<{ n: number }>('SELECT COUNT(*) as n FROM media_sync_queue');
      return rows[0]?.n ?? 0;
    } catch {
      return 0;
    }
  },

  async flush(): Promise<void> {
    if (flushing || !isOnline()) return;
    flushing = true;
    try {
      await ensureTable();

      while (isOnline()) {
        const rows = await localDb.query<MediaQueueRow>(
          'SELECT * FROM media_sync_queue ORDER BY id ASC LIMIT 5'
        );
        if (rows.length === 0) break;

        for (const row of rows) {
          try {
            // 1. Retrieve the Blob from IDB
            const blob = await idb.get<Blob>(row.local_blob_id);
            if (!blob) {
              // Blob was lost from IDB, we must discard this row to avoid infinite loop
              console.warn(`[MediaSync] Blob missing in IDB: ${row.local_blob_id}`);
              await localDb.run('DELETE FROM media_sync_queue WHERE id=?', [row.id]);
              continue;
            }

            // 2. Upload to Supabase Storage
            const { error: uploadError } = await supabase.storage
              .from(row.bucket)
              .upload(row.file_path, blob, {
                contentType: row.mime_type,
                upsert: true,
              });

            if (uploadError) {
              throw new Error(`Upload failed: ${uploadError.message}`);
            }

            // 3. Insert metadata to Supabase DB
            const payload = JSON.parse(row.db_payload);
            const { error: dbError } = await supabase.from(row.db_table).upsert(payload);

            if (dbError) {
              throw new Error(`DB Insert failed: ${dbError.message}`);
            }

            // SUCCESS! Clean up local files
            await localDb.run('DELETE FROM media_sync_queue WHERE id=?', [row.id]);
            await idb.del(row.local_blob_id);
            console.log(`[MediaSync] Successfully synced ${row.file_path}`);
            toast({
              title: "Sincronização Concluída",
              description: `Mídia offline sincronizada com sucesso.`,
            });
          } catch (err: any) {
            console.error(`[MediaSync] Error syncing row ${row.id}:`, err);
            
            // Handle failures
            const msg = String(err?.message ?? err);
            const permanent = /permission|violates|invalid|constraint|not found/i.test(msg);
            
            if (permanent || row.retries >= 5) {
              await localDb.run('DELETE FROM media_sync_queue WHERE id=?', [row.id]);
              await idb.del(row.local_blob_id);
            } else {
              await localDb.run('UPDATE media_sync_queue SET retries=? WHERE id=?', [
                row.retries + 1,
                row.id,
              ]);
              await new Promise((r) => setTimeout(r, 2000));
            }
          }
        }
      }
    } finally {
      flushing = false;
    }
  },
};

export function startMediaSyncWorker(): void {
  if (started || typeof window === 'undefined') return;
  started = true;
  window.addEventListener('online', () => {
    void mediaSyncQueue.flush();
  });
  // Attempt to drain on boot
  setTimeout(() => {
    void mediaSyncQueue.flush();
  }, 4000);
}
