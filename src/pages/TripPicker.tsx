import { useState, type SetStateAction } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, Plus, Pencil } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { usePreferences } from '../contexts/PreferencesContext';
import { useConfirm } from '../components/ConfirmDialog';
import type { Trip } from '../api/services';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
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

  const { language } = usePreferences();
  const fa = language === 'fa';
  const confirm = useConfirm();

  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [editing, setEditing] = useState<Trip | null>(null);
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState(false);

  const active = trips.filter((t) => t.active !== false);

  const resetForm = () => {
    setName('');
    setCurrency('USD');
    setEditing(null);
    setCreating(false);
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
    setCreating(false);
    setEditing(trip);
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
      } else {
        await createTrip({ name, currency });
      }
      resetForm();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div dir={fa ? 'rtl' : 'ltr'} className="mx-auto max-w-3xl space-y-6">
      <CardHeader className="px-0">
        <CardTitle className="text-2xl">
          {fa ? 'سفرهای من' : 'Your Trips'}
        </CardTitle>
        <p className="page-subtitle">
          {fa
            ? 'یکی از سفرها رو انتخاب کن تا هزینه‌ها، اعضا و حساب‌هاش رو ببینی.'
            : 'Choose a trip to manage its budget, members and expenses.'}
        </p>
      </CardHeader>

      {/* Create / Edit form */}
      {(creating || editing) && (
        <Card>
          <CardContent className="pt-6">
            <p className="mb-4 text-lg font-semibold text-indigo-600 mt-2">
              {editing
                ? fa
                  ? `ویرایش ${editing.name}`
                  : `Edit ${editing.name}`
                : fa
                  ? 'سفر جدید'
                  : 'New trip'}
            </p>
            <form onSubmit={save} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="trip-name">
                  {fa ? 'اسم سفر' : 'Trip name'}
                </Label>
                <Input
                  id="trip-name"
                  value={name}
                  placeholder={fa ? 'مثلاً سفر شمال' : 'e.g. Summer trip'}
                  onChange={(e: { target: { value: SetStateAction<string>; }; }) => setName(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="trip-currency">
                  {fa ? 'واحد پول' : 'Currency'}
                </Label>
                <Input
                  id="trip-currency"
                  value={currency}
                  placeholder="T"
                  maxLength={3}
                  onChange={(e: { target: { value: string; }; }) => setCurrency(e.target.value.toUpperCase())}
                  required
                />
              </div>
              <div className="flex gap-2 sm:col-span-2">
                <Button type="submit" disabled={busy}>
                  {editing
                    ? fa ? 'ذخیره تغییرات' : 'Save changes'
                    : fa ? 'ساخت سفر' : 'Create trip'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  {fa ? 'لغو' : 'Cancel'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Trip cards */}
      {active.length === 0 && !creating ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/40 p-8 text-center">
          <h3 className="text-lg font-semibold">
            {fa ? 'هنوز سفری وجود ندارد' : 'No trips yet'}
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            {fa
              ? 'اولین سفر خود را ایجاد کنید.'
              : 'Create your first trip to start tracking expenses.'}
          </p>
          {isOwner && (
            <Button className="mt-4" onClick={() => { resetForm(); setCreating(true); }}>
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
          {isOwner && !creating && (
            <button
              onClick={() => { resetForm(); setCreating(true); }}
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
