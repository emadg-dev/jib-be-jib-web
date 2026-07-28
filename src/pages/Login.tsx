import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '../contexts/AuthContext';
import { authApi } from '../api/services';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent, Button, Input } from '../components/ui/core';
import { usePreferences } from '../contexts/PreferencesContext';
import { useState } from 'react';
import { Eye, EyeOff, Languages, Moon, Sun } from 'lucide-react';

const schema = z.object({ name: z.string().min(1), password: z.string().min(1) });

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const { language, theme, toggleLanguage, toggleTheme } = usePreferences();
  const fa = language === 'fa';
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (data: any) => {
    try {
      const res = await authApi.login(data);
      login(res.data);
      await authApi.me();
      navigate('/dashboard');
    } catch (e: any) {
      alert(e.message || 'Login failed');
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
      // src= {theme === 'light' ? "/jbj_header.png" : "/jbj_header_dark.png"}
      src= "/jbj_header.png"
      alt="Jib-be-Jib logo"
      className="rounded-3xl object-contain"
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
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Input placeholder={fa ? 'نام کاربری' : 'Username'} {...register('name')} />
              {errors.name && <span className="text-sm text-destructive">{(errors.name as any).message}</span>}
            </div>
            <div>
            <div className="relative">
  <Input
    type={showPassword ? 'text' : 'password'}
    placeholder={fa ? 'رمز عبور' : 'Password'}
    {...register('password')}
  />

  <button
    type="button"
    aria-label={showPassword ? 'Hide password' : 'Show password'}
    onClick={() => setShowPassword(!showPassword)}
    className="absolute end-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-500 hover:text-slate-700"
    >
    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
  </button>

  {errors.password && (
    <span className="text-sm text-destructive">
      {(errors.password as any).message}
    </span>
  )}
</div>
            </div>
            <Button type="submit" className="w-full">{fa ? 'ورود' : 'Sign in'}</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}