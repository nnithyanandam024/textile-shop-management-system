import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  Bot, 
  Send, 
  X, 
  Sparkles, 
  Loader2, 
  Trash2, 
  Copy, 
  Check, 
  ShieldCheck, 
  TrendingUp, 
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { AiApi, AiChatMessage, AiQuickPromptItem } from '../../api/aiApi';
import { useAuth } from '../../features/auth/AuthContext';

interface AiChatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AiChatModal: React.FC<AiChatModalProps> = ({ isOpen, onClose }) => {
  const { currentUser } = useAuth();
  const location = useLocation();
  const [messages, setMessages] = useState<AiChatMessage[]>(() => {
    return [
      {
        id: 'welcome_msg',
        sender: 'assistant',
        text: `👋 வணக்கம் **${currentUser?.displayName || 'பணியாளர்'}**! நான் உங்கள் **ரத்னா விலாஸ் AI அசிஸ்டன்ட் (Ratna AI Assistant)**.\n\nகடையின் நேரடி விற்பனை நிலவரம், குறைந்த இருப்பு எச்சரிக்கைகள், வேகமான விற்பனைப் பொருட்கள் மற்றும் வாடிக்கையாளர் விவரங்களை என்னிடம் தமிழில் அல்லது ஆங்கிலத்தில் கேட்கலாம்.\n\n*கீழே உள்ள கேள்விகளைத் தேர்ந்தெடுக்கலாம் அல்லது உங்கள் கேள்வியை உள்ளிடவும்:*`,
        generatedAt: new Date().toISOString(),
      },
    ];
  });

  const [inputMessage, setInputMessage] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [quickPrompts, setQuickPrompts] = useState<AiQuickPromptItem[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedSources, setExpandedSources] = useState<Record<string, boolean>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom of message list
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 150);
      loadPrompts();
    }
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const loadPrompts = async () => {
    try {
      const prompts = await AiApi.getQuickPrompts();
      setQuickPrompts(prompts);
    } catch {
      // Fallback
    }
  };

  const handleSendMessage = async (queryText?: string) => {
    const text = (queryText || inputMessage).trim();
    if (!text || loading) return;

    const userMsg: AiChatMessage = {
      id: `user_${Date.now()}`,
      sender: 'user',
      text,
      generatedAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setLoading(true);

    try {
      const res = await AiApi.sendMessage(text, location.pathname);
      if (res.success && res.data) {
        const incomingMsg = res.data;
        setMessages((prev) => [...prev, incomingMsg]);
      } else {
        const errorMsg: AiChatMessage = {
          id: `err_${Date.now()}`,
          sender: 'assistant',
          text: `⚠️ **Error:** ${res.error?.message || 'Unable to process your request. Please try again.'}`,
          generatedAt: new Date().toISOString(),
          isError: true,
        };
        setMessages((prev) => [...prev, errorMsg]);
      }
    } catch (err: any) {
      const errorMsg: AiChatMessage = {
        id: `err_${Date.now()}`,
        sender: 'assistant',
        text: `⚠️ **Connection Error:** ${err.message || 'Could not communicate with AI backend.'}`,
        generatedAt: new Date().toISOString(),
        isError: true,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearHistory = () => {
    setMessages([
      {
        id: `reset_${Date.now()}`,
        sender: 'assistant',
        text: `🧹 Conversation cleared. How can I assist you with your textile operations today?`,
        generatedAt: new Date().toISOString(),
      },
    ]);
  };

  const toggleSourceDetails = (msgId: string) => {
    setExpandedSources((prev) => ({ ...prev, [msgId]: !prev[msgId] }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/40 backdrop-blur-sm transition-opacity p-0 sm:p-4">
      {/* Click outside to close backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Main Drawer Container */}
      <div className="relative z-10 w-full sm:max-w-xl h-full sm:h-[92vh] bg-white sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200/80 animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-[#2012ad] via-[#3525cb] to-[#4837ea] text-white flex items-center justify-between shadow-md shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white p-0.5 border border-amber-300/80 flex items-center justify-center overflow-hidden shadow-inner shrink-0">
              <img src="/logo.png" alt="ரத்னா விலாஸ்" className="w-full h-full object-contain" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold tracking-tight">ரத்னா AI அசிஸ்டன்ட்</h2>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-400 text-slate-950 rounded-full uppercase tracking-wider shadow-sm">
                  Ratna AI
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-indigo-100/90 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
                <span>பாதுகாக்கப்பட்ட RBAC</span>
                <span>•</span>
                <span className="capitalize">{currentUser?.roleName || 'Cashier'} Mode</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handleClearHistory}
              title="Clear Conversation"
              className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-slate-50/50">
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            const isBusinessReport = msg.data?.type === 'daily_business_report';

            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-200/60 flex items-center justify-center text-[#2012ad] shrink-0 mt-0.5 shadow-sm">
                    <Bot className="w-4 h-4 text-[#2012ad]" />
                  </div>
                )}

                <div
                  className={`max-w-[88%] rounded-2xl p-4 text-xs sm:text-sm shadow-sm relative group ${
                    isUser
                      ? 'bg-[#2012ad] text-white rounded-br-xs font-medium'
                      : msg.isError
                      ? 'bg-red-50 border border-red-200 text-red-800 rounded-bl-xs'
                      : 'bg-white border border-slate-200/90 text-slate-800 rounded-bl-xs'
                  }`}
                >
                  {/* Rich Business Report Card (Structured Visual Representation) */}
                  {isBusinessReport && msg.data?.metrics && (
                    <div className="mb-3 p-3.5 bg-gradient-to-br from-indigo-50/80 via-white to-purple-50/50 border border-indigo-100 rounded-xl">
                      <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-indigo-100/80">
                        <div className="flex items-center gap-1.5 font-bold text-xs text-indigo-950 uppercase tracking-wider">
                          <TrendingUp className="w-4 h-4 text-[#2012ad]" />
                          <span>Executive Pulse</span>
                        </div>
                        <span className="text-[10px] font-semibold text-slate-500">Live Backend Data</span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 mb-2">
                        {Object.entries(msg.data.metrics).map(([k, v]) => (
                          <div key={k} className="bg-white/80 p-2 rounded-lg border border-slate-200/60">
                            <span className="block text-[10px] font-semibold text-slate-500 uppercase">{k}</span>
                            <span className="text-xs font-bold text-slate-900">{String(v)}</span>
                          </div>
                        ))}
                      </div>

                      {msg.data.aiInsight && (
                        <div className="p-2 bg-indigo-100/50 border border-indigo-200/60 rounded-lg text-[11px] font-medium text-indigo-900 flex items-start gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-[#2012ad] shrink-0 mt-0.5" />
                          <span>{msg.data.aiInsight}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Message Body Content formatted with basic markdown replacement */}
                  <div className="leading-relaxed whitespace-pre-wrap space-y-1">
                    {msg.text.split('\n').map((line, idx) => {
                      if (line.startsWith('### ')) {
                        return <p key={idx} className="font-bold text-sm text-slate-900 mt-2 mb-1">{line.replace('### ', '')}</p>;
                      }
                      if (line.startsWith('#### ')) {
                        return <p key={idx} className="font-semibold text-xs text-slate-800 mt-1.5 mb-0.5">{line.replace('#### ', '')}</p>;
                      }
                      if (line.startsWith('• ')) {
                        return (
                          <div key={idx} className="flex items-start gap-1.5 pl-1">
                            <span className="text-[#2012ad] font-bold">•</span>
                            <span>{line.replace('• ', '').replace(/\*\*(.*?)\*\*/g, '$1')}</span>
                          </div>
                        );
                      }
                      return <p key={idx}>{line.replace(/\*\*(.*?)\*\*/g, '$1')}</p>;
                    })}
                  </div>

                  {/* Source Citations & Audit Accordion for AI Transparency */}
                  {!isUser && msg.source && (
                    <div className="mt-3 pt-2.5 border-t border-slate-100 text-[11px]">
                      <button
                        onClick={() => toggleSourceDetails(msg.id)}
                        className="flex items-center gap-1 text-slate-500 hover:text-indigo-600 font-semibold transition-colors"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Based on verified store data</span>
                        {expandedSources[msg.id] ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>

                      {expandedSources[msg.id] && (
                        <div className="mt-2 p-2 bg-slate-50 rounded-lg border border-slate-200/70 text-[10px] text-slate-600 space-y-1">
                          <p><span className="font-semibold text-slate-700">Primary Source:</span> {msg.source}</p>
                          {msg.sourcesUsed && msg.sourcesUsed.length > 0 && (
                            <p><span className="font-semibold text-slate-700">Audit Trail:</span> {msg.sourcesUsed.join(' • ')}</p>
                          )}
                          <p className="text-slate-400 font-mono">Generated: {new Date(msg.generatedAt).toLocaleTimeString()}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Copy Button */}
                  {!isUser && (
                    <button
                      onClick={() => handleCopy(msg.id, msg.text)}
                      className="absolute top-2 right-2 p-1.5 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100 transition-all opacity-0 group-hover:opacity-100"
                      title="Copy Answer"
                    >
                      {copiedId === msg.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {/* Loading Indicator Bubble */}
          {loading && (
            <div className="flex gap-3 justify-start animate-fade-in">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-200/60 flex items-center justify-center text-[#2012ad] shrink-0 mt-0.5 shadow-sm">
                <Loader2 className="w-4 h-4 animate-spin text-[#2012ad]" />
              </div>
              <div className="bg-white border border-slate-200/90 rounded-2xl rounded-bl-xs p-4 shadow-sm flex items-center gap-2 text-xs font-semibold text-slate-600">
                <Sparkles className="w-4 h-4 text-amber-500 animate-bounce" />
                <span>ரத்னா AI தகவல்களை சரிபார்க்கிறது... (Ratna AI is querying store metrics...)</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Question Action Chips */}
        {quickPrompts.length > 0 && (
          <div className="p-3 bg-white border-t border-slate-200/80 shrink-0">
            <div className="flex items-center gap-1.5 mb-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Quick Role Inquiries:</span>
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {quickPrompts.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleSendMessage(item.prompt)}
                  disabled={loading}
                  className="px-3 py-1.5 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-200 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:text-[#2012ad] whitespace-nowrap transition-all flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Bar */}
        <div className="p-3 sm:p-4 bg-white border-t border-slate-200/80 shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <div className="relative flex-1">
              <input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Ask about sales, low stock, fast movers, attendance..."
                disabled={loading}
                className="w-full pl-4 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2012ad] focus:bg-white transition-all disabled:opacity-50"
              />
            </div>

            <button
              type="submit"
              disabled={!inputMessage.trim() || loading}
              className="p-3 bg-[#2012ad] hover:bg-[#1a0e90] text-white rounded-xl font-semibold shadow-md hover:shadow-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0 flex items-center justify-center"
              title="Send Message"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </button>
          </form>
          <div className="mt-2 text-[10px] text-center text-slate-400 flex items-center justify-center gap-2">
            <span>Powered by Ratna AI Engine (ரத்னா AI)</span>
            <span>•</span>
            <span>Financial numbers are exact from SQLite ledger</span>
          </div>
        </div>

      </div>
    </div>
  );
};
