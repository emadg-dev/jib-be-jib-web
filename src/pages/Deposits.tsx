import { useState, type SetStateAction } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { depositsApi, membersApi, type Deposit } from '../api/services';
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
  Input
} from '../components/ui/core';

export default function Deposits() {

  const { language } = usePreferences();
  const fa = language === 'fa';

  const { isOwner } = useAuth();
  const queryClient = useQueryClient();

  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [memberId, setMemberId] = useState('');
  const [editing, setEditing] = useState<Deposit | null>(null);


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
    setEditing(null);
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
      amount: Number(amount),
      note
    };

    if (!memberId || !data.amount)
      return;

    editing
      ? update.mutate({ id: editing.id, data })
      : create.mutate(data);
  };


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


      {isOwner &&

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
            className="form-grid items-end"
          >

            <div>

              <label className="form-label">
                {fa ? 'عضو' : 'Member'}
              </label>

              <select
                className="select-control"
                value={memberId}
                onChange={e => setMemberId(e.target.value)}
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

              </select>

            </div>


            <div>

              <label className="form-label">
                {fa ? 'مبلغ' : 'Amount'}
              </label>

              <Input
                type="number"
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(e: { target: { value: SetStateAction<string>; }; }) => setAmount(e.target.value)}
                required
              />

            </div>


            <div>

              <label className="form-label">
                {fa ? 'توضیحات (اختیاری)' : 'Note (optional)'}
              </label>

              <Input
                value={note}
                onChange={(e: { target: { value: SetStateAction<string>; }; }) => setNote(e.target.value)}
              />

            </div>


            <div className="flex gap-2">

              <Button type="submit">

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

          <Table>

            <Thead>

              <Tr>

                <Th>{fa ? 'تاریخ' : 'Date'}</Th>
                <Th>{fa ? 'عضو' : 'Member'}</Th>
                <Th>{fa ? 'توضیحات' : 'Note'}</Th>
                <Th>{fa ? 'مبلغ' : 'Amount'}</Th>

                {
                  isOwner &&
                  <Th>{fa ? 'عملیات' : 'Action'}</Th>
                }

              </Tr>

            </Thead>


            <Tbody>

              {
                deposits?.data?.map(d => (

                  <Tr key={d.id}>

                    <Td>
                      {new Date(d.created_at).toLocaleDateString()}
                    </Td>

                    <Td>
                      {d.member_display_name || d.member_name}
                    </Td>

                    <Td>
                      {d.note || '-'}
                    </Td>

                    <Td className="font-medium text-green-600">
                      ${d.amount.toFixed(2)}
                    </Td>


                    {
                      isOwner &&
                      <Td>

                        <div className="flex gap-2">

                          <Button
                            variant="outline"
                            onClick={() => {
                              setEditing(d);
                              setMemberId(d.member_id);
                              setAmount(String(d.amount));
                              setNote(d.note || '');
                            }}
                          >
                            {fa ? 'ویرایش' : 'Edit'}
                          </Button>


                          <Button
                            variant="destructive"
                            onClick={() => remove.mutate(d.id)}
                          >
                            {fa ? 'حذف' : 'Delete'}
                          </Button>


                        </div>

                      </Td>
                    }


                  </Tr>

                ))
              }

            </Tbody>

          </Table>

        </CardContent>

      </Card>


    </div>
  );
}