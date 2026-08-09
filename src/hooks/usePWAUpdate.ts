import { useState, useEffect, useCallback } from 'react';
import { registerSW } from 'virtual:pwa-register';

let skipWaiting: (() => Promise<void>) | null = null;

const updateSW = registerSW({
  onNeedRefresh() {
    window.dispatchEvent(new Event('pwa-update-available'));
  },
  onOfflineReady() {
    window.dispatchEvent(new Event('pwa-offline-ready'));
  },
});

skipWaiting = () => updateSW();

export function usePWAUpdate() {
  const [needRefresh, setNeedRefresh] = useState(false);
  const [offlineReady, setOfflineReady] = useState(false);

  const close = useCallback(() => {
    setNeedRefresh(false);
    setOfflineReady(false);
  }, []);

  const update = useCallback(async () => {
    if (!skipWaiting) return;
    await skipWaiting();
    window.location.reload();
  }, []);

  useEffect(() => {
    const onRefresh = () => setNeedRefresh(true);
    const onOffline = () => setOfflineReady(true);

    window.addEventListener('pwa-update-available', onRefresh);
    window.addEventListener('pwa-offline-ready', onOffline);

    return () => {
      window.removeEventListener('pwa-update-available', onRefresh);
      window.removeEventListener('pwa-offline-ready', onOffline);
    };
  }, []);

  return { needRefresh, offlineReady, update, close };
}
