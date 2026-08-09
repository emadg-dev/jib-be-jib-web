import { useState, useEffect } from 'react';
import { X, Share } from 'lucide-react';
import { usePreferences } from '../contexts/PreferencesContext';

const DISMISSED_KEY = 'add-to-homescreen-dismissed';

function isStandalone(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as any).standalone === true;
}

function isIOS(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

export default function AddToHomeScreen() {
  const { language } = usePreferences();
  const fa = language === 'fa';
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isStandalone()) return;
    if (localStorage.getItem(DISMISSED_KEY)) return;
    setShow(true);
  }, []);

  const dismiss = () => {
    setShow(false);
    localStorage.setItem(DISMISSED_KEY, '1');
  };

  if (!show) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[9998] p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
      <div className="mx-auto max-w-lg rounded-2xl border border-border bg-card p-4 shadow-xl">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <Share className="h-5 w-5 text-primary" />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-foreground">
              {fa ? 'افزودن به صفحه اصلی' : 'Add to Home Screen'}
            </h3>

            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              {isIOS()
                ? (fa
                    ? 'روی دکمه اشتراک‌گذاری  در پایین صفحه بزنید، سپس «افزودن به صفحه اصلی» را انتخاب کنید.'
                    : 'Tap the Share button  at the bottom of the screen, then select "Add to Home Screen".')
                : (fa
                    ? 'از منوی مرورگر گزینه «افزودن به صفحه اصلی» را انتخاب کنید.'
                    : 'Use your browser menu and select "Add to Home Screen".')
              }
            </p>

            {isIOS() && (
              <div className="mt-2 flex items-center gap-1.5 text-[11px] text-muted-foreground/70">
                <span className="inline-block rounded-md bg-muted px-1.5 py-0.5 font-mono text-[10px]">Share</span>
                <span>→</span>
                <span className="inline-block rounded-md bg-muted px-1.5 py-0.5 font-mono text-[10px]">
                  {fa ? 'افزودن به صفحه اصلی' : 'Add to Home Screen'}
                </span>
              </div>
            )}
          </div>

          <button
            onClick={dismiss}
            className="shrink-0 rounded-lg p-1 text-muted-foreground transition hover:bg-accent hover:text-foreground"
            aria-label={fa ? 'بستن' : 'Dismiss'}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
