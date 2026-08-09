import { useState, type SetStateAction } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LayoutGrid, List, Plus } from 'lucide-react';
import { depositsApi, membersApi, type Deposit } from '../api/services';
import { gregorianToJalali } from '../utils/jalaali';
import JalaliDatePicker from '../components/JalaliDatePicker';
import { useAuth } from '../contexts/AuthContext';
import { usePreferences } from '../contexts/PreferencesContext';
import { useConfirm } from '../components/ConfirmDialog';
import { formatAmount, parseMoney } from '../utils/format';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Button,
  Input,
  Label,
  Select
} from '../components/ui/core';

export default function Deposits() {

  const { language } = usePreferences();
  const fa = language === 'fa';
  const confirm = useConfirm();

  const fmt = (v: number) =>
    `$${v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const { isOwner } = useAuth();
  const queryClient = useQueryClient();

  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [memberId, setMemberId] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0,10));
  const [editing, setEditing] = useState<Deposit | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'card' | 'table'>(() =>
    typeof window !== 'undefined' && window.innerWidth >= 768 ? 'table' : 'card'
  );
  const [showForm, setShowForm] = useState(false);


  const { data: deposits } = useQuery({
    queryKey: ['deposits'],
    queryFn: depositsApi.getAll
  });

  const { data: members } = useQuery({
    queryKey: ['members'],
    queryFn: membersApi.getAll
  });


  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['deposits'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  };


  const clear = () => {
    setAmount('');
    setNote('');
    setMemberId('');
    setDate(new Date().toISOString().slice(0,10));
    setEditing(null);
    setShowForm(false);
  };


  const create = useMutation({
    mutationFn: depositsApi.create,
    onSuccess: () => {
      refresh();
      clear();
    }
  });


  const update = useMutation({
    mutationFn: ({ id, data }: any) => depositsApi.update(id, data),
    onSuccess: () => {
      refresh();
      clear();
    }
  });


  const remove = useMutation({
    mutationFn: depositsApi.delete,
    onSuccess: refresh
  });


  const submit = (event: React.FormEvent) => {
    event.preventDefault();

    const data = {
      member_id: memberId,
      amount: parseMoney(amount) || 0,
      note,
      date
    };

    if (!memberId || !data.amount)
      return;

    editing
      ? update.mutate({ id: editing.id, data })
      : create.mutate(data);
  };

  const submitting = create.isPending || update.isPending;


  return (
    <div dir={fa ? 'rtl' : 'ltr'} className="space-y-6">

      <div>

        <h1 className="page-title">
          {fa ? 'واریزی‌ها' : 'Deposits'}
        </h1>

        <p className="page-subtitle">
          {
            fa
              ? 'اینجا می‌تونی پول‌هایی که اعضا برای سفر واریز کردن رو ثبت و مدیریت کنی.'
              : 'Log contributions and keep the shared budget current.'
          }
        </p>

      </div>


      {isOwner && !showForm && !editing && (
        <Button onClick={() => setShowForm(true)} className="w-full">
          <Plus size={18} className="me-1" />
          {fa ? 'افزودن واریزی جدید' : 'Add new deposit'}
        </Button>
      )}

      {isOwner && (showForm || editing) &&

      <Card>

        <CardHeader>

          <CardTitle>
            {
              editing
                ? (fa ? 'ویرایش واریزی' : 'Edit deposit')
                : (fa ? 'ثبت واریزی جدید' : 'Add new deposit')
            }
          </CardTitle>

        </CardHeader>


        <CardContent>

          <form
            onSubmit={submit}
            className="form-grid sm:grid-cols-2 xl:grid-cols-3"
          >

            <div>
              <Label htmlFor="deposit-member">
                {fa ? 'عضو' : 'Member'}
              </Label>

              <Select
                id="deposit-member"
                value={memberId}
                onChange={(e: { target: { value: SetStateAction<string>; }; }) => setMemberId(e.target.value as string)}
                required
              >
                <option value="">
                  {fa ? 'انتخاب عضو' : 'Select member'}
                </option>

                {
                  members?.data
                    ?.filter(m => m.active !== false || m.id === memberId)
                    .map(m =>
                      <option key={m.id} value={m.id}>
                        {m.display_name || m.name}
                      </option>
                    )
                }
              </Select>
            </div>

            <div>
              <Label htmlFor="deposit-amount">
                {fa ? 'مبلغ' : 'Amount'}
              </Label>

              <Input
                id="deposit-amount"
                type="text"
                inputMode="decimal"
                value={amount}
                onChange={(e: { target: { value: SetStateAction<string>; }; }) =>
                  setAmount(formatAmount(e.target.value as string))
                }
                required
              />
            </div>

            <div>
              <Label htmlFor="deposit-note">
                {fa ? 'توضیحات (اختیاری)' : 'Note (optional)'}
              </Label>

              <Input
                id="deposit-note"
                value={note}
                onChange={(e: { target: { value: SetStateAction<string>; }; }) => setNote(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="deposit-date">
                {fa ? 'تاریخ' : 'Date'}
              </Label>
              <JalaliDatePicker id="deposit-date" value={date} onChange={(iso: string) => setDate(iso)} />
            </div>

            <div className="flex flex-wrap items-end gap-2 pb-1">
              <Button type="submit" loading={submitting}>
                {
                  editing
                    ? (fa ? 'ذخیره تغییرات' : 'Save changes')
                    : (fa ? 'ثبت واریزی' : 'Add deposit')
                }
              </Button>

              {
                editing &&
                <Button
                  type="button"
                  variant="outline"
                  onClick={clear}
                >
                  {fa ? 'لغو' : 'Cancel'}
                </Button>
              }
            </div>

          </form>

        </CardContent>

      </Card>
      }



      <Card>
        <CardContent className="pt-6">
          <div className="mb-4 flex items-center justify-end gap-1 mt-3">
            <button
              onClick={() => setViewMode('card')}
              className={`rounded-lg p-2 transition ${viewMode === 'card' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent'}`}
              aria-label={fa ? 'نمایش کارتی' : 'Card view'}
            >
              <LayoutGrid size={18} />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`rounded-lg p-2 transition ${viewMode === 'table' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent'}`}
              aria-label={fa ? 'نمایش جدولی' : 'Table view'}
            >
              <List size={18} />
            </button>
          </div>

          {viewMode === 'table' ? (
            <Table>
              <Thead>
                <Tr>
                  <Th>{fa ? 'تاریخ' : 'Date'}</Th>
                  <Th>{fa ? 'عضو' : 'Member'}</Th>
                  <Th>{fa ? 'توضیحات' : 'Note'}</Th>
                  <Th>{fa ? 'مبلغ' : 'Amount'}</Th>
                  {isOwner && <Th>{fa ? 'عملیات' : 'Action'}</Th>}
                </Tr>
              </Thead>
              <Tbody>
                {deposits?.data?.map(d => (
                  <Tr key={d.id}>
                    <Td>{d.date ? gregorianToJalali(d.date) : gregorianToJalali(d.created_at)}</Td>
                    <Td>{d.member_display_name || d.member_name}</Td>
                    <Td>{d.note || '-'}</Td>
                    <Td className="font-medium text-green-600">{fmt(d.amount)}</Td>
                    {isOwner && (
                      <Td>
                        <div className="flex gap-2">
                           <Button variant="outline" onClick={() => {
                            setEditing(d); setMemberId(d.member_id); setAmount(formatAmount(String(d.amount)));
                            setNote(d.note || ''); setDate(d.date ? d.date.slice(0,10) : d.created_at.slice(0,10));
                            setShowForm(true);
                          }}>{fa ? 'ویرایش' : 'Edit'}</Button>
                          <Button variant="destructive" loading={deletingId === d.id} disabled={deletingId === d.id}
                            onClick={async () => {
                              if (deletingId) return;
                              if (!await confirm(
                                fa ? 'حذف واریزی' : 'Delete deposit',
                                fa ? 'از حذف این واریزی مطمئنی؟ این عمل قابل بازگشت نیست.' : 'Are you sure you want to delete this deposit? This action cannot be undone.'
                              )) return;
                              try { setDeletingId(d.id); await remove.mutateAsync(d.id); } finally { setDeletingId(null); }
                            }}
                          >{fa ? 'حذف' : 'Delete'}</Button>
                        </div>
                      </Td>
                    )}
                  </Tr>
                ))}
              </Tbody>
            </Table>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {deposits?.data?.map(d => (
                <div key={d.id} className="rounded-xl border border-border bg-card/60 p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-foreground">{d.member_display_name || d.member_name}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {d.date ? gregorianToJalali(d.date) : gregorianToJalali(d.created_at)}
                        {d.note && <>{' · '}{d.note}</>}
                      </p>
                    </div>
                    <span className="shrink-0 text-sm font-bold text-green-600">{fmt(d.amount)}</span>
                  </div>
                  {isOwner && (
                    <div className="mt-3 flex gap-2 border-t border-border pt-3">
                      <Button variant="outline" size="sm" onClick={() => {
                        setEditing(d); setMemberId(d.member_id); setAmount(formatAmount(String(d.amount)));
                        setNote(d.note || ''); setDate(d.date ? d.date.slice(0,10) : d.created_at.slice(0,10));
                        setShowForm(true);
                      }}>{fa ? 'ویرایش' : 'Edit'}</Button>
                      <Button variant="destructive" size="sm" loading={deletingId === d.id} disabled={deletingId === d.id}
                        onClick={async () => {
                          if (deletingId) return;
                          if (!await confirm(
                            fa ? 'حذف واریزی' : 'Delete deposit',
                            fa ? 'از حذف این واریزی مطمئنی؟ این عمل قابل بازگشت نیست.' : 'Are you sure you want to delete this deposit? This action cannot be undone.'
                          )) return;
                          try { setDeletingId(d.id); await remove.mutateAsync(d.id); } finally { setDeletingId(null); }
                        }}
                      >{fa ? 'حذف' : 'Delete'}</Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}