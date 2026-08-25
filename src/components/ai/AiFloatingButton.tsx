import React, { useState, useEffect } from 'react';
import { Bot } from 'lucide-react';
import { AiChatModal } from './AiChatModal';

export const AiFloatingButton: React.FC = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  // Global Keyboard shortcut listener (Ctrl+J or Cmd+J)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'j') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 group flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-[#2012ad] to-[#4837ea] hover:from-[#1a0e90] hover:to-[#3826cb] text-white rounded-full shadow-xl shadow-indigo-600/30 hover:shadow-2xl hover:shadow-indigo-600/50 hover:-translate-y-0.5 transition-all duration-200 border border-white/20 select-none"
        title="Open AI Business Assistant (Ctrl + J)"
      >
        <div className="relative">
          <Bot className="w-5 h-5 group-hover:scale-110 transition-transform" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 rounded-full animate-ping" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 rounded-full" />
        </div>
        <span className="font-bold text-xs sm:text-sm tracking-tight">AI Assistant</span>
        <span className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-white/20 rounded-md text-indigo-100">
          Ctrl+J
        </span>
      </button>

      <AiChatModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
};
