"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { Database } from '@/lib/database.types';

type Chat = Database['public']['Tables']['chats']['Row'];
type Message = Database['public']['Tables']['messages']['Row'];
type NewChat = Database['public']['Tables']['chats']['Insert'];
type NewMessage = Database['public']['Tables']['messages']['Insert'];

export function useChats() {
  const { user } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchChats();
      
      // Subscribe to realtime changes
      const subscription = supabase
        .channel('chats-channel')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'chats',
          filter: `user_id=eq.${user.id}`
        }, () => {
          fetchChats();
        })
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [user]);

  const fetchChats = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('chats')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setChats(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const createChat = async (title?: string): Promise<Chat | null> => {
    if (!user) return null;

    try {
      const newChat: NewChat = {
        user_id: user.id,
        title: title || 'New Chat'
      };

      const { data, error } = await supabase
        .from('chats')
        .insert(newChat)
        .select()
        .single();

      if (error) {
        console.error('Database error creating chat:', error);
        return null; // Return null instead of throwing to allow graceful fallback
      }
      
      // Refresh chats list
      await fetchChats();
      return data;
    } catch (err: any) {
      console.error('Failed to create chat:', err);
      return null; // Return null instead of throwing to allow graceful fallback
    }
  };

  const updateChatTitle = async (chatId: string, title: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('chats')
        .update({ title })
        .eq('id', chatId);

      if (error) throw error;
      
      // Update local state
      setChats(prev => prev.map(chat => 
        chat.id === chatId ? { ...chat, title } : chat
      ));
      
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  };

  const deleteChat = async (chatId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('chats')
        .delete()
        .eq('id', chatId);

      if (error) throw error;
      
      // Remove from local state
      setChats(prev => prev.filter(chat => chat.id !== chatId));
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  };

  return {
    chats,
    loading,
    error,
    createChat,
    updateChatTitle,
    deleteChat,
    refetch: fetchChats
  };
}

export function useMessages(chatId: string | null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (chatId) {
      fetchMessages();
      
      // Subscribe to realtime changes
      const subscription = supabase
        .channel(`messages-channel-${chatId}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${chatId}`
        }, () => {
          fetchMessages();
        })
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    } else {
      setMessages([]);
    }
  }, [chatId]);

  const fetchMessages = async () => {
    if (!chatId) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const addMessage = async (content: string, role: 'user' | 'assistant'): Promise<Message | null> => {
    if (!chatId) return null;

    try {
      const newMessage: NewMessage = {
        chat_id: chatId,
        content,
        role
      };

      const { data, error } = await supabase
        .from('messages')
        .insert(newMessage)
        .select()
        .single();

      if (error) {
        console.error('Database error saving message:', error);
        return null; // Return null instead of throwing to allow graceful fallback
      }
      
      // Update chat's updated_at timestamp
      await supabase
        .from('chats')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', chatId);
      
      return data;
    } catch (err: any) {
      console.error('Failed to save message:', err);
      return null; // Return null instead of throwing to allow graceful fallback
    }
  };

  return {
    messages,
    loading,
    error,
    addMessage,
    refetch: fetchMessages
  };
}