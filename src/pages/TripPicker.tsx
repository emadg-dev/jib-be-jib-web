import { useState, type SetStateAction } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { usePreferences } from '../contexts/PreferencesContext';
import type { Trip } from '../api/services';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input
} from '../components/ui/core';

export default function TripPicker() {
  const {
    trips,
    selectedTrip,
    selectTrip,
    createTrip,
    updateTrip,
    logout,
    isOwner
  } = useAuth();

  const { language } = usePreferences();
  const fa = language === 'fa';

  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);

  const active = trips.filter(t => t.active !== false);

  const choose = async (id: string, goToDashboard = true) => {
    setBusy(true);

    try {
      await selectTrip(id);

      if (goToDashboard)
        navigate('/dashboard');
    }
    finally {
      setBusy(false);
    }
  };

  const beginEdit = async (trip: Trip) => {
    await choose(trip.id, false);

    setName(trip.name);
    setCurrency(trip.currency);

    setCreating(false);
    setEditing(true);
  };

  const save = async (
    event: React.FormEvent,
    create = false
  ) => {
    event.preventDefault();

    setBusy(true);

    try {

      if (create)
        await createTrip({ name, currency });
      else
        await updateTrip({ name, currency });

      setEditing(false);
      setCreating(false);

      if (create)
        navigate('/dashboard');
    }
    finally {
      setBusy(false);
    }
  };

  return (
    <div
      dir={fa ? 'rtl' : 'ltr'}
      className="flex min-h-screen items-center justify-center p-4"
    >

      <Card className="w-full max-w-3xl">

        <CardHeader>

          <CardTitle className="text-2xl">

            {fa ? 'سفرهای من' : 'Your Trips'}

          </CardTitle>

          <p className="page-subtitle">

            {
              fa
                ? 'یکی از سفرها رو انتخاب کن تا هزینه‌ها، اعضا و حساب‌هاش رو ببینی.'
                : 'Choose a trip to manage its budget, members and expenses.'
            }

          </p>

        </CardHeader>


        <CardContent className="space-y-5">

          {editing && selectedTrip && isOwner && (

            <div className="rounded-2xl border border-indigo-200/40 bg-indigo-500/5 p-4">

              <p className="mb-4 text-sm font-semibold text-indigo-600">

                {fa
                  ? `ویرایش ${selectedTrip.name}`
                  : `Edit ${selectedTrip.name}`}

              </p>

              <TripForm
                fa={fa}
                name={name}
                currency={currency}
                setName={setName}
                setCurrency={setCurrency}
                onSubmit={(e) => save(e)}
                busy={busy}
                label={fa ? 'ذخیره تغییرات' : 'Save trip'}
              />

            </div>

          )}


          <div className="grid gap-4 md:grid-cols-2">

            {active.map(trip => (

              <div
                key={trip.id}
                className={`
                  rounded-2xl
                  border
                  p-5
                  transition
                  ${
                    trip.id === selectedTrip?.id
                      ? 'border-indigo-300 bg-indigo-500/10'
                      : 'border-border bg-card/60'
                  }
                `}
              >

                <p className="text-lg font-semibold text-foreground">

                  {trip.name}

                </p>

                <p className="mt-1 text-sm text-muted-foreground">

                  {trip.currency}
                  {' • '}
                  {
                    trip.role === 'owner'
                      ? (fa ? 'مدیر' : 'Owner')
                      : (fa ? 'عضو' : 'Member')
                  }

                </p>

                <div className="mt-5 flex flex-wrap gap-2">

                  <Button
                    onClick={() => choose(trip.id)}
                    disabled={busy}
                  >
                    {fa ? 'ورود به سفر' : 'Open trip'}
                  </Button>


                  {trip.role === 'owner' && (

                    <>
                      <Button
                        variant="outline"
                        onClick={() => beginEdit(trip)}
                        disabled={busy}
                      >
                        {fa ? 'ویرایش' : 'Edit'}
                      </Button>

                      {/* TODO: Implement delete */}
                      <Button
                        variant="destructive"
                        disabled={busy}
                        onClick={() => {
                          console.log('Delete trip', trip.id);
                        }}
                      >
                        <Trash2 size={16} />
                        {fa ? 'حذف' : 'Delete'}
                      </Button>
                    </>

                  )}

                </div>

              </div>

            ))}

          </div>


          {isOwner && (

            <div className="border-t border-border pt-5">

              <button
                className="text-sm font-semibold text-indigo-600 hover:text-indigo-500"
                onClick={() => {
                  setEditing(false);
                  setCreating(v => !v);
                }}
              >

                {
                  creating
                    ? (fa ? 'لغو' : 'Cancel')
                    : (fa ? 'یه سفر جدید بساز' : 'Create a new trip')
                }

              </button>


              {creating && (

                <TripForm
                  fa={fa}
                  name={name}
                  currency={currency}
                  setName={setName}
                  setCurrency={setCurrency}
                  onSubmit={(e) => save(e, true)}
                  busy={busy}
                  label={fa ? 'ساخت سفر' : 'Create trip'}
                />

              )}

            </div>

          )}


          <button
            onClick={logout}
            className="text-sm text-muted-foreground underline transition hover:text-foreground"
          >
            {fa ? 'خروج از حساب' : 'Log out'}
          </button>

        </CardContent>

      </Card>

    </div>
  );
}

type TripFormProps = {
  fa: boolean;
  name: string;
  currency: string;
  setName: React.Dispatch<React.SetStateAction<string>>;
  setCurrency: React.Dispatch<React.SetStateAction<string>>;
  onSubmit: (event: React.FormEvent) => void;
  busy: boolean;
  label: string;
};

function TripForm({
  fa,
  name,
  currency,
  setName,
  setCurrency,
  onSubmit,
  busy,
  label
}: TripFormProps) {

  return (

    <form
      onSubmit={onSubmit}
      className="mt-4 grid gap-3 md:grid-cols-[1fr_120px_auto]"
    >

      <Input
        value={name}
        placeholder={fa ? 'اسم سفر' : 'Trip name'}
        onChange={(e: { target: { value: SetStateAction<string>; }; }) => setName(e.target.value)}
        required
      />

      <Input
        value={currency}
        placeholder={fa ? 'USD' : 'USD'}
        maxLength={3}
        onChange={(e: { target: { value: string; }; }) =>
          setCurrency(e.target.value.toUpperCase())
        }
        required
      />

      <Button
        type="submit"
        disabled={busy}
      >
        {label}
      </Button>

    </form>

  );
}