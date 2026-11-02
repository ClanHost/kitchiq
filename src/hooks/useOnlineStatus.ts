import { useEffect, useState } from 'react';
import { syncService } from '../services/syncService';

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState<boolean>(() => syncService.isOnline());

  useEffect(() => {
    const unsubscribe = syncService.subscribe(() => {
      setIsOnline(syncService.isOnline());
    });
    return unsubscribe;
  }, []);

  return isOnline;
}
