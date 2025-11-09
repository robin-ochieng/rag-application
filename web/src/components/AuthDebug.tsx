"use client";

import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useState } from 'react';

export default function AuthDebug() {
  const { user, session, loading } = useAuth();
  const [connectionTest, setConnectionTest] = useState<string>('');

  const testConnection = async () => {
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        setConnectionTest(`Connection Error: ${error.message}`);
      } else {
        setConnectionTest(`Connection OK. Session: ${data.session ? 'Active' : 'None'}`);
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      setConnectionTest(`Connection Failed: ${message}`);
    }
  };

  if (process.env.NODE_ENV !== 'development') {
    return null; // Only show in development
  }

  return (
    <div className="fixed bottom-4 right-4 bg-[rgb(var(--card))] border border-[rgb(var(--border))] rounded-lg p-4 text-xs font-mono max-w-sm z-50">
      <h3 className="font-bold mb-2 text-[rgb(var(--foreground))]">Auth Debug</h3>
      <div className="space-y-1 text-[rgb(var(--muted-foreground))]">
        <div>Loading: {loading ? 'Yes' : 'No'}</div>
        <div>User: {user ? user.email : 'None'}</div>
        <div>Session: {session ? 'Active' : 'None'}</div>
        <div>User ID: {user?.id || 'None'}</div>
        <button 
          onClick={testConnection}
          className="mt-2 px-2 py-1 bg-[rgb(var(--primary))] text-white rounded text-xs"
        >
          Test Connection
        </button>
        {connectionTest && (
          <div className="mt-1 text-xs">{connectionTest}</div>
        )}
      </div>
    </div>
  );
}