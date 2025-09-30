"use client";

import { useState } from 'react';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import ChatSidebar from '@/components/chat/ChatSidebar';

interface MobileSidebarProps {
  currentChatId?: string;
  onChatSelect: (chatId: string) => void;
  onNewChat: () => void;
}

export default function MobileSidebar({ currentChatId, onChatSelect, onNewChat }: MobileSidebarProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleChatSelect = (chatId: string) => {
    onChatSelect(chatId);
    setIsOpen(false); // Close sidebar on mobile after selection
  };

  const handleNewChat = () => {
    onNewChat();
    setIsOpen(false); // Close sidebar on mobile after creating new chat
  };

  return (
    <>
      {/* Mobile sidebar toggle button */}
      <button
        onClick={() => setIsOpen(true)}
        className="lg:hidden fixed top-20 left-4 z-50 p-2 bg-[rgb(var(--background))] border border-[rgb(var(--border))] rounded-lg shadow-sm"
      >
        <Bars3Icon className="h-5 w-5" />
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          lg:relative lg:translate-x-0 lg:block
          fixed top-0 left-0 h-full z-50 
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="h-full bg-[rgb(var(--background))] lg:bg-transparent">
          {/* Close button for mobile */}
          <div className="lg:hidden flex justify-end p-4">
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 hover:bg-[rgb(var(--muted))] rounded-lg transition-colors"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
          
          <ChatSidebar
            currentChatId={currentChatId}
            onChatSelect={handleChatSelect}
            onNewChat={handleNewChat}
          />
        </div>
      </div>
    </>
  );
}