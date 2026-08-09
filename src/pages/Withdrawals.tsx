import { useState, type SetStateAction } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  withdrawalsApi,
  membersApi,
  type Withdrawal,
} from '../api/services';

import { useAuth } from '../contexts/AuthContext';
import { usePreferences } from '../contexts/PreferencesContext';
import { useConfirm } from '../components/ConfirmDialog';
import { formatAmount, parseMoney } from '../utils/format';
import { gregorianToJalali } from '../utils/jalaali';
import JalaliDatePicker from '../components/JalaliDatePicker';

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
  Select,
  Checkbox,
} from '../components/ui/core';

type Shares = Record<string, string>;

export default function Withdrawals() {
  const { isOwner } = useAuth();
  const { language } = usePreferences();
  const fa = language === 'fa';
  const confirm = useConfirm();

  const fmt = (v: number) =>
    `$${v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const queryClient = useQueryClient();

  const { data: withdrawals } = useQuery({
    queryKey: ['withdrawals'],
    queryFn: withdrawalsApi.getAll,
  });

  const { data: members } = useQuery({
    queryKey: ['members'],
    queryFn: membersApi.getAll,
  });

  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0,10));
  const [selected, setSelected] = useState<string[]>([]);
  const [shares, setShares] = useState<Shares>({});
  const [editing, setEditing] = useState<Withdrawal | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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
    setSelected([]);
    setShares({});
    setEditing(null);
  };

  const create = useMutation({
    mutationFn: withdrawalsApi.create,
    onSuccess: () => {
      refresh();
      clear();
    },
  });

  const update = useMutation({
    mutationFn: ({ id, data }: any) =>
      withdrawalsApi.update(id, data),
    onSuccess: () => {
      refresh();
      clear();
    },
  });

  const remove = useMutation({
    mutationFn: withdrawalsApi.delete,
    onSuccess: refresh,
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
      return alert(
        fa
          ? 'سهم هر نفر باید با مبلغ کل برابر باشه.'
          : 'Beneficiary shares must equal the total amount.'
      );
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

  const edit = (withdrawal: Withdrawal) => {
    setEditing(withdrawal);
    setDescription(withdrawal.description);
    setCategory(withdrawal.category);
    setAmount(formatAmount(String(withdrawal.amount)));
    setDate(withdrawal.date ? withdrawal.date.slice(0,10) : withdrawal.created_at.slice(0,10));

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

      {isOwner && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editing
                ? fa
                  ? 'ویرایش خرج'
                  : 'Edit expense'
                : fa
                  ? 'یه خرج جدید ثبت کن'
                  : 'Record expense'}
            </CardTitle>
          </CardHeader>

          <CardContent>
            <form
              onSubmit={submit}
              className="space-y-5"
            >
               <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                <div>
                  <Label htmlFor="withdrawal-description">
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
                  <Label htmlFor="withdrawal-category">
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
                      {fa
                        ? 'یه دسته انتخاب کن'
                        : 'Select category'}
                    </option>

                    {categories.map((item) => (
                      <option
                        key={item.value}
                        value={item.value}
                      >
                        {item.label}
                      </option>
                    ))}
                  </Select>
                </div>

                <div>
                  <Label htmlFor="withdrawal-amount">
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
                  <Label htmlFor="withdrawal-date">
                    {fa ? 'تاریخ' : 'Date'}
                  </Label>
                  <JalaliDatePicker id="withdrawal-date" value={date} onChange={(iso: string) => setDate(iso)} />
                </div>
              </div>

              <div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Label className="mb-0">
                    {fa ? 'افرادی که استفاده کردن' : 'Beneficiaries'}
                  </Label>

                  <Checkbox
                    checked={
                      active.length > 0 &&
                      selected.length === active.length
                    }
                    onChange={() => {
                      const next =
                        selected.length === active.length
                          ? []
                          : active.map((member) => member.id);
                      setSelected(next);
                      setShares((s) =>
                        distribute(Number(amount) || 0, next, s)
                      );
                    }}
                  >
                    {fa
                      ? 'همه اعضای فعال'
                      : 'All active members'}
                  </Checkbox>
                </div>

                <p className="mt-1 text-xs text-muted-foreground">
                  {fa
                    ? 'اگه سهم کسی رو وارد نکنی، باقی مبلغ مساوی تقسیم میشه.'
                    : 'Leave a share blank to split the remainder equally.'}
                </p>

                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {active.map((member) => {
                    const on = selected.includes(member.id);
                    return (
                      <div
                        key={member.id}
                        className={`flex items-center gap-3 rounded-xl border bg-card p-3 shadow-sm transition-colors ${
                          on
                            ? 'border-primary/40 ring-1 ring-primary/20'
                            : 'border-border opacity-80'
                        }`}
                      >
                        <Checkbox
                          checked={on}
                          onChange={() =>
                            toggle(member.id)
                          }
                        />
                        <span className="flex-1 text-sm font-medium text-foreground">
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
                              if (val) {
                                next[member.id] = val;
                              } else {
                                delete next[member.id];
                              }
                              return distribute(
                                parseMoney(amount) || 0,
                                selected,
                                next
                              );
                            });
                          }}
                          className="h-9 w-24 text-right"
                          placeholder={
                            fa ? 'سهم' : 'Share'
                          }
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit" loading={submitting}>
                  {editing
                    ? fa
                      ? 'ذخیره تغییرات'
                      : 'Save changes'
                    : fa
                      ? 'ثبت خرج'
                      : 'Record expense'}
                </Button>

                {editing && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={clear}
                  >
                    {fa ? 'لغو' : 'Cancel'}
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="pt-6">
          
          <Table className="w-full">
            <Thead>
              <Tr >
                <Th>
                  {fa ? 'تاریخ' : 'Date'}
                </Th>

                <Th>
                  {fa ? 'توضیحات' : 'Description'}
                </Th>

                <Th>
                  {fa ? 'دسته‌بندی' : 'Category'}
                </Th>

                <Th>
                  {fa ? 'بین چه کسانی تقسیم شده' : 'Split among'}
                </Th>

                <Th>
                  {fa ? 'مبلغ' : 'Amount'}
                </Th>

                {isOwner && (
                  <Th>
                    {fa ? 'عملیات' : 'Action'}
                  </Th>
                )}
              </Tr>
            </Thead>

            <Tbody>
              {withdrawals?.data?.map((withdrawal) => (
                <Tr key={withdrawal.id}>
                  <Td>
                    {withdrawal.date ? gregorianToJalali(withdrawal.date) : gregorianToJalali(withdrawal.created_at)}
                  </Td>

                  <Td>
                    {withdrawal.description}
                  </Td>

                  <Td>
                    {categories.find(
                      (item) =>
                        item.value === withdrawal.category
                    )?.label || withdrawal.category}
                  </Td>

                  <Td>
                    {withdrawal.beneficiaries
                      .map(
                        (beneficiary) =>
                          beneficiary.member_display_name ||
                          beneficiary.member_name
                      )
                      .join(', ')}
                  </Td>

                  <Td className="font-medium text-red-600">
                    {fmt(withdrawal.amount)}
                  </Td>

                  {isOwner && (
                    <Td>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() =>
                            edit(withdrawal)
                          }
                        >
                          {fa ? 'ویرایش' : 'Edit'}
                        </Button>

                        <Button
                          variant="destructive"
                          loading={deletingId === withdrawal.id}
                          disabled={deletingId === withdrawal.id}
                          onClick={async () => {
                            if (deletingId) return;
                            if (!await confirm(
                              fa ? 'حذف خرج' : 'Delete expense',
                              fa ? 'از حذف این خرج مطمئنی؟ این عمل قابل بازگشت نیست.' : 'Are you sure you want to delete this expense? This action cannot be undone.'
                            )) return;
                            try {
                              setDeletingId(withdrawal.id);
                              await remove.mutateAsync(withdrawal.id);
                            } finally {
                              setDeletingId(null);
                            }
                          }}
                        >
                          {fa ? 'حذف' : 'Delete'}
                        </Button>
                      </div>
                    </Td>
                  )}
                </Tr>
              ))}
            </Tbody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}