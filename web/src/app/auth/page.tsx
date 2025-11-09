"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import AuthForm from '@/components/auth/AuthForm';

export default function AuthPage() {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const { user, loading } = useAuth();
  const router = useRouter();

  // Redirect authenticated users to chat
  useEffect(() => {
    if (!loading && user) {
      router.push('/chat');
    }
  }, [user, loading, router]);

  const toggleMode = () => {
    setMode(mode === 'login' ? 'signup' : 'login');
  };

  // Show loading while checking auth state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[rgb(var(--background))]">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[rgb(var(--primary))]"></div>
          <span className="text-[rgb(var(--muted-foreground))]">Loading...</span>
        </div>
      </div>
    );
  }

  // Don't render auth form if user is authenticated
  if (user) {
    return null;
  }

  return <AuthForm mode={mode} onToggleMode={toggleMode} />;
}