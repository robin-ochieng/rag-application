"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface AuthFormProps {
  mode: 'login' | 'signup';
  onToggleMode: () => void;
}

export default function AuthForm({ mode, onToggleMode }: AuthFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { signIn, signUp } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let result;
      if (mode === 'login') {
        result = await signIn(email, password);
      } else {
        result = await signUp(email, password, name);
      }

      if (result.error) {
        setError(result.error.message);
      } else {
        // Successful authentication - redirect to chat
        router.push('/chat');
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[rgb(var(--background))] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500 via-sky-500 to-teal-500">
            <span className="text-white font-bold text-xl">K</span>
          </div>
          <h2 className="mt-6 text-center text-3xl font-bold text-[rgb(var(--foreground))]">
            {mode === 'login' ? 'Sign in to your account' : 'Create your account'}
          </h2>
          <p className="mt-2 text-center text-sm text-[rgb(var(--muted-foreground))]">
            {mode === 'login' ? 'Welcome back to Kenbright GPT' : 'Join Kenbright GPT today'}
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-[rgb(var(--foreground))]">
                  Full Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-[rgb(var(--border))] placeholder-[rgb(var(--muted-foreground))] text-[rgb(var(--foreground))] bg-[rgb(var(--background))] rounded-md focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary))] focus:border-[rgb(var(--primary))] focus:z-10 sm:text-sm"
                  placeholder="Enter your full name"
                />
              </div>
            )}
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[rgb(var(--foreground))]">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-[rgb(var(--border))] placeholder-[rgb(var(--muted-foreground))] text-[rgb(var(--foreground))] bg-[rgb(var(--background))] rounded-md focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary))] focus:border-[rgb(var(--primary))] focus:z-10 sm:text-sm"
                placeholder="Enter your email"
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[rgb(var(--foreground))]">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-[rgb(var(--border))] placeholder-[rgb(var(--muted-foreground))] text-[rgb(var(--foreground))] bg-[rgb(var(--background))] rounded-md focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary))] focus:border-[rgb(var(--primary))] focus:z-10 sm:text-sm"
                placeholder="Enter your password"
                minLength={6}
              />
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
              <div className="text-sm text-red-700 dark:text-red-400">
                {error}
              </div>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-[rgb(var(--primary))] hover:bg-[rgb(var(--primary))]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[rgb(var(--primary))] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {mode === 'login' ? 'Signing in...' : 'Creating account...'}
                </div>
              ) : (
                mode === 'login' ? 'Sign in' : 'Create account'
              )}
            </button>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={onToggleMode}
              className="text-sm text-[rgb(var(--primary))] hover:text-[rgb(var(--primary))]/80 transition-colors"
            >
              {mode === 'login' ? 
                "Don't have an account? Sign up" : 
                "Already have an account? Sign in"
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}