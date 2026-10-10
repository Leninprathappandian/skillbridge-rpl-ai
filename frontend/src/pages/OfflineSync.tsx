import React, { useState, useEffect } from 'react';
import { getPendingSyncQueue, clearSyncQueueItem } from '../offline/db';
import { syncApi } from '../services/api';
import { Wifi, WifiOff, RefreshCw, CheckCircle2, Database } from 'lucide-react';

export const OfflineSync: React.FC = () => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [queue, setQueue] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [syncResult, setSyncResult] = useState<any>(null);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    loadQueue();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  async function loadQueue() {
    try {
      const q = await getPendingSyncQueue();
      setQueue(q);
    } catch (e) {
      console.error(e);
    }
  }

  const handleSyncNow = async () => {
    if (queue.length === 0) return;
    setLoading(true);
    setSyncResult(null);

    try {
      const res = await syncApi.processQueue(queue);
      setSyncResult(res);

      for (const item of queue) {
        await clearSyncQueueItem(item.client_op_id);
      }
      await loadQueue();
    } catch (err: any) {
      setSyncResult({ error: err.message || 'Sync failed.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className={`p-6 rounded-2xl border shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${
        isOnline ? 'bg-white border-slate-200' : 'bg-amber-50 border-amber-200 text-amber-950'
      }`}>
        <div className="flex items-center space-x-3">
          <div className={`p-3 rounded-xl ${isOnline ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-200 text-amber-800'}`}>
            {isOnline ? <Wifi className="h-6 w-6" /> : <WifiOff className="h-6 w-6" />}
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Offline Data Capture & Sync Engine</h2>
            <p className="text-xs text-slate-500">
              Connectivity Status: <b className={isOnline ? 'text-emerald-600 font-bold' : 'text-amber-600 font-bold'}>
                {isOnline ? 'ONLINE' : 'OFFLINE MODE'}
              </b>
            </p>
          </div>
        </div>

        <button
          onClick={handleSyncNow}
          disabled={loading || queue.length === 0 || !isOnline}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-5 py-2.5 rounded-xl shadow flex items-center gap-2 disabled:opacity-50 transition"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          <span>{loading ? 'Synchronizing Queue...' : 'Synchronize Pending Changes'}</span>
        </button>
      </div>

      {syncResult && (
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-2xl text-xs space-y-1">
          <p className="font-bold text-blue-900">Sync Execution Results:</p>
          <p className="text-slate-700">
            Processed: <b>{syncResult.processed_count}</b> | Duplicates Blocked: <b>{syncResult.duplicates_count}</b> | Errors: <b>{syncResult.errors_count}</b>
          </p>
        </div>
      )}

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex justify-between items-center pb-3 border-b border-slate-100">
          <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
            <Database className="h-5 w-5 text-blue-600" />
            <span>Local IndexedDB Queue ({queue.length} Pending)</span>
          </h3>
        </div>

        {queue.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-500 flex flex-col items-center space-y-2">
            <CheckCircle2 className="h-8 w-8 text-emerald-500" />
            <p className="font-semibold text-slate-700">All local assessment drafts are fully synchronized with server!</p>
            <p className="text-slate-400">Offline changes made during connectivity drop will automatically queue here.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {queue.map((item) => (
              <div key={item.client_op_id} className="py-3.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="bg-slate-100 font-mono text-[11px] text-slate-700 font-bold px-2 py-0.5 rounded">
                      {item.client_op_id}
                    </span>
                    <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                      {item.type}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Queued at: {new Date(item.created_at).toLocaleString()}</p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase">
                    Pending Sync
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
