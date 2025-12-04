"use client";

import { useState } from 'react';
import { useChats } from '@/hooks/useChat';
import { PlusIcon, ChatBubbleLeftIcon, TrashIcon, PencilIcon, CheckIcon, XMarkIcon } from "@heroicons/react/24/outline";

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

  // Group chats by date
  const groupedChats = chats.reduce((groups, chat) => {
    const date = formatDate(chat.updated_at);
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(chat);
    return groups;
  }, {} as Record<string, typeof chats>);

  return (
    <div className="w-72 h-full bg-gradient-to-b from-slate-50 to-white border-r border-slate-200 flex flex-col">
      {/* Header */}
      <div className="p-4">
        <button
          onClick={handleNewChat}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
        >
          <PlusIcon className="h-5 w-5" />
          New Chat
        </button>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto px-3 pb-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <div className="relative h-10 w-10 mb-3">
              <div className="absolute inset-0 rounded-full border-2 border-indigo-200" />
              <div className="absolute inset-0 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
            </div>
            <p className="text-sm">Loading chats...</p>
          </div>
        ) : chats.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <div className="h-16 w-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
              <ChatBubbleLeftIcon className="h-8 w-8 text-slate-300" />
            </div>
            <p className="text-sm font-medium text-slate-500">No conversations yet</p>
            <p className="text-xs mt-1 text-slate-400">Start a new chat to begin</p>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(groupedChats).map(([date, dateChats]) => (
              <div key={date}>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-2 mb-2">
                  {date}
                </p>
                <div className="space-y-1">
                  {dateChats.map((chat) => (
                    <div
                      key={chat.id}
                      className={`group relative flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200 ${
                        currentChatId === chat.id
                          ? 'bg-indigo-50 border border-indigo-200 shadow-sm'
                          : 'hover:bg-slate-100 border border-transparent'
                      }`}
                      onClick={() => onChatSelect(chat.id)}
                    >
                      {/* Chat icon */}
                      <div className={`flex-shrink-0 h-8 w-8 rounded-lg flex items-center justify-center ${
                        currentChatId === chat.id
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-200 text-slate-500 group-hover:bg-slate-300'
                      } transition-colors`}>
                        <ChatBubbleLeftIcon className="h-4 w-4" />
                      </div>
                      
                      <div className="flex-1 min-w-0 py-0.5">
                        {editingChatId === chat.id ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="text"
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  handleSaveTitle(chat.id);
                                } else if (e.key === 'Escape') {
                                  setEditingChatId(null);
                                  setEditTitle('');
                                }
                              }}
                              className="flex-1 bg-white border border-indigo-300 rounded-lg px-2 py-1 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20"
                              autoFocus
                              onClick={(e) => e.stopPropagation()}
                            />
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSaveTitle(chat.id);
                              }}
                              className="p-1 text-green-600 hover:bg-green-50 rounded-md transition-colors"
                            >
                              <CheckIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingChatId(null);
                                setEditTitle('');
                              }}
                              className="p-1 text-slate-400 hover:bg-slate-100 rounded-md transition-colors"
                            >
                              <XMarkIcon className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <p className={`text-sm font-medium truncate ${
                              currentChatId === chat.id ? 'text-indigo-900' : 'text-slate-700'
                            }`}>
                              {chat.title}
                            </p>
                          </>
                        )}
                      </div>
                      
                      {/* Action buttons - show on hover */}
                      {editingChatId !== chat.id && (
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 absolute right-2 top-1/2 -translate-y-1/2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditTitle(chat.id, chat.title);
                            }}
                            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-white rounded-lg transition-all shadow-sm border border-slate-200"
                            title="Edit title"
                          >
                            <PencilIcon className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteChat(chat.id);
                            }}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all shadow-sm border border-slate-200 hover:border-red-200"
                            title="Delete chat"
                          >
                            <TrashIcon className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-slate-200 bg-white">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          <span>{chats.length} conversation{chats.length !== 1 ? 's' : ''}</span>
        </div>
      </div>
    </div>
  );
}