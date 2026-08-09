import { useState, useEffect, useCallback } from 'react';
import { registerSW } from 'virtual:pwa-register';

let skipWaiting: (() => Promise<void>) | null = null;

const updateSW = registerSW({
  onNeedRefresh() {
    window.dispatchEvent(new Event('pwa-update-available'));
  },
});

skipWaiting = () => updateSW();

export function usePWAUpdate() {
  const [needRefresh, setNeedRefresh] = useState(false);

  const close = useCallback(() => {
    setNeedRefresh(false);
  }, []);

  const update = useCallback(async () => {
    if (!skipWaiting) return;
    await skipWaiting();
    window.location.reload();
  }, []);

  useEffect(() => {
    const onRefresh = () => setNeedRefresh(true);
    window.addEventListener('pwa-update-available', onRefresh);
    return () => window.removeEventListener('pwa-update-available', onRefresh);
  }, []);

  return { needRefresh, update, close };
}
