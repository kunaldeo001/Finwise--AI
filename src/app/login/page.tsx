import { LoginForm } from '@/components/auth/login-form';
import { Suspense } from 'react';

export default function LoginPage() {
  return (
    <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
      <Suspense fallback={<div>Loading...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
