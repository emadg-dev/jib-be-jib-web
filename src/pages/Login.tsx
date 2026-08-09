import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '../contexts/AuthContext';
import { authApi } from '../api/services';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent, Button, Input, Label } from '../components/ui/core';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogIcon,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
} from '../components/ui/alert-dialog';
import { usePreferences } from '../contexts/PreferencesContext';
import { useState } from 'react';
import { Eye, EyeOff, Languages, Moon, Sun } from 'lucide-react';
import { translateError } from '../utils/translations';

const schemaFa = z.object({
  name: z.string().min(1, 'نام کاربری الزامی است'),
  password: z.string().min(1, 'رمز عبور الزامی است'),
});

const schemaEn = z.object({
  name: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [errorDialog, setErrorDialog] = useState<{ open: boolean; message: string }>({ open: false, message: '' });
  const { login } = useAuth();
  const { language, theme, toggleLanguage, toggleTheme } = usePreferences();
  const fa = language === 'fa';
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(fa ? schemaFa : schemaEn) });

  const onSubmit = async (data: any) => {
    try {
      const res: any = await authApi.login(data);
      const session = res.data ?? res;
      if (session.token) localStorage.setItem('token', session.token);
      login(session);
      const activeTrips = (session.trips || []).filter((trip: any) => trip.active !== false);
      navigate(activeTrips.length ? '/dashboard' : '/trips');
    } catch (e: any) {
      const rawMessage = e?.message || 'Invalid credentials';
      setErrorDialog({
        open: true,
        message: translateError(rawMessage, fa),
      });
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center p-4 sm:p-6">
      <div dir="ltr" className="absolute right-4 top-4 flex gap-1">
        <button aria-label="Change language" onClick={toggleLanguage} className="rounded-xl p-2 text-slate-500 hover:bg-white/70">
          <Languages size={19} />
        </button>
        <button aria-label="Toggle theme" onClick={toggleTheme} className="rounded-xl p-2 text-slate-500 hover:bg-white/70">
          {theme === 'light' ? <Moon size={19} /> : <Sun size={19} />}
        </button>
      </div>
      <Card className="w-full max-w-md">
        <div className="my-4 flex justify-center">
          <img
            src="/jbj_header.webp"
            alt="Jib-be-Jib logo"
            className="rounded-3xl object-contain px-16"
          />
        </div>
        <CardHeader className="pt-2">
          <CardTitle className="text-center text-2xl">
            {fa ? 'جیب‌ به‌ جیب کن!' : 'Welcome back to Jib-be-Jib'}
          </CardTitle>
          <br />
          <p className="mt-2 text-center text-sm text-slate-500">
            {fa ? 'برای مدیریت هزینه‌های سفر وارد شو.' : 'Sign in to manage your trip together.'}
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <Label htmlFor="username">{fa ? 'نام کاربری' : 'Username'}</Label>
              <Input
                id="username"
                placeholder={fa ? 'نام کاربری خود را وارد کنید' : 'Enter your username'}
                className={errors.name ? 'border-destructive focus:border-destructive focus:ring-destructive/20' : ''}
                {...register('name')}
              />
              {errors.name && (
                <span className="mt-1.5 block text-xs font-medium text-destructive">
                  {(errors.name as any).message}
                </span>
              )}
            </div>

            <div>
              <Label htmlFor="password">{fa ? 'رمز عبور' : 'Password'}</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder={fa ? 'رمز عبور خود را وارد کنید' : 'Enter your password'}
                  className={`pe-10 ${errors.password ? 'border-destructive focus:border-destructive focus:ring-destructive/20' : ''}`}
                  {...register('password')}
                />
                <button
                  type="button"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute end-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && (
                <span className="mt-1.5 block text-xs font-medium text-destructive">
                  {(errors.password as any).message}
                </span>
              )}
            </div>

            <Button type="submit" className="w-full">{fa ? 'ورود' : 'Sign in'}</Button>
          </form>
        </CardContent>
      </Card>

      <AlertDialog open={errorDialog.open} onOpenChange={(open) => setErrorDialog(prev => ({ ...prev, open }))}>
        <AlertDialogContent variant="error">
          <AlertDialogHeader>
            <AlertDialogIcon />
            <AlertDialogTitle>
              {fa ? 'خطا در ورود' : 'Login Failed'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {errorDialog.message}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setErrorDialog({ open: false, message: '' })}>
              {fa ? 'باشه' : 'OK'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
