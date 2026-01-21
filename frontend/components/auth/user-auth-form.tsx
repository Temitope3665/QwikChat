'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createUser, getUserByPhone } from '@/lib/api';

interface UserAuthFormProps {
  open: boolean;
  onSuccess: (user: any) => void;
}

export function UserAuthForm({ open, onSuccess }: UserAuthFormProps) {
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [mode, setMode] = useState<'login' | 'register'>('login');
  
  const queryClient = useQueryClient();

  const loginMutation = useMutation({
    mutationFn: getUserByPhone,
    onSuccess: (data: any) => {
        toast.dismiss();
      if(data) {
        toast.success(`Welcome back, ${data.username}!`);
        onSuccess(data);
      } else {
        toast.error('User not found. Please register.');
        setMode('register');
      }
    },
    onError: () => {
        toast.dismiss();
      toast.error('Failed to login. User might not exist.');
    },
  });

  const registerMutation = useMutation({
    mutationFn: () => createUser(username, phone),
    onSuccess: (data: any) => {
        toast.dismiss();
      toast.success('Account created!');
      onSuccess(data);
    },
    onError: (error) => {
        toast.dismiss();
      toast.error('Failed to create account.');
      console.error(error);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.loading('Processing...');
    if (mode === 'login') {
      loginMutation.mutate(phone);
    } else {
      registerMutation.mutate();
    }
  };

  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>{mode === 'login' ? 'Login' : 'Create Account'}</DialogTitle>
          <DialogDescription>
            {mode === 'login'
              ? 'Enter your phone number to continue.'
              : 'Enter your details to create an account.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                placeholder="John Doe"
              />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              placeholder="1234567890"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Button type="submit" disabled={loginMutation.isPending || registerMutation.isPending}>
              {mode === 'login' ? 'Login' : 'Register'}
            </Button>
            <Button
              type="button"
              variant="link"
              onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
            >
              {mode === 'login'
                ? "Don't have an account? Register"
                : 'Already have an account? Login'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
