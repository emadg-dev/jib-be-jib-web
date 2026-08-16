import { useState } from 'react';
import { translateError } from '../utils/translations';
import { useNavigate } from 'react-router-dom';
import { Trash2, Plus, Pencil } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { usePreferences } from '../contexts/PreferencesContext';
import { useConfirm } from '../components/ConfirmDialog';
import { usePermissions } from '../hooks/usePermissions';
import type { Trip } from '../api/services';
import {
  FormDialogRoot,
  FormDialogContent,
  FormDialogHeader,
  FormDialogTitle,
  FormDialogBody,
  FormDialogFooter,
  FormDialogClose,
} from '../components/ui/FormDialog';
import {
  Button,
  Input,
  Label,
} from '../components/ui/core';

export default function TripPicker() {
  const {
    trips,
    selectedTrip,
    selectTrip,
    createTrip,
    updateTrip,
    deleteTrip,
    logout,
    isOwner,
    isAdmin,
  } = useAuth();
  const { hasPermission } = usePermissions();

  const canCreateTrip = isOwner || hasPermission('trip.create');

  const { language } = usePreferences();
  const fa = language === 'fa';
  const confirm = useConfirm();

  const navigate = useNavigate();

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const showSuccess = (msg: string) => { setMessage(msg); setError(''); };
  const showError = (err: any) => {
    const raw = err?.message || 'Something went wrong';
    setError(translateError(raw, fa));
    setMessage('');
  };

  const [name, setName] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [editing, setEditing] = useState<Trip | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);

  const active = trips.filter((t) => t.active !== false);

  const resetForm = () => {
    setName('');
    setCurrency('USD');
    setEditing(null);
    setShowForm(false);
  };

  const choose = async (id: string) => {
    setBusy(true);
    try {
      await selectTrip(id);
      navigate('/dashboard');
    } finally {
      setBusy(false);
    }
  };

  const beginEdit = (trip: Trip) => {
    setName(trip.name);
    setCurrency(trip.currency);
    setEditing(trip);
    setShowForm(true);
  };

  const deleteCurrentTrip = async (id: string) => {
    if (!await confirm(
      fa ? 'حذف سفر' : 'Delete trip',
      fa ? 'از حذف این سفر مطمئنی؟ این عمل قابل بازگشت نیست.' : 'Are you sure you want to delete this trip? This action cannot be undone.'
    )) return;
    setBusy(true);
    try {
      await deleteTrip(id);
      resetForm();
      showSuccess(fa ? 'سفر با موفقیت حذف شد.' : 'Trip deleted successfully.');
    } catch (err: any) {
      showError(err);
    } finally {
      setBusy(false);
    }
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    try {
      if (editing) {
        await updateTrip(editing.id, { name, currency });
        showSuccess(fa ? 'سفر با موفقیت ویرایش شد.' : 'Trip updated successfully.');
      } else {
        await createTrip({ name, currency });
        showSuccess(fa ? 'سفر با موفقیت ایجاد شد.' : 'Trip created successfully.');
      }
      resetForm();
    } catch (err: any) {
      showError(err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div dir={fa ? 'rtl' : 'ltr'} className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="page-title">
          {fa ? 'سفرهای من' : 'Your Trips'}
        </h1>
        <p className="page-subtitle">
          {fa
            ? 'یکی از سفرها رو انتخاب کن تا هزینه‌ها، اعضا و حساب‌هاش رو ببینی.'
            : 'Choose a trip to manage its budget, members and expenses.'}
        </p>
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

      {/* Create / Edit form */}
      <FormDialogRoot open={showForm} onOpenChange={(open) => { if (!open) resetForm(); }}>
        <FormDialogContent>
          <FormDialogHeader>
            <FormDialogTitle>
              {editing
                ? fa ? 'ویرایش سفر' : 'Edit Trip'
                : fa ? 'ساخت سفر' : 'Create Trip'}
            </FormDialogTitle>
          </FormDialogHeader>
          <FormDialogBody>
            <form id="trip-form" onSubmit={save} className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor="trip-name">{fa ? 'اسم سفر' : 'Trip name'}</Label>
                <Input
                  id="trip-name"
                  value={name}
                  placeholder={fa ? 'مثلاً سفر شمال' : 'e.g. Summer trip'}
                  onChange={(e: { target: { value: React.SetStateAction<string>; }; }) => setName(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="trip-currency">{fa ? 'واحد پول' : 'Currency'}</Label>
                <Input
                  id="trip-currency"
                  value={currency}
                  placeholder="T"
                  maxLength={3}
                  onChange={(e: { target: { value: string; }; }) => setCurrency(e.target.value.toUpperCase())}
                  required
                />
              </div>
            </form>
          </FormDialogBody>
          <FormDialogFooter>
            <FormDialogClose asChild>
              <Button type="button" variant="secondary" onClick={resetForm}>
                {fa ? 'لغو' : 'Cancel'}
              </Button>
            </FormDialogClose>
            <Button type="submit" form="trip-form" loading={busy} disabled={busy}>
              {editing
                ? fa ? 'ذخیره' : 'Save'
                : fa ? 'ساخت' : 'Create'}
            </Button>
          </FormDialogFooter>
        </FormDialogContent>
      </FormDialogRoot>

      {/* Trip cards */}
      {active.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/40 p-8 text-center">
          <h3 className="text-lg font-semibold">
            {fa ? 'هنوز سفری وجود ندارد' : 'No trips yet'}
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            {fa
              ? 'اولین سفر خود را ایجاد کنید.'
              : 'Create your first trip to start tracking expenses.'}
          </p>
          {canCreateTrip && (
            <Button className="mt-4" onClick={() => { resetForm(); setShowForm(true); }}>
              <Plus size={16} className="me-1.5" />
              {fa ? 'ساخت سفر' : 'Create trip'}
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {active.map((trip) => (
            <div
              key={trip.id}
              className={`rounded-2xl border p-5 transition ${
                trip.id === selectedTrip?.id
                  ? 'border-indigo-300 bg-indigo-500/10'
                  : 'border-border bg-card/60'
              }`}
            >
              <p className="text-lg font-semibold text-foreground">
                {trip.name}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {trip.currency}
                {' • '}
                {trip.role === 'owner' 
                  ? fa ? 'مدیر' : 'Owner'
                  : fa ? 'عضو' : 'Member'}
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <Button onClick={() => choose(trip.id)} disabled={busy}>
                  {fa ? 'ورود به سفر' : 'Open trip'}
                </Button>
                {(trip.role === 'owner' || isAdmin) && (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => beginEdit(trip)}
                      disabled={busy}
                    >
                      <Pencil size={14} className="me-1" />
                      {fa ? 'ویرایش' : 'Edit'}
                    </Button>
                    <Button
                      variant="destructive"
                      disabled={busy || trip.id === selectedTrip?.id}
                      title={trip.id === selectedTrip?.id ? (fa ? 'سفر فعال قابل حذف نیست' : 'Cannot delete active trip') : undefined}
                      onClick={() => deleteCurrentTrip(trip.id)}
                    >
                      <Trash2 size={14} className="me-1" />
                      {fa ? 'حذف' : 'Delete'}
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))}

          {/* Add new trip card */}
          {canCreateTrip && (
            <button
              onClick={() => { resetForm(); setShowForm(true); }}
              className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-card/30 p-5 text-muted-foreground transition hover:border-indigo-300 hover:bg-indigo-500/5 hover:text-indigo-600"
            >
              <Plus size={24} />
              <span className="text-sm font-semibold">
                {fa ? 'سفر جدید' : 'New trip'}
              </span>
            </button>
          )}
        </div>
      )}

      <button
        onClick={logout}
        className="text-sm text-muted-foreground underline transition hover:text-foreground"
      >
        {fa ? 'خروج از حساب' : 'Log out'}
      </button>
    </div>
  );
}
