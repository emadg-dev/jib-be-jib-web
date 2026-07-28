import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import type { Trip } from '../api/services';
import { Button, Card, CardContent, CardHeader, CardTitle, Input } from '../components/ui/core';

export default function TripPicker() {
  const { trips, selectedTrip, selectTrip, createTrip, updateTrip, logout, isOwner } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState(''); const [currency, setCurrency] = useState('USD'); const [creating, setCreating] = useState(false); const [editing, setEditing] = useState(false); const [busy, setBusy] = useState(false);
  const active = trips.filter(trip => trip.active !== false);
  const choose = async (id: string, goToDashboard = true) => { setBusy(true); try { await selectTrip(id); if (goToDashboard) navigate('/dashboard'); } finally { setBusy(false); } };
  const beginEdit = async (trip: Trip) => { await choose(trip.id, false); setName(trip.name); setCurrency(trip.currency); setCreating(false); setEditing(true); };
  const save = async (event: React.FormEvent, create = false) => { event.preventDefault(); setBusy(true); try { create ? await createTrip({ name, currency }) : await updateTrip({ name, currency }); setEditing(false); setCreating(false); if (create) navigate('/dashboard'); } finally { setBusy(false); } };
  return <div className="flex min-h-screen items-center justify-center p-4"><Card className="w-full max-w-2xl"><CardHeader><CardTitle className="text-2xl">Your trips</CardTitle><p className="text-sm text-slate-500">Choose a trip to open its budget, members, and expenses.</p></CardHeader><CardContent className="space-y-4">
    {editing && selectedTrip && isOwner && <div className="rounded-2xl border border-indigo-100 bg-indigo-50/45 p-4"><p className="mb-3 text-sm font-semibold text-indigo-700">Edit {selectedTrip.name}</p><TripForm name={name} currency={currency} setName={setName} setCurrency={setCurrency} onSubmit={event => save(event)} busy={busy} label="Save trip" /></div>}
    <div className="grid gap-3 sm:grid-cols-2">{active.map(trip => <div key={trip.id} className={`rounded-2xl border p-5 ${trip.id === selectedTrip?.id ? 'border-indigo-200 bg-indigo-50/45' : 'border-white/80 bg-white/50'}`}><p className="font-semibold text-slate-900">{trip.name}</p><p className="mt-1 text-sm text-slate-500">{trip.currency} · {trip.role || 'member'}</p><div className="mt-4 flex gap-2"><Button onClick={() => choose(trip.id)} disabled={busy}>Select trip</Button>{trip.role === 'owner' && <Button variant="outline" onClick={() => beginEdit(trip)} disabled={busy}>Edit</Button>}</div></div>)}</div>
    {isOwner && <div className="border-t border-white/70 pt-5"><button onClick={() => { setEditing(false); setCreating(value => !value); }} className="text-sm font-semibold text-indigo-600">{creating ? 'Cancel' : 'Create a new trip'}</button>{creating && <TripForm name={name} currency={currency} setName={setName} setCurrency={setCurrency} onSubmit={event => save(event, true)} busy={busy} label="Create trip" />}</div>}
    <button onClick={logout} className="text-sm text-slate-500 underline">Log out</button></CardContent></Card></div>;
}
function TripForm({ name, currency, setName, setCurrency, onSubmit, busy, label }: any) { return <form onSubmit={onSubmit} className="mt-4 grid gap-3 sm:grid-cols-[1fr_9rem_auto]"><Input value={name} onChange={(event: any) => setName(event.target.value)} placeholder="Trip name" required /><Input value={currency} onChange={(event: any) => setCurrency(event.target.value.toUpperCase())} maxLength={3} required /><Button type="submit" disabled={busy}>{label}</Button></form>; }
