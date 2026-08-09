import { usePreferences } from '../contexts/PreferencesContext';
import { usePWAUpdate } from '../hooks/usePWAUpdate';

export default function UpdatePrompt() {
  const { needRefresh, update, close } = usePWAUpdate();
  const { language } = usePreferences();
  const fa = language === 'fa';

  if (!needRefresh) return null;

  return (
    <div className="fixed inset-0 z-[9999] grid place-items-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-xl">
        <h2 className="text-lg font-bold text-foreground">
          {fa ? 'نسخه جدید موجود است' : 'Update Available'}
        </h2>

        <p className="mt-2 text-sm text-muted-foreground">
          {fa
            ? 'نسخه جدیدی از برنامه دانلود شده. برای استفاده از آخرین تغییرات، برنامه رو به‌روز کنید.'
            : 'A new version has been downloaded. Update to get the latest features and fixes.'}
        </p>

        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={close}
            className="rounded-xl px-4 py-2 text-sm font-medium text-muted-foreground transition hover:bg-accent"
          >
            {fa ? 'بعداً' : 'Later'}
          </button>

          <button
            onClick={update}
            className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 active:scale-[.98]"
          >
            {fa ? 'به‌روزرسانی' : 'Update Now'}
          </button>
        </div>
      </div>
    </div>
  );
}
