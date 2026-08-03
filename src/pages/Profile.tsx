import { useQuery, useMutation } from '@tanstack/react-query';
import { profileApi } from '../api/services';
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Label } from '../components/ui/core';
import { useForm } from 'react-hook-form';
import { usePreferences } from '../contexts/PreferencesContext';
import { useAuth } from '../contexts/AuthContext';
import { useState } from 'react';
import { Eye, EyeOff, User, Lock } from 'lucide-react';
import { translateError } from '../utils/translations';

export default function Profile() {
  const { language } = usePreferences();
  const fa = language === 'fa';
  const { user } = useAuth();
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: profileApi.get,
  });

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
    },
    onError: (error: any) => {
      const rawMessage = error?.message || 'Error changing password';
      setErrorMessage(translateError(rawMessage, fa));
      setSuccessMessage('');
    },
  });

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

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User size={20} />
              {fa ? 'اطلاعات کاربری' : 'Account Information'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-5">
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
                  {fa ? 'نام نمایشی' : 'Display Name'}
                </p>
                <p className="mt-1 text-foreground">
                  {displayProfile?.display_name || user?.display_name || '-'}
                </p>
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock size={20} />
              {fa ? 'تغییر رمز عبور' : 'Change Password'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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

              <Button
                type="submit"
                disabled={changePasswordMutation.isPending}
                className="w-full"
              >
                {changePasswordMutation.isPending
                  ? (fa ? 'در حال تغییر...' : 'Changing...')
                  : (fa ? 'تغییر رمز عبور' : 'Change Password')}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
