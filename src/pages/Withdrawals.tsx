import { useState, type SetStateAction } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  withdrawalsApi,
  membersApi,
  type Withdrawal,
} from '../api/services';

import { useAuth } from '../contexts/AuthContext';
import { usePreferences } from '../contexts/PreferencesContext';

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
} from '../components/ui/core';

type Shares = Record<string, string>;

export default function Withdrawals() {
  const { isOwner } = useAuth();
  const { language } = usePreferences();
  const fa = language === 'fa';

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
  const [selected, setSelected] = useState<string[]>([]);
  const [shares, setShares] = useState<Shares>({});
  const [editing, setEditing] = useState<Withdrawal | null>(null);

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
    setSelected((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    );
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();

    const total = Number(amount);

    if (!total || !selected.length) {
      return;
    }

    const entered = selected.reduce(
      (sum, id) => sum + (Number(shares[id]) || 0),
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
        ? Number(shares[id])
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

  const edit = (withdrawal: Withdrawal) => {
    setEditing(withdrawal);
    setDescription(withdrawal.description);
    setCategory(withdrawal.category);
    setAmount(String(withdrawal.amount));

    setSelected(
      withdrawal.beneficiaries.map(
        (beneficiary) => beneficiary.member_id
      )
    );

    setShares(
      Object.fromEntries(
        withdrawal.beneficiaries.map((beneficiary) => [
          beneficiary.member_id,
          String(beneficiary.share),
        ])
      )
    );
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
               <div className="form-grid grid gap-2 lg:grid-cols-3">
                <div className="mt-2">
                  <label className="form-label">
                    {fa ? 'توضیحات' : 'Description'}
                  </label>

                  <Input
                    value={description}
                    onChange={(event: { target: { value: SetStateAction<string>; }; }) =>
                      setDescription(event.target.value)
                    }
                    required
                  />
                </div>

                <div className="mt-2">
                  <label className="form-label">
                    {fa ? 'دسته‌بندی' : 'Category'}
                  </label>

                  <select
                    className="select-control"
                    value={category}
                    onChange={(event) =>
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
                  </select>
                </div>

                <div className="mt-2">
                  <label className="form-label">
                    {fa ? 'مبلغ کل' : 'Total amount'}
                  </label>

                  <Input
                    type="number"
                    min=".01"
                    step=".01"
                    value={amount}
                    onChange={(event: { target: { value: SetStateAction<string>; }; }) =>
                      setAmount(event.target.value)
                    }
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="form-label mb-0">
                    {fa ? 'افرادی که استفاده کردن' : 'Beneficiaries'}
                  </label>

                  <label className="flex gap-2 text-sm font-semibold text-foreground">
                    <input
                      type="checkbox"
                      checked={
                        active.length > 0 &&
                        selected.length === active.length
                      }
                      onChange={() =>
                        setSelected(
                          selected.length === active.length
                            ? []
                            : active.map((member) => member.id)
                        )
                      }
                    />

                    {fa
                      ? 'همه اعضای فعال'
                      : 'All active members'}
                  </label>
                </div>

                <p className="mt-1 text-xs text-muted-foreground">
                  {fa
                    ? 'اگه سهم کسی رو وارد نکنی، باقی مبلغ مساوی تقسیم میشه.'
                    : 'Leave a share blank to split the remainder equally.'}
                </p>

                <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {active.map((member) => {
                    const on = selected.includes(member.id);
                    return (
                      <div
                        key={member.id}
                        className="flex items-center gap-2 rounded-xl border border-border bg-card p-3"
                      >
                        <input
                          type="checkbox"
                          checked={on}
                          onChange={() =>
                            toggle(member.id)
                          }
                        />
                        <span className="flex-1 text-sm font-medium">
                          {member.display_name || member.name}
                        </span>

                        <Input
                          type="number"
                          min="0"
                          step=".01"
                          disabled={!on}
                          value={shares[member.id] || ''}
                          onChange={(event: { target: { value: any; }; }) =>
                            setShares((current) => ({
                              ...current,
                              [member.id]:
                                event.target.value,
                            }))
                          }
                          className="h-9 w-24"
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
                <Button type="submit">
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
                    {new Date(
                      withdrawal.created_at
                    ).toLocaleDateString()}
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
                    ${withdrawal.amount.toFixed(2)}
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
                          onClick={() =>
                            remove.mutate(withdrawal.id)
                          }
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