import { useEffect, useState, type SetStateAction } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Settings as SettingsIcon, Send, Save, Bell, SlidersHorizontal } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { usePreferences } from '../contexts/PreferencesContext';
import { notificationsApi, type TelegramEventKey, type TelegramSettings } from '../api/services';
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Textarea, Label, Checkbox } from '../components/ui/core';
import { CardSkeleton } from '../components/Skeleton';
import { translateError } from '../utils/translations';

const TELEGRAM_EVENTS: { key: TelegramEventKey; en: string; fa: string }[] = [
  { key: 'trip_created', en: 'Trip created', fa: 'سفر ایجاد شد' },
  { key: 'trip_updated', en: 'Trip updated', fa: 'سفر ویرایش شد' },
  { key: 'member_added', en: 'Member added', fa: 'عضو اضافه شد' },
  { key: 'deposit_created', en: 'Deposit added', fa: 'واریز ثبت شد' },
  { key: 'expense_created', en: 'Expense added', fa: 'هزینه ثبت شد' },
  { key: 'rating_submitted', en: 'Rating submitted', fa: 'ارزیابی ثبت شد' },
  { key: 'settlement_recorded', en: 'Settlement recorded', fa: 'تسویه ثبت شد' },
  { key: 'members_report', en: 'Members report (send button)', fa: 'گزارش اعضا (دکمه ارسال)' },
  { key: 'bank_stats_report', en: 'Bank stats report (send button)', fa: 'گزارش وضعیت بانک (دکمه ارسال)' },
  { key: 'settlements_report', en: 'Settlements report (send button)', fa: 'گزارش تسویه‌ها (دکمه ارسال)' },
  { key: 'ratings_report', en: 'Ratings report (send button)', fa: 'گزارش ارزیابی‌ها (دکمه ارسال)' },
];

const TEMPLATE_HINTS: Partial<Record<TelegramEventKey, string>> = {
  trip_created: '{trip_name}',
  trip_updated: '{trip_name}',
  member_added: '{member_name}',
  deposit_created: '{member_name}, {amount}',
  expense_created: '{description}, {category}, {amount}, {benefactors}',
  rating_submitted: '',
  settlement_recorded: '{member_name}, {amount}',
  members_report: '{members_list}, {bank_balance}',
  bank_stats_report: '{bank_balance}, {total_deposits}, {total_expenses}, {settled_line}, {member_count}, {creditors_line}, {debtors_line}',
  settlements_report: '{settlements_list}, {total_settled}, {settlement_count}',
  ratings_report: '{ratings_list}, {rated_count}',
};

const DEFAULT_TEMPLATES: Record<TelegramEventKey, string> = {
  trip_created: 'A new trip "{trip_name}" was created.',
  trip_updated: 'Trip "{trip_name}" was updated.',
  member_added: '{member_name} joined the trip.',
  deposit_created: '{member_name} deposited {amount}.',
  expense_created: 'Expense {description} ({category}) was added for {amount}.',
  rating_submitted: 'A member has submitted their ratings.',
  settlement_recorded: '{member_name} received {amount} from the bank.',
  members_report: '👥 *Member Financial Breakdown*\n━━━━━━━━━━━━━━━━━━━━━━\n\n{members_list}\n\n━━━━━━━━━━━━━━━━━━━━━━\n🏦 Bank Balance: {bank_balance}',
  bank_stats_report: '🏦 *Bank Stats*\n\n💰 Bank Balance: *{bank_balance}*\n📈 Total Deposits: {total_deposits}\n📉 Total Expenses: {total_expenses}\n{settled_line}\n\n👥 Members: {member_count}\n{creditors_line}\n{debtors_line}',
  settlements_report: '📋 *Settlements Summary*\n\n{settlements_list}\n\n━━━━━━━━━━━━━━━━━━━━━━\n💰 Total Settled: *{total_settled}*\n📊 {settlement_count} settlement(s) recorded',
  ratings_report: '⭐ *Member Ratings*\n\n{ratings_list}\n\n━━━━━━━━━━━━━━━━━━━━━━\n📊 {rated_count} member(s) rated',
};

export default function SettingsPage() {
  const { language } = usePreferences();
  const fa = language === 'fa';
  const { selectedTrip, isOwner } = useAuth();
  const navigate = useNavigate();

  const [tab, setTab] = useState<'general' | 'notifications'>('general');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOwner) navigate('/dashboard', { replace: true });
  }, [isOwner, navigate]);

  if (!isOwner) return null;

  const clearFeedback = () => { setMessage(''); setError(''); };

  const showSuccess = (msg: string) => { setMessage(msg); setError(''); };
  const showError = (err: any) => {
    const raw = err?.message || 'Something went wrong';
    setError(translateError(raw, fa));
    setMessage('');
  };

  return (
    <div dir={fa ? 'rtl' : 'ltr'} className="space-y-6">
      <div>
        <h1 className="page-title">{fa ? 'تنظیمات سفر' : 'Trip Settings'}</h1>
        <p className="page-subtitle">
          {fa
            ? 'تنظیمات سفر «' + (selectedTrip?.name || '') + '» را مدیریت کنید.'
            : `Manage settings for "${selectedTrip?.name || ''}".`}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-2xl border border-border bg-card/50 p-1">
        <TabButton
          active={tab === 'general'}
          onClick={() => { setTab('general'); clearFeedback(); }}
          icon={<SlidersHorizontal size={16} />}
          label={fa ? 'عمومی' : 'General'}
        />
        <TabButton
          active={tab === 'notifications'}
          onClick={() => { setTab('notifications'); clearFeedback(); }}
          icon={<Bell size={16} />}
          label={fa ? 'اعلان‌ها' : 'Notifications'}
        />
      </div>

      {message && (
        <div className="rounded-xl bg-green-50 p-3 text-sm text-green-700 dark:bg-green-900/30 dark:text-green-400">
          {message}
        </div>
      )}
      {error && (
        <div className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-900/30 dark:text-rose-400">
          {error}
        </div>
      )}

      {tab === 'general' ? (
        <GeneralTab onSuccess={showSuccess} onError={showError} />
      ) : (
        <NotificationsTab onSuccess={showSuccess} onError={showError} />
      )}
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: any) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
        active
          ? 'bg-primary text-primary-foreground shadow'
          : 'text-muted-foreground hover:bg-accent hover:text-foreground'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function GeneralTab({ onSuccess, onError }: { onSuccess: (m: string) => void; onError: (e: any) => void }) {
  const { language } = usePreferences();
  const fa = language === 'fa';
  const { selectedTrip, updateTrip } = useAuth();
  const [name, setName] = useState(selectedTrip?.name || '');
  const [currency, setCurrency] = useState(selectedTrip?.currency || 'USD');
  const [busy, setBusy] = useState(false);

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedTrip) return;
    setBusy(true);
    try {
      await updateTrip(selectedTrip.id, { name, currency });
      onSuccess(fa ? 'تنظیمات عمومی ذخیره شد' : 'General settings saved');
    } catch (err) {
      onError(err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <SettingsIcon size={20} />
          {fa ? 'اطلاعات سفر' : 'Trip Information'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={save} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="settings-trip-name">{fa ? 'اسم سفر' : 'Trip name'}</Label>
            <Input
              id="settings-trip-name"
              value={name}
              onChange={(e: { target: { value: SetStateAction<string> } }) => setName(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="settings-trip-currency">{fa ? 'واحد پول' : 'Currency'}</Label>
            <Input
              id="settings-trip-currency"
              value={currency}
              maxLength={3}
              onChange={(e: { target: { value: string } }) => setCurrency(e.target.value.toUpperCase())}
              required
            />
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" loading={busy} disabled={busy}>
              <Save size={16} className="me-2" />
              {fa ? 'ذخیره تغییرات' : 'Save changes'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function NotificationsTab({ onSuccess, onError }: { onSuccess: (m: string) => void; onError: (e: any) => void }) {
  const { language } = usePreferences();
  const fa = language === 'fa';
  const queryClient = useQueryClient();

  const { data: settingsRes, isLoading } = useQuery({
    queryKey: ['notification-settings'],
    queryFn: notificationsApi.getSettings,
  });
  const settings: TelegramSettings | undefined = settingsRes?.data;

  const [enabled, setEnabled] = useState(true);
  const [chatId, setChatId] = useState('');
  const [events, setEvents] = useState<Record<string, { enabled: boolean; message: string }>>({});

  useEffect(() => {
    if (!settings) return;
    setEnabled(settings.telegram_enabled);
    setChatId(settings.telegram_chat_id || '');
    setEvents(settings.events || {});
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: () =>
      notificationsApi.updateSettings({
        telegram_enabled: enabled,
        telegram_chat_id: chatId || undefined,
        events: Object.fromEntries(
          TELEGRAM_EVENTS.map(({ key }) => [key, events[key] ?? { enabled: true, message: DEFAULT_TEMPLATES[key] }])
        ),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-settings'] });
      onSuccess(fa ? 'تنظیمات اعلان ذخیره شد' : 'Notification settings saved');
    },
    onError: (err: any) => onError(err),
  });

  const testMutation = useMutation({
    mutationFn: () =>
      notificationsApi.sendTest({
        chat_id: chatId,
        title: 'Test notification',
        message: fa ? 'این یک پیام آزمایشی است ✅' : 'This is a test message ✅',
      }),
    onSuccess: (res: any) => {
      if (res?.data?.delivered) {
        onSuccess(fa ? 'پیام آزمایشی ارسال شد' : 'Test message sent');
      } else {
        onError({ message: fa ? 'ارسال پیام آزمایشی ناموفق بود' : 'Failed to send test message' });
      }
    },
    onError: (err: any) => onError(err),
  });

  const updateEvent = (key: string, patch: Partial<{ enabled: boolean; message: string }>) => {
    setEvents(current => ({ ...current, [key]: { ...(current[key] ?? { enabled: true, message: DEFAULT_TEMPLATES[key as TelegramEventKey] }), ...patch } }));
  };

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
      {/* Submenu */}
      <aside className="lg:w-64 shrink-0">
        <Card>
          <CardContent className="pt-4">
            <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {fa ? 'کانال‌ها' : 'Channels'}
            </p>
            <div className="flex items-center gap-2.5 rounded-xl bg-primary/10 px-4 py-3 font-semibold text-primary">
              <Send size={18} />
              <span>Telegram</span>
            </div>
          </CardContent>
        </Card>
      </aside>

      {/* Telegram settings */}
      <div className="min-w-0 flex-1">
        {isLoading ? (
          <CardSkeleton count={3} />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send size={20} />
                {fa ? 'اعلان‌های تلگرام' : 'Telegram Notifications'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card/60 p-4">
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {fa ? 'فعال‌سازی اعلان‌ها' : 'Enable notifications'}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {fa
                      ? 'با فعال شدن، رویدادهای سفر به تلگرام ارسال می‌شوند.'
                      : 'When enabled, trip events are posted to Telegram.'}
                  </p>
                </div>
                <Checkbox checked={enabled} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEnabled(e.target.checked)} />
              </div>

              <div>
                <Label htmlFor="telegram-chat-id">{fa ? 'شناسه چت تلگرام' : 'Telegram chat ID'}</Label>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Input
                    id="telegram-chat-id"
                    value={chatId}
                    dir="ltr"
                    placeholder="-1001234567890"
                    onChange={(e: { target: { value: string } }) => setChatId(e.target.value)}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    className="shrink-0"
                    loading={testMutation.isPending}
                    disabled={!chatId.trim() || testMutation.isPending}
                    onClick={() => testMutation.mutate()}
                  >
                    <Send size={15} className="me-2" />
                    {fa ? 'ارسال تست' : 'Send test'}
                  </Button>
                </div>
                <p className="mt-1.5 text-xs text-muted-foreground">
                  {fa
                    ? 'شناسه چت گروه یا کانال را در @BotFather بسازید و اینجا وارد کنید.'
                    : 'Create a group/channel via @BotFather and paste its chat ID here.'}
                </p>
              </div>

              <div className="space-y-4 border-t border-border pt-5">
                <p className="text-sm font-semibold text-foreground">
                  {fa ? 'رویدادها' : 'Events'}
                </p>
                {TELEGRAM_EVENTS.map(({ key, en, fa: faLabel }) => {
                  const current = events[key] ?? { enabled: true, message: DEFAULT_TEMPLATES[key] };
                  return (
                    <div key={key} className="rounded-xl border border-border bg-card/60 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <Checkbox
                          checked={current.enabled}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateEvent(key, { enabled: e.target.checked })}
                        >
                          {fa ? faLabel : en}
                        </Checkbox>
                      </div>
                      <div className="mt-3">
                        <Textarea
                          dir="ltr"
                          value={current.message}
                          rows={3}
                          onChange={(e: { target: { value: string } }) => updateEvent(key, { message: e.target.value })}
                        />
                        <p className="mt-1.5 text-xs text-muted-foreground">
                          {fa ? 'متغیرهای مجاز:' : 'Available variables:'} {TEMPLATE_HINTS[key]}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-end border-t border-border pt-5">
                <Button type="button" loading={saveMutation.isPending} disabled={saveMutation.isPending} onClick={() => saveMutation.mutate()}>
                  <Save size={16} className="me-2" />
                  {fa ? 'ذخیره تنظیمات' : 'Save settings'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
