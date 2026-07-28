import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '../contexts/AuthContext';
import { authApi } from '../api/services';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent, Button, Input } from '../components/ui/core';

const schema = z.object({ name: z.string().min(1), password: z.string().min(1) });

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (data: any) => {
    try {
      const res = await authApi.login(data);
      login(res.data);
      navigate('/dashboard');
    } catch (e: any) {
      alert(e.message || 'Login failed');
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-muted/20">
      <Card className="w-[400px]">
        <CardHeader><CardTitle className="text-2xl text-center">Jib-be-Jib Login</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Input placeholder="Username" {...register('name')} />
              {errors.name && <span className="text-sm text-destructive">{(errors.name as any).message}</span>}
            </div>
            <div>
              <Input type="password" placeholder="Password" {...register('password')} />
              {errors.password && <span className="text-sm text-destructive">{(errors.password as any).message}</span>}
            </div>
            <Button type="submit" className="w-full">Sign In</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}