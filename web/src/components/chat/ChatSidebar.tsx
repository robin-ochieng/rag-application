"use client";

import { useState } from 'react';
import { useChats } from '@/hooks/useChat';
import { PlusIcon, ChatBubbleLeftIcon, EllipsisVerticalIcon, TrashIcon, PencilIcon } from '@heroicons/react/24/outline';

interface ChatSidebarProps {
  currentChatId?: string;
  onChatSelect: (chatId: string) => void;
  onNewChat: () => void;
}

export default function ChatSidebar({ currentChatId, onChatSelect, onNewChat }: ChatSidebarProps) {
  const { chats, loading, createChat, updateChatTitle, deleteChat } = useChats();
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const handleNewChat = async () => {
    const newChat = await createChat();
    if (newChat) {
      onNewChat();
      onChatSelect(newChat.id);
    }
  };

  const handleEditTitle = (chatId: string, currentTitle: string) => {
    setEditingChatId(chatId);
    setEditTitle(currentTitle);
  };

  const handleSaveTitle = async (chatId: string) => {
    if (editTitle.trim()) {
      // Pass true to indicate this is a manual edit
      await updateChatTitle(chatId, editTitle.trim(), true);
    }
    setEditingChatId(null);
    setEditTitle('');
  };

  const handleDeleteChat = async (chatId: string) => {
    if (confirm('Are you sure you want to delete this chat?')) {
      await deleteChat(chatId);
      if (currentChatId === chatId) {
        onNewChat(); // Reset to new chat if current chat is deleted
      }
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) {
      return 'Today';
    } else if (diffInDays === 1) {
      return 'Yesterday';
    } else if (diffInDays < 7) {
      return `${diffInDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <div className="w-64 h-full bg-[rgb(var(--card))] border-r border-[rgb(var(--border))] flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-[rgb(var(--border))]">
        <button
          onClick={handleNewChat}
          className="w-full flex items-center gap-3 px-3 py-2 text-sm font-semibold text-[rgb(var(--primary-foreground))] bg-[rgb(var(--primary))] hover:bg-[rgb(var(--primary))]/90 rounded-lg transition-colors"
        >
          <PlusIcon className="h-4 w-4" />
          New Chat
        </button>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 text-center text-[rgb(var(--muted-foreground))]">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[rgb(var(--primary))] mx-auto mb-2"></div>
            Loading chats...
          </div>
        ) : chats.length === 0 ? (
          <div className="p-4 text-center text-[rgb(var(--muted-foreground))]">
            <ChatBubbleLeftIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No chats yet</p>
            <p className="text-xs mt-1">Start a conversation!</p>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {chats.map((chat) => (
              <div
                key={chat.id}
                className={`group relative flex items-center p-3 rounded-lg cursor-pointer transition-colors ${
                  currentChatId === chat.id
                    ? 'bg-[rgb(var(--accent))] text-[rgb(var(--accent-foreground))]'
                    : 'hover:bg-[rgb(var(--muted))] text-[rgb(var(--foreground))]'
                }`}
                onClick={() => onChatSelect(chat.id)}
              >
                <div className="flex-1 min-w-0">
                  {editingChatId === chat.id ? (
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onBlur={() => handleSaveTitle(chat.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleSaveTitle(chat.id);
                        } else if (e.key === 'Escape') {
                          setEditingChatId(null);
                          setEditTitle('');
                        }
                      }}
                      className="w-full bg-transparent border-none outline-none text-sm font-medium"
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate flex-1">{chat.title}</p>
                        {chat.title_auto_generated && (
                          <span 
                            className="text-xs text-[rgb(var(--muted-foreground))] opacity-60"
                            title="Auto-generated title"
                          >
                            🤖
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[rgb(var(--muted-foreground))] mt-1">
                        {formatDate(chat.updated_at)}
                      </p>
                    </>
                  )}
                </div>
                
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditTitle(chat.id, chat.title);
                      }}
                      className="p-1 hover:bg-[rgb(var(--muted))] rounded transition-colors"
                      title="Edit title"
                    >
                      <PencilIcon className="h-3 w-3" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteChat(chat.id);
                      }}
                      className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 rounded transition-colors"
                      title="Delete chat"
                    >
                      <TrashIcon className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}