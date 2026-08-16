import { useState, type SetStateAction } from 'react';
import { translateError } from '../utils/translations';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { LayoutGrid, List, Plus } from 'lucide-react';
import Avatar from '../components/Avatar';

import {
  withdrawalsApi,
  membersApi,
  type Withdrawal,
} from '../api/services';

import { useAuth } from '../contexts/AuthContext';
import { usePreferences } from '../contexts/PreferencesContext';
import { useConfirm } from '../components/ConfirmDialog';
import { usePermissions } from '../hooks/usePermissions';
import { formatAmount, parseMoney } from '../utils/format';
import { gregorianToJalali } from '../utils/jalaali';
import JalaliDatePicker from '../components/JalaliDatePicker';
import { PageSkeleton } from '../components/Skeleton';

import {
  Card,
  CardContent,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Button,
  Input,
  Label,
  Select,
  Checkbox,
} from '../components/ui/core';
import {
  FormDialogRoot,
  FormDialogContent,
  FormDialogHeader,
  FormDialogTitle,
  FormDialogBody,
  FormDialogFooter,
  FormDialogClose,
} from '../components/ui/FormDialog';

type Shares = Record<string, string>;

export default function Withdrawals() {
  const { isOwner, user } = useAuth();
  const { hasPermission } = usePermissions();
  const { language } = usePreferences();
  const fa = language === 'fa';
  const confirm = useConfirm();

  const canCreate = isOwner || hasPermission('withdrawal.create');
  const canUpdate = isOwner || hasPermission('withdrawal.update');
  const canDelete = isOwner || hasPermission('withdrawal.delete');

  const fmt = (v: number) =>
    `$${v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const queryClient = useQueryClient();

  const { data: withdrawals, isLoading: isLoadingWithdrawals } = useQuery({
    queryKey: ['withdrawals'],
    queryFn: withdrawalsApi.getAll,
  });

  const { data: members } = useQuery({
    queryKey: ['members'],
    queryFn: membersApi.getAll,
  });

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const showSuccess = (msg: string) => { setMessage(msg); setError(''); };
  const showError = (err: any) => {
    const raw = err?.message || 'Something went wrong';
    setError(translateError(raw, fa));
    setMessage('');
  };

  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0,10));
  const [paidBy, setPaidBy] = useState<string>('');
  const [selected, setSelected] = useState<string[]>([]);
  const [shares, setShares] = useState<Shares>({});
  const [editing, setEditing] = useState<Withdrawal | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'card' | 'table'>(() =>
    typeof window !== 'undefined' && window.innerWidth >= 768 ? 'table' : 'card'
  );
  const [showForm, setShowForm] = useState(false);
  const [formError, setFormError] = useState('');

  const active =
    members?.data?.filter((member) => member.active !== false) || [];

  const refresh = () => {
    queryClient.invalidateQueries({
      queryKey: ['withdrawals'],
    });

    queryClient.invalidateQueries({
      queryKey: ['dashboard'],
    });
  };

  const clear = () => {
    setDescription('');
    setCategory('');
    setAmount('');
    setDate(new Date().toISOString().slice(0,10));
    setPaidBy('');
    setSelected([]);
    setShares({});
    setEditing(null);
    setShowForm(false);
    setFormError('');
  };

  const create = useMutation({
    mutationFn: withdrawalsApi.create,
    onSuccess: () => {
      refresh();
      clear();
      showSuccess(fa ? 'خرج با موفقیت ثبت شد.' : 'Expense recorded successfully.');
    },
    onError: (err: any) => showError(err),
  });

  const update = useMutation({
    mutationFn: ({ id, data }: any) =>
      withdrawalsApi.update(id, data),
    onSuccess: () => {
      refresh();
      clear();
      showSuccess(fa ? 'خرج با موفقیت ویرایش شد.' : 'Expense updated successfully.');
    },
    onError: (err: any) => showError(err),
  });

  const remove = useMutation({
    mutationFn: withdrawalsApi.delete,
    onSuccess: () => {
      refresh();
      showSuccess(fa ? 'خرج با موفقیت حذف شد.' : 'Expense deleted successfully.');
    },
    onError: (err: any) => showError(err),
  });

  const toggle = (id: string) => {
    setSelected((current) => {
      const next = current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id];
      setShares((s) => distribute(parseMoney(amount) || 0, next, s));
      return next;
    });
  };

  const amountChange = (val: string) => {
    const formatted = formatAmount(val);
    setAmount(formatted);
    setShares((s) => distribute(parseMoney(formatted) || 0, selected, s));
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();

    const total = parseMoney(amount) || 0;

    if (!total || !selected.length) {
      return;
    }

    const entered = selected.reduce(
      (sum, id) => sum + (parseMoney(shares[id]) || 0),
      0
    );

    const blank = selected.filter((id) => !shares[id]);

    if (
      entered > total ||
      (!blank.length && Math.abs(entered - total) > 0.01)
    ) {
      setFormError(
        fa
          ? 'سهم هر نفر باید با مبلغ کل برابر باشه.'
          : 'Beneficiary shares must equal the total amount.'
      );
      return;
    }

    const equal = blank.length
      ? Number(((total - entered) / blank.length).toFixed(2))
      : 0;

    let remainder = Number(
      (total - entered - equal * blank.length).toFixed(2)
    );

    const beneficiaries = selected.map((id) => {
      const share = shares[id]
        ? parseMoney(shares[id])
        : equal + remainder;

      remainder = 0;

      return {
        member_id: id,
        share,
      };
    });

    const data = {
      description,
      category,
      amount: total,
      paid_by: paidBy || null,
      beneficiaries,
      date
    };

    if (editing) {
      update.mutate({
        id: editing.id,
        data,
      });
    } else {
      create.mutate(data);
    }
  };

  const submitting = create.isPending || update.isPending;

  const distribute = (
    total: number,
    sel: string[],
    s: Shares
  ) => {
    const blank = sel.filter((id) => !s[id]);
    if (!blank.length) return s;

    const entered = sel.reduce(
      (sum, id) => sum + (parseMoney(s[id]) || 0),
      0
    );

    if (entered >= total) return s;

    const each = Number(
      ((total - entered) / blank.length).toFixed(2)
    );

    let remainder = Number(
      (total - entered - each * blank.length).toFixed(2)
    );

    const next = { ...s };
    blank.forEach((id) => {
      next[id] = formatAmount(
        String(each + (blank.indexOf(id) === 0 ? remainder : 0))
      );
    });
    return next;
  };

  const distributeEvenly = () => {
    const total = parseMoney(amount) || 0;
    if (!total || !selected.length) return;
    const each = Math.floor((total / selected.length) * 100) / 100;
    const remainder = Math.round((total - each * selected.length) * 100) / 100;
    const next: Shares = {};
    selected.forEach((id, i) => {
      next[id] = formatAmount(String(each + (i === 0 ? remainder : 0)));
    });
    setShares(next);
  };

  const edit = (withdrawal: Withdrawal) => {
    setEditing(withdrawal);
    setDescription(withdrawal.description);
    setCategory(withdrawal.category);
    setAmount(formatAmount(String(withdrawal.amount)));
    setDate(withdrawal.date ? withdrawal.date.slice(0,10) : withdrawal.created_at.slice(0,10));
    setPaidBy(withdrawal.paid_by || '');

    const sel = withdrawal.beneficiaries.map(
      (beneficiary) => beneficiary.member_id
    );
    setSelected(sel);
    setShares({});
  };

  const categories = [
    {
      value: 'Food',
      label: fa ? 'غذا' : 'Food',
    },
    {
      value: 'Accommodation',
      label: fa ? 'اقامت' : 'Accommodation',
    },
    {
      value: 'Transport',
      label: fa ? 'حمل‌ونقل' : 'Transport',
    },
    {
      value: 'Activities',
      label: fa ? 'تفریحات' : 'Activities',
    },
    {
      value: 'Other',
      label: fa ? 'سایر' : 'Other',
    },
  ];

  if (isLoadingWithdrawals) return <div dir={fa ? 'rtl' : 'ltr'}><PageSkeleton /></div>;

  return (
    <div dir={fa ? 'rtl' : 'ltr'} className="space-y-6">
      <div>
        <h1 className="page-title">
          {fa ? 'خرج‌ها' : 'Expenses'}
        </h1>

        <p className="page-subtitle">
          {fa
            ? 'اینجا می‌تونی خرج‌های مشترک سفر رو ثبت کنی و منصفانه بین اعضا تقسیمشون کنی.'
            : 'Record shared costs and split them fairly.'}
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

      {canCreate && !showForm && !editing && (
        <Button onClick={() => setShowForm(true)} >
          <Plus size={16} className="me-1" />
          {fa ? 'ثبت خرج جدید' : 'Record new expense'}
        </Button>
      )}

      <FormDialogRoot open={showForm || !!editing} onOpenChange={(open) => { if (!open) clear(); }}>
        <FormDialogContent className="max-w-lg">
          <FormDialogHeader>
            <FormDialogTitle>
              {editing
                ? fa ? 'ویرایش خرج' : 'Edit expense'
                : fa ? 'یه خرج جدید ثبت کن' : 'Record expense'}
            </FormDialogTitle>
          </FormDialogHeader>

          <FormDialogBody>
            <form id="withdrawal-form" onSubmit={submit} className="space-y-3">
              {formError && (
                <div className="rounded-xl bg-rose-50 p-2 text-sm text-rose-700 dark:bg-rose-900/30 dark:text-rose-400">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">

                <div className="sm:col-span-2">
                  <Label htmlFor="withdrawal-description" className="text-xs">
                    {fa ? 'توضیحات' : 'Description'}
                  </Label>
                  <Input
                    id="withdrawal-description"
                    value={description}
                    onChange={(event: { target: { value: SetStateAction<string>; }; }) =>
                      setDescription(event.target.value)
                    }
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="withdrawal-category" className="text-xs">
                    {fa ? 'دسته‌بندی' : 'Category'}
                  </Label>
                  <Select
                    id="withdrawal-category"
                    value={category}
                    onChange={(event: { target: { value: SetStateAction<string>; }; }) =>
                      setCategory(event.target.value)
                    }
                    required
                  >
                    <option value="">
                      {fa ? 'یه دسته انتخاب کن' : 'Select category'}
                    </option>
                    {categories.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </Select>
                </div>

                <div>
                  <Label htmlFor="withdrawal-amount" className="text-xs">
                    {fa ? 'مبلغ کل' : 'Total amount'}
                  </Label>
                  <Input
                    id="withdrawal-amount"
                    type="text"
                    inputMode="decimal"
                    value={amount}
                    onChange={(event: { target: { value: SetStateAction<string>; }; }) =>
                      amountChange(event.target.value as string)
                    }
                    required
                  />
                </div>

                
                <div>
                  <Label htmlFor="withdrawal-date" className="text-xs">
                    {fa ? 'تاریخ' : 'Date'}
                  </Label>
                  <JalaliDatePicker id="withdrawal-date" value={date} onChange={(iso: string) => setDate(iso)} />
                </div>

                <div className="sm:col-span-2">
                  <Label htmlFor="withdrawal-paid-by" className="text-xs">
                    {fa ? 'پرداخت توسط' : 'Paid by'}
                  </Label>
                  <Select
                    id="withdrawal-paid-by"
                    value={paidBy}
                    onChange={(event: { target: { value: SetStateAction<string>; }; }) =>
                      setPaidBy(event.target.value)
                    }
                  >
                    <option value="">
                      {fa ? 'بانک (پیش‌فرض)' : 'Bank (default)'}
                    </option>
                    {active.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.display_name || member.name}
                      </option>
                    ))}
                  </Select>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {paidBy
                      ? (fa ? 'مبلغ توسط این عضو پرداخت شده و بانک به او بدهکار است.' : 'Paid by this member — bank owes them this amount.')
                      : (fa ? 'هزینه از حساب بانک پرداخت شده.' : 'Expense paid from the bank.')}
                  </p>
                </div>
              </div>

              <div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Label className="mb-0 text-xs">
                    {fa ? 'افرادی که استفاده کردن' : 'Beneficiaries'}
                  </Label>
                  <Checkbox
                    checked={active.length > 0 && selected.length === active.length}
                    onChange={() => {
                      const next = selected.length === active.length
                        ? []
                        : active.map((member) => member.id);
                      setSelected(next);
                      setShares((s) => distribute(Number(amount) || 0, next, s));
                    }}
                  >
                    {fa ? 'همه اعضای فعال' : 'All active'}
                  </Checkbox>
                </div>

                <p className="mt-0.5 text-xs text-muted-foreground">
                  {fa
                    ? 'اگه سهم کسی رو وارد نکنی، باقی مبلغ مساوی تقسیم میشه.'
                    : 'Leave a share blank to split the remainder equally.'}
                </p>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  disabled={!selected.length || !(parseMoney(amount) > 0)}
                  onClick={distributeEvenly}
                >
                  {fa ? 'تقسیم مساوی' : 'Distribute evenly'}
                </Button>

                <div className="mt-2 grid grid-cols-2 gap-1.5 sm:grid-cols-2">
                  {active.map((member) => {
                    const on = selected.includes(member.id);
                    return (
                      <div
                        key={member.id}
                        className={`flex items-center gap-1.5 rounded-lg border px-2 py-1.5 text-sm transition-colors ${
                          on
                            ? 'border-primary/40 bg-primary/5 ring-1 ring-primary/20'
                            : 'border-border opacity-80'
                        }`}
                      >
                        <Checkbox checked={on} onChange={() => toggle(member.id)} />
                        <span className="min-w-0 flex-1 font-medium text-foreground text-xs">
                          {member.display_name || member.name}
                        </span>
                        <Input
                          type="text"
                          inputMode="decimal"
                          disabled={!on}
                          value={shares[member.id] || ''}
                          onChange={(event: { target: { value: any; }; }) => {
                            const val = formatAmount(String(event.target.value || ''));
                            setShares((current) => {
                              const next = { ...current };
                              if (val) next[member.id] = val;
                              else delete next[member.id];
                              return distribute(parseMoney(amount) || 0, selected, next);
                            });
                          }}
                          className="h-7 w-[80px] shrink-0 text-right text-xs"
                          placeholder={fa ? 'سهم' : 'Share'}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </form>
          </FormDialogBody>

          <FormDialogFooter>
            <FormDialogClose asChild>
              <Button type="button" variant="secondary" onClick={clear}>
                {fa ? 'لغو' : 'Cancel'}
              </Button>
            </FormDialogClose>
            <Button type="submit" form="withdrawal-form" loading={submitting}>
              {editing
                ? fa ? 'ذخیره تغییرات' : 'Save changes'
                : fa ? 'ثبت خرج' : 'Record expense'}
            </Button>
          </FormDialogFooter>
        </FormDialogContent>
      </FormDialogRoot>

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

          {withdrawals?.data?.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              {fa ? 'هنوز خرجی ثبت نشده.' : 'No expenses recorded yet.'}
            </p>
          ) : viewMode === 'table' ? (
            <Table className="w-full">
              <Thead>
                <Tr>
                  <Th>{fa ? 'تاریخ' : 'Date'}</Th>
                  <Th>{fa ? 'توضیحات' : 'Description'}</Th>
                  <Th>{fa ? 'دسته‌بندی' : 'Category'}</Th>
                  <Th>{fa ? 'بین چه کسانی تقسیم شده' : 'Split among'}</Th>
                  <Th>{fa ? 'مبلغ' : 'Amount'}</Th>
                  <Th>{fa ? 'پرداخت توسط' : 'Paid by'}</Th>
                  {(canUpdate || canDelete) && <Th>{fa ? 'عملیات' : 'Action'}</Th>}
                </Tr>
              </Thead>
              <Tbody>
                {withdrawals?.data?.map((w) => {
                  const isBeneficiary = w.beneficiaries.some(b => b.member_id === user?.id);
                  return (
                    <Tr key={w.id} className={isBeneficiary ? 'bg-primary/5 border-l-4 border-l-primary' : ''}>
                      <Td>{w.date ? gregorianToJalali(w.date) : gregorianToJalali(w.created_at)}</Td>
                      <Td>{w.description}</Td>
                      <Td>{categories.find((c) => c.value === w.category)?.label || w.category}</Td>
                      <Td>{w.beneficiaries.map((b) => b.member_display_name || b.member_name).join(', ')}</Td>
                      <Td className="font-medium text-red-600">{fmt(w.amount)}</Td>
                      <Td className="text-xs text-muted-foreground">{w.paid_by_name || (fa ? 'بانک' : 'Bank')}</Td>
                    {(canUpdate || canDelete) && (
                      <Td>
                        <div className="flex gap-2">
                           <Button variant="outline" onClick={() => { edit(w); setShowForm(true); }}>{fa ? 'ویرایش' : 'Edit'}</Button>
                          <Button
                            variant="destructive"
                            loading={deletingId === w.id}
                            disabled={deletingId === w.id}
                            onClick={async () => {
                              if (deletingId) return;
                              if (!await confirm(
                                fa ? 'حذف خرج' : 'Delete expense',
                                fa ? 'از حذف این خرج مطمئنی؟ این عمل قابل بازگشت نیست.' : 'Are you sure you want to delete this expense? This action cannot be undone.'
                              )) return;
                              try { setDeletingId(w.id); await remove.mutateAsync(w.id); } finally { setDeletingId(null); }
                            }}
                          >{fa ? 'حذف' : 'Delete'}</Button>
                        </div>
                      </Td>
                    )}
                  </Tr>
                  );
                })}
              </Tbody>
            </Table>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {withdrawals?.data?.map((w) => {
                const isBeneficiary = w.beneficiaries.some(b => b.member_id === user?.id);
                return (
                  <div key={w.id} className={`rounded-xl border bg-card/60 p-4 shadow-sm ${isBeneficiary ? 'border-primary ring-2 ring-primary/20' : 'border-border'}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-foreground">{w.description}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {w.date ? gregorianToJalali(w.date) : gregorianToJalali(w.created_at)}
                          {' · '}
                          {categories.find((c) => c.value === w.category)?.label || w.category}
                        </p>
                      </div>
                      <span className="shrink-0 text-sm font-bold text-red-600">{fmt(w.amount)}</span>
                    </div>
                    {w.paid_by_name && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {fa ? 'پرداخت توسط:' : 'Paid by:'} {w.paid_by_name}
                      </p>
                    )}
                    {w.beneficiaries.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {w.beneficiaries.map((b) => (
                          <span key={b.member_id} className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ${b.member_id === user?.id ? 'bg-primary/20 text-primary font-medium' : 'bg-muted text-muted-foreground'}`}>
                            <Avatar src={b.member_avatar} name={b.member_display_name || b.member_name} size={16} />
                            {b.member_display_name || b.member_name}
                          </span>
                        ))}
                      </div>
                    )}
                    {(canUpdate || canDelete) && (
                      <div className="mt-3 flex gap-2 border-t border-border pt-3">
                         <Button variant="outline" size="sm" onClick={() => { edit(w); setShowForm(true); }}>{fa ? 'ویرایش' : 'Edit'}</Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          loading={deletingId === w.id}
                          disabled={deletingId === w.id}
                          onClick={async () => {
                            if (deletingId) return;
                            if (!await confirm(
                              fa ? 'حذف خرج' : 'Delete expense',
                              fa ? 'از حذف این خرج مطمئنی؟ این عمل قابل بازگشت نیست.' : 'Are you sure you want to delete this expense? This action cannot be undone.'
                            )) return;
                            try { setDeletingId(w.id); await remove.mutateAsync(w.id); } finally { setDeletingId(null); }
                          }}
                        >{fa ? 'حذف' : 'Delete'}</Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}