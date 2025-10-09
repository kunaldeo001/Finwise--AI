'use client';

import { use, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { FcGoogle } from 'react-icons/fc';
import { useUser } from '@/firebase';
import {
  signInWithGoogle,
  handleEmailSignIn,
  handleEmailSignUp,
} from '@/firebase/auth/client';
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address.'),
  password: z.string().min(6, 'Password must be at least 6 characters long.'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  useEffect(() => {
    if (user && !isUserLoading) {
      const from = searchParams.get('from');
      router.replace(from || '/');
    }
  }, [user, isUserLoading, router, searchParams]);

  useEffect(() => {
    const error = searchParams.get('error');
    if (error) {
      toast({
        variant: 'destructive',
        title: 'Authentication Error',
        description: decodeURIComponent(error),
      });
    }
  }, [searchParams, toast]);

  if (isUserLoading || user) {
    return (
      <div className="flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  const onSubmit = async (data: LoginFormValues) => {
    try {
      await handleEmailSignIn(data.email, data.password);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Sign In Failed',
        description: error.message,
      });
    }
  };

  const onSignUp = async (data: LoginFormValues) => {
    try {
      await handleEmailSignUp(data.email, data.password);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Sign Up Failed',
        description: error.message,
      });
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Welcome to FinWise AI</CardTitle>
        <CardDescription>Sign in to your account or create a new one to get started.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <Button variant="outline" className="w-full" onClick={signInWithGoogle}>
            <FcGoogle className="mr-2 h-5 w-5" />
            Sign in with Google
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="kunal.deo@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button type="submit" className="w-full">
                  Sign In
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  className="w-full"
                  onClick={form.handleSubmit(onSignUp)}
                >
                  Sign Up
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </CardContent>
    </Card>
  );
}
