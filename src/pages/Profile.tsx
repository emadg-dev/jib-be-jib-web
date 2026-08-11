import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { profileApi, depositsApi, withdrawalsApi, type Deposit, type Withdrawal } from '../api/services';
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Label } from '../components/ui/core';
import { useForm } from 'react-hook-form';
import { usePreferences } from '../contexts/PreferencesContext';
import { useAuth } from '../contexts/AuthContext';
import { useState, useRef, useMemo, type SetStateAction } from 'react';
import { Eye, EyeOff, User, Lock, Camera, Pencil, Check, X, TrendingUp, Wallet } from 'lucide-react';
import { translateError } from '../utils/translations';
import Avatar from '../components/Avatar';
import { processAvatar } from '../utils/avatar';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from 'recharts';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogClose } from '../components/ui/alert-dialog';

export default function Profile() {
  const { language } = usePreferences();
  const fa = language === 'fa';
  const { user, updateUser } = useAuth();
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState('');
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: profileApi.get,
  });

  const { data: depositsRes } = useQuery({
    queryKey: ['deposits'],
    queryFn: depositsApi.getAll,
  });

  const { data: withdrawalsRes } = useQuery({
    queryKey: ['withdrawals'],
    queryFn: withdrawalsApi.getAll,
  });

  const deposits: Deposit[] = Array.isArray(depositsRes?.data) ? depositsRes.data : [];
  const withdrawals: Withdrawal[] = Array.isArray(withdrawalsRes?.data) ? withdrawalsRes.data : [];

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<{
    current_password: string;
    new_password: string;
    confirm_password: string;
  }>();

  const changePasswordMutation = useMutation({
    mutationFn: profileApi.changePassword,
    onSuccess: () => {
      setSuccessMessage(fa ? 'رمز عبور با موفقیت تغییر کرد' : 'Password changed successfully');
      setErrorMessage('');
      reset();
      setPasswordModalOpen(false);
    },
    onError: (error: any) => {
      const rawMessage = error?.message || 'Error changing password';
      setErrorMessage(translateError(rawMessage, fa));
      setSuccessMessage('');
    },
  });

  const displayNameMutation = useMutation({
    mutationFn: profileApi.updateDisplayName,
    onSuccess: (res: any) => {
      const newName = res?.data?.display_name;
      if (newName) updateUser({ display_name: newName });
      setEditingName(false);
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      setSuccessMessage(fa ? 'نام با موفقیت بروزرسانی شد' : 'Name updated successfully');
      setErrorMessage('');
    },
    onError: (error: any) => {
      setErrorMessage(translateError(error?.message || 'Error updating name', fa));
      setSuccessMessage('');
    },
  });

  const avatarMutation = useMutation({
    mutationFn: profileApi.uploadAvatar,
    onSuccess: (res: any) => {
      const avatarUrl = res?.data?.avatar;
      if (avatarUrl) {
        updateUser({ avatar: avatarUrl });
      } else {
        updateUser({ avatar: undefined });
      }
      setAvatarPreview(null);
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      setSuccessMessage(fa ? 'تصویر پروفایل بروزرسانی شد' : 'Profile picture updated');
    },
    onError: (error: any) => {
      const rawMessage = error?.message || 'Error uploading avatar';
      setErrorMessage(translateError(rawMessage, fa));
    },
  });

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const processed = await processAvatar(file, 256, 0.85);
      setAvatarPreview(processed);
      setErrorMessage('');
      setSuccessMessage('');
    } catch {
      setErrorMessage(fa ? 'خطا در پردازش تصویر' : 'Error processing image');
      setAvatarPreview(null);
    }
  };

  const handleUploadAvatar = async () => {
    if (!avatarPreview) return;
    setAvatarUploading(true);
    try {
      await avatarMutation.mutateAsync({ avatar: avatarPreview });
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleRemoveAvatar = () => {
    setAvatarPreview(null);
    avatarMutation.mutate({ avatar: '' });
  };

  const handleSaveName = () => {
    const trimmed = nameValue.trim();
    if (!trimmed) return;
    displayNameMutation.mutate({ display_name: trimmed });
  };

  const startEditName = () => {
    setNameValue(displayProfile?.display_name || user?.display_name || '');
    setEditingName(true);
  };

  const onSubmit = (data: { current_password: string; new_password: string; confirm_password: string }) => {
    if (data.new_password !== data.confirm_password) {
      setErrorMessage(fa ? 'رمز عبور جدید مطابقت ندارد' : 'New passwords do not match');
      return;
    }
    changePasswordMutation.mutate({
      current_password: data.current_password,
      new_password: data.new_password,
    });
  };

  const displayProfile = profile?.data;
  const hasUnsavedPreview = avatarPreview !== null;
  const currentAvatar = displayProfile?.avatar || user?.avatar;
  const displayAvatar = avatarPreview || currentAvatar;

  const chartData = useMemo(() => {
    const userId = user?.id;
    if (!userId) return { data: [], balance: 0 };

    const myDeposits = deposits
      .filter(d => d.member_id === userId)
      .map(d => ({ date: d.date || d.created_at, amount: d.amount, type: 'deposit' as const }));

    const myExpenses = withdrawals
      .flatMap(w => w.beneficiaries.filter(b => b.member_id === userId).map(b => ({ date: w.date || w.created_at, amount: b.share, type: 'expense' as const })));

    const all = [...myDeposits, ...myExpenses].sort((a, b) => a.date.localeCompare(b.date));

    let running = 0;
    const points = all.map(item => {
      running += item.type === 'deposit' ? item.amount : -item.amount;
      return { date: item.date, balance: Math.round(running * 100) / 100 };
    });

    return { data: points, balance: running };
  }, [deposits, withdrawals, user?.id]);

  const fmt = (v: number) => v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div dir={fa ? 'rtl' : 'ltr'} className="space-y-6">
      <div>
        <h1 className="page-title">
          {fa ? 'پروفایل' : 'Profile'}
        </h1>
        <p className="page-subtitle">
          {fa
            ? 'اطلاعات حساب کاربری خود را مدیریت کنید.'
            : 'Manage your account information.'}
        </p>
      </div>

      {successMessage && (
        <div className="rounded-xl bg-green-50 p-3 text-sm text-green-700 dark:bg-green-900/30 dark:text-green-400">
          {successMessage}
        </div>
      )}
      {errorMessage && (
        <div className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-900/30 dark:text-rose-400">
          {errorMessage}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Account Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User size={20} />
              {fa ? 'اطلاعات کاربری' : 'Account Information'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-5">
              {/* Avatar section */}
              <div className="flex flex-col items-center gap-4 pb-4 border-b border-border">
                <div className="relative group">
                  <Avatar src={displayAvatar} name={displayProfile?.display_name || user?.name} size={80} className="ring-4 ring-background shadow-lg" />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className={`absolute -end-1 -bottom-1 grid h-8 w-8 place-items-center rounded-full bg-indigo-600 text-white shadow-md transition-opacity ${
                      displayAvatar
                        ? 'opacity-0 group-hover:opacity-100'
                        : 'opacity-100'
                    }`}
                    title={fa ? 'تغییر تصویر' : 'Change photo'}
                  >
                    <Camera size={14} />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-foreground">{displayProfile?.display_name || user?.name}</p>
                  <p className="text-xs text-muted-foreground">@{displayProfile?.name || user?.name}</p>
                </div>
              </div>

              {/* Preview / Upload controls */}
              <div className="flex items-center justify-center gap-3">
                {hasUnsavedPreview && (
                  <Button
                    size="sm"
                    variant="primary"
                    disabled={avatarUploading}
                    onClick={handleUploadAvatar}
                    className="min-w-[120px]"
                  >
                    {avatarUploading
                      ? (fa ? 'در حال ذخیره...' : 'Saving...')
                      : (fa ? 'ذخیره تصویر' : 'Save Photo')}
                  </Button>
                )}
                {(hasUnsavedPreview || currentAvatar) && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={handleRemoveAvatar}
                    className="min-w-[120px]"
                  >
                    {fa ? 'حذف تصویر' : 'Remove Photo'}
                  </Button>
                )}
              </div>
              <div className='flex w-full gap-10'>
                
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {fa ? 'نام کاربری' : 'Username'}
                </p>
                <p className="mt-1 text-foreground">
                  {displayProfile?.name || user?.name || '-'}
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {fa ? 'نام' : 'Name'}
                </p>
                {editingName ? (
                  <div className="mt-1 flex items-center gap-2">
                    <Input
                      value={nameValue}
                      onChange={(e: { target: { value: SetStateAction<string>; }; }) => setNameValue(e.target.value)}
                      onKeyDown={(e: { key: string; }) => { if (e.key === 'Enter') handleSaveName(); if (e.key === 'Escape') setEditingName(false); }}
                      className="flex-1"
                      autoFocus
                    />
                    <Button size="sm" variant="primary" onClick={handleSaveName} disabled={displayNameMutation.isPending}>
                      <Check size={16} />
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => setEditingName(false)}>
                      <X size={16} />
                    </Button>
                  </div>
                ) : (
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-foreground">{displayProfile?.display_name || user?.display_name || '-'}</span>
                    <button onClick={startEditName} className="text-muted-foreground hover:text-foreground transition-colors">
                      <Pencil size={14} />
                    </button>
                  </div>
                )}
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {fa ? 'نقش' : 'Role'}
                </p>
                <p className="mt-1 capitalize text-foreground">
                  {displayProfile?.role || user?.role || '-'}
                </p>
              </div>

              
              </div>


              <Button
                variant="outline"
                className="w-full"
                onClick={() => setPasswordModalOpen(true)}
              >
                <Lock size={16} className="ms-2" />
                {fa ? 'تغییر رمز عبور' : 'Change Password'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Financial Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp size={20} />
              {fa ? 'خلاصه مالی' : 'Financial Summary'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-6 flex items-center gap-3 rounded-xl bg-primary/5 p-4">
              <Wallet size={24} className="text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">{fa ? 'مانده نهایی' : 'Final Balance'}</p>
                <p dir="ltr" className={`text-2xl font-bold ${chartData.balance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {fmt(chartData.balance)}
                </p>
              </div>
            </div>

            {chartData.data.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData.data}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 12 }}
                      tickFormatter={(v) => {
                        const d = new Date(v);
                        return `${d.getMonth() + 1}/${d.getDate()}`;
                      }}
                    />
                    <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => fmt(v)} />
                    <Tooltip
                      formatter={(value: number) => [fmt(value), fa ? 'مانده' : 'Balance']}
                      labelFormatter={(label) => new Date(label).toLocaleDateString(fa ? 'fa-IR' : 'en-US')}
                    />
                    <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="3 3" />
                    <Line
                      type="monotone"
                      dataKey="balance"
                      stroke="#4f46e5"
                      strokeWidth={2}
                      dot={{ r: 4, fill: '#4f46e5' }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">
                {fa ? 'هنوز تراکنشی ثبت نشده است.' : 'No transactions recorded yet.'}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Change Password Modal */}
      <AlertDialog open={passwordModalOpen} onOpenChange={setPasswordModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Lock size={20} />
              {fa ? 'تغییر رمز عبور' : 'Change Password'}
            </AlertDialogTitle>
          </AlertDialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 mt-4">
            <div>
              <Label htmlFor="current_password">
                {fa ? 'رمز عبور فعلی' : 'Current Password'}
              </Label>
              <div className="relative">
                <Input
                  id="current_password"
                  type={showCurrentPassword ? 'text' : 'password'}
                  {...register('current_password', { required: true })}
                  className="pe-10"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute end-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:text-foreground"
                >
                  {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.current_password && (
                <p className="mt-1.5 text-xs font-medium text-rose-500">
                  {fa ? 'رمز عبور فعلی الزامی است' : 'Current password is required'}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="new_password">
                {fa ? 'رمز عبور جدید' : 'New Password'}
              </Label>
              <div className="relative">
                <Input
                  id="new_password"
                  type={showNewPassword ? 'text' : 'password'}
                  {...register('new_password', {
                    required: true,
                    minLength: { value: 6, message: fa ? 'حداقل ۶ کاراکتر' : 'At least 6 characters' },
                  })}
                  className="pe-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute end-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:text-foreground"
                >
                  {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.new_password && (
                <p className="mt-1.5 text-xs font-medium text-rose-500">
                  {errors.new_password.message || (fa ? 'حداقل ۶ کاراکتر' : 'At least 6 characters')}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="confirm_password">
                {fa ? 'تأیید رمز عبور جدید' : 'Confirm New Password'}
              </Label>
              <Input
                id="confirm_password"
                type="password"
                {...register('confirm_password', {
                  required: true,
                  minLength: { value: 6, message: fa ? 'حداقل ۶ کاراکتر' : 'At least 6 characters' },
                })}
              />
              {errors.confirm_password && (
                <p className="mt-1.5 text-xs font-medium text-rose-500">
                  {errors.confirm_password.message || (fa ? 'حداقل ۶ کاراکتر' : 'At least 6 characters')}
                </p>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <AlertDialogClose asChild>
                <Button type="button" variant="secondary" className="flex-1">
                  {fa ? 'لغو' : 'Cancel'}
                </Button>
              </AlertDialogClose>
              <Button
                type="submit"
                disabled={changePasswordMutation.isPending}
                className="flex-1"
              >
                {changePasswordMutation.isPending
                  ? (fa ? 'در حال تغییر...' : 'Changing...')
                  : (fa ? 'تغییر رمز عبور' : 'Change Password')}
              </Button>
            </div>
          </form>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
