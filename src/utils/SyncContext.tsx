import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { db } from '../db/schema';

type SyncStatus = 'synced' | 'syncing' | 'offline' | 'error';

interface SyncContextType {
  status: SyncStatus;
  pendingCount: number;
}

const SyncContext = createContext<SyncContextType>({ status: 'synced', pendingCount: 0 });

export const useSync = () => useContext(SyncContext);

export function SyncProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<SyncStatus>('synced');
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    // Poll the queue every 10 seconds
    const interval = setInterval(async () => {
      if (!navigator.onLine) {
        setStatus('offline');
        // Just update count
        const pending = await db.getPendingSyncs().catch(() => []);
        setPendingCount(pending.length);
        return;
      }

      try {
        const pending = await db.getPendingSyncs();
        setPendingCount(pending.length);
        
        if (pending.length === 0) {
          setStatus('synced');
          return;
        }

        setStatus('syncing');

        // Real API logic
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

        for (const item of pending) {
          const { entity, data } = JSON.parse(item.payload);
          
          const response = await fetch(`${API_BASE_URL}/sync/${entity}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
          });

          if (!response.ok) {
            throw new Error(`Sync failed with status: ${response.status}`);
          }
          
          // Mark as complete locally ONLY if the API succeeds (200 OK)
          await db.markSyncComplete(item.id);
        }

        setStatus('synced');
        setPendingCount(0);
      } catch (e) {
        console.error("Background sync failed", e);
        setStatus('error');
      }
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  return (
    <SyncContext.Provider value={{ status, pendingCount }}>
      {children}
    </SyncContext.Provider>
  );
}
