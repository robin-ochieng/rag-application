"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export default function DatabaseStatus() {
  const { user } = useAuth();
  const [status, setStatus] = useState<string>('Checking...');
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (user) {
      checkDatabase();
    }
  }, [user]);

  const checkDatabase = async () => {
    try {
      // Test if we can query the chats table with the new column
      const { error } = await supabase
        .from('chats')
        .select('id, title_auto_generated')
        .limit(1);

      if (error) {
        if (error.message.includes('relation "public.chats" does not exist')) {
          setStatus('❌ Database tables not created');
        } else if (error.message.includes('column "title_auto_generated" does not exist')) {
          setStatus('⚠️ Database needs migration');
        } else {
          setStatus(`❌ Database error: ${error.message}`);
        }
      } else {
        setStatus('✅ Database ready with smart titles');
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      setStatus(`❌ Connection failed: ${message}`);
    }
  };

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-20 right-4 bg-[rgb(var(--card))] border border-[rgb(var(--border))] rounded-lg p-3 text-xs max-w-xs z-50">
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium text-[rgb(var(--foreground))]">Database Status</span>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-[rgb(var(--muted-foreground))] hover:text-[rgb(var(--foreground))]"
        >
          {showDetails ? '−' : '+'}
        </button>
      </div>
      
      <div className="text-[rgb(var(--muted-foreground))]">
        {status}
      </div>

      {showDetails && (
        <div className="mt-2 pt-2 border-t border-[rgb(var(--border))] text-xs">
          <div className="mb-2">
            <strong>Setup Required:</strong>
          </div>
          {status.includes('Database tables not created') ? (
            <>
              <div className="mb-1">1. Go to Supabase Dashboard</div>
              <div className="mb-1">2. Open SQL Editor</div>
              <div className="mb-1">3. Run supabase-schema.sql</div>
            </>
          ) : status.includes('needs migration') ? (
            <>
              <div className="mb-1">1. Go to Supabase Dashboard</div>
              <div className="mb-1">2. Open SQL Editor</div>
              <div className="mb-1">3. Run supabase-migration-title-column.sql</div>
              <div className="mb-2 text-yellow-600">⚠️ This adds smart title generation</div>
            </>
          ) : (
            <div className="mb-1 text-green-600">✅ Smart titles ready!</div>
          )}
          <button
            onClick={checkDatabase}
            className="mt-2 px-2 py-1 bg-[rgb(var(--primary))] text-white rounded text-xs w-full"
          >
            Recheck
          </button>
        </div>
      )}
    </div>
  );
}