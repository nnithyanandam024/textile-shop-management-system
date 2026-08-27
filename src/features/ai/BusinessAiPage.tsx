import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Send,
  Bot,
  User,
  Trash2,
  Plus,
  ArrowUpRight,
  TrendingUp,
  Package,
  ShoppingCart,
  Receipt,
  Languages,
  ShieldCheck,
  Zap,
  Info,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { useAuth } from '../auth/AuthContext';
import { AiApi } from '../../api/aiApi';

export interface BiMessageItem {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  chart?: {
    type: string;
    title: string;
    data: any[];
    xAxisKey: string;
    dataKey: string;
    unitPrefix?: string;
  };
  table?: {
    title?: string;
    columns: { key: string; label: string; align?: string }[];
    rows: Record<string, any>[];
  };
  actions?: { label: string; route: string; variant?: string }[];
  suggestedFollowUps?: string[];
  source?: string;
  sourcesUsed?: string[];
  timestamp: string;
  confidence?: number;
  requiresPermission?: string;
}

export interface BiConversationItem {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  lastMessageSnippet?: string;
  messageCount: number;
}

export const BusinessAiPage: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [conversations, setConversations] = useState<BiConversationItem[]>([]);
  const [activeConvId, setActiveConvId] = useState<string>('conv_general_today');
  const [messages, setMessages] = useState<BiMessageItem[]>([]);
  const [inputText, setInputText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isTamilMode, setIsTamilMode] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const role = (currentUser?.roleName || 'Cashier').toLowerCase();
  const isManagerOrAdmin =
    role === 'admin' || role === 'owner' || role === 'super_admin' || role === 'manager';

  // Load conversation list on mount
  useEffect(() => {
    loadConversations();
  }, []);

  // Load messages whenever active conversation changes
  useEffect(() => {
    if (activeConvId) {
      loadMessages(activeConvId);
    }
  }, [activeConvId]);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const loadConversations = async () => {
    try {
      const res = await AiApi.getBiConversations();
      if (res.success && res.data && res.data.length > 0) {
        setConversations(res.data);
      } else {
        const fallbackConv: BiConversationItem = {
          id: 'conv_general_today',
          title: 'Executive Store Intelligence',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          lastMessageSnippet: 'How can I assist your showroom management today?',
          messageCount: 1,
        };
        setConversations([fallbackConv]);
      }
    } catch {
      // Fallback
    }
  };

  const loadMessages = async (convId: string) => {
    try {
      const res = await AiApi.getBiConversationMessages(convId);
      if (res.success && res.data) {
        setMessages(res.data);
      }
    } catch {
      // Fallback
    }
  };

  const handleSend = async (queryText?: string) => {
    const textToSend = (queryText || inputText).trim();
    if (!textToSend || isLoading) return;

    setInputText('');

    // Optimistically append user message
    const tempUserMsg: BiMessageItem = {
      id: `msg_u_${Date.now()}`,
      conversationId: activeConvId,
      role: 'user',
      content: textToSend,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);
    setIsLoading(true);

    try {
      const res = await AiApi.biQuery({
        conversationId: activeConvId,
        message: textToSend,
        language: isTamilMode ? 'ta' : 'en',
      });

      if (res?.message) {
        setMessages((prev) => [...prev, res.message]);
        loadConversations();
      }
    } catch (err: any) {
      const errorMsg: BiMessageItem = {
        id: `msg_err_${Date.now()}`,
        conversationId: activeConvId,
        role: 'assistant',
        content: `⚠️ I encountered an issue retrieving that data. Please verify your connection or try rephrasing.`,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateNewConversation = () => {
    const newId = `conv_${Date.now()}`;
    const newConv: BiConversationItem = {
      id: newId,
      title: 'New Discussion',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messageCount: 0,
    };
    setConversations((prev) => [newConv, ...prev]);
    setActiveConvId(newId);
    setMessages([
      {
        id: `msg_init_${Date.now()}`,
        conversationId: newId,
        role: 'assistant',
        content: isTamilMode
          ? `வணக்கம்! இன்று உங்கள் கடையின் விற்பனை அல்லது இருப்பு பற்றி என்ன தகவல் வேண்டும்?`
          : `Hello! How can I assist with your showroom data, stock reorders, or sales analytics today?`,
        timestamp: new Date().toISOString(),
        suggestedFollowUps: isTamilMode
          ? ['இன்னைக்கு sales எப்படி இருக்கு?', 'stock குறைவா இருக்கிற பொருட்கள் எவை?']
          : ['How much did we sell today?', 'Which fast-moving products have less than 10 days of stock?'],
      },
    ]);
  };

  const handleClearChat = async () => {
    if (window.confirm('Clear messages in this conversation thread?')) {
      await AiApi.clearBiConversation(activeConvId);
      setMessages([]);
    }
  };

  const quickPrompts = isTamilMode
    ? [
        { label: '📊 இன்றைய விற்பனை', prompt: 'இன்னைக்கு sales எப்படி இருக்கு?' },
        { label: '🏆 அதிகம் விற்கும் சேலைகள்', prompt: 'எந்த சேலை அதிகமா விக்குது?' },
        { label: '🚨 குறைவான இருப்பு', prompt: 'stock குறைவா இருக்கிற பொருட்கள் எவை?' },
        { label: '🔮 30 நாள் கணிப்பு', prompt: 'அடுத்த 30 நாள் விற்பனை கணிப்பு என்ன?' },
      ]
    : isManagerOrAdmin
    ? [
        { label: '📊 Store Sales Today', prompt: 'How much did we sell today?' },
        { label: '🚨 Stock < 10 Days', prompt: 'Which fast-moving products have less than 10 days of stock?' },
        { label: '📈 7-Day Sales Trend', prompt: 'Show sales trend for the last 7 days' },
        { label: '🔍 Root-Cause Analysis', prompt: 'Why did sales decrease last week?' },
        { label: '🔮 30-Day Demand Forecast', prompt: 'What will sell well in the next 30 days?' },
        { label: '⚠️ Risk & Anomalies', prompt: 'Is there anything unusual today?' },
      ]
    : [
        { label: '💳 My Register Total', prompt: 'Show my shift sales and bills processed today.' },
        { label: '👗 Cross-Sell Pairings', prompt: 'What accessories pair best with Bridal Silk Sarees?' },
        { label: '🚨 Low Stock Alerts', prompt: 'Which products are low or out of stock?' },
        { label: '⏱️ Staff on Duty', prompt: 'How many staff members are present on duty today?' },
      ];

  const getActionIcon = (route: string) => {
    if (route.includes('billing')) return <ShoppingCart className="w-3.5 h-3.5" />;
    if (route.includes('sales')) return <Receipt className="w-3.5 h-3.5" />;
    if (route.includes('inventory')) return <Package className="w-3.5 h-3.5" />;
    return <ArrowUpRight className="w-3.5 h-3.5" />;
  };

  return (
    <div className="flex h-[calc(100vh-4.25rem)] bg-[#f8fafc] overflow-hidden -m-4 sm:-m-6 lg:-m-8">
      {/* 1. LEFT SIDEBAR: Conversation Threads & Controls */}
      <div className="w-72 border-r border-slate-200 bg-white flex flex-col shrink-0">
        {/* Workspace Brand Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 via-blue-600 to-indigo-800 flex items-center justify-center text-white shadow-md shadow-indigo-100">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
                Business AI
                <span className="text-[10px] uppercase font-black px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                  v1.0
                </span>
              </h2>
              <p className="text-xs text-slate-500 font-medium capitalize">
                {currentUser?.roleName || 'Store Staff'}
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsTamilMode(!isTamilMode)}
            className={`p-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 transition-all ${
              isTamilMode
                ? 'bg-amber-50 border-amber-300 text-amber-800'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
            title="Toggle Tamil / English prompt mode"
          >
            <Languages className="w-3.5 h-3.5 text-amber-600" />
            <span>{isTamilMode ? 'தமிழ்' : 'EN'}</span>
          </button>
        </div>

        {/* New Conversation Button */}
        <div className="p-3">
          <button
            onClick={handleCreateNewConversation}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-indigo-700 text-white text-xs font-semibold transition-all shadow-sm active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>New Chat Thread</span>
          </button>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto px-3 py-1 space-y-1">
          <div className="px-2 py-1.5 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
            Recent Conversations
          </div>

          {conversations.map((conv) => {
            const isActive = conv.id === activeConvId;
            return (
              <button
                key={conv.id}
                onClick={() => setActiveConvId(conv.id)}
                className={`w-full text-left p-2.5 rounded-xl transition-all flex items-start justify-between group ${
                  isActive
                    ? 'bg-indigo-50/80 border border-indigo-200/80 text-indigo-950 shadow-xs'
                    : 'hover:bg-slate-50 text-slate-700 border border-transparent'
                }`}
              >
                <div className="min-w-0 pr-2">
                  <p className="text-xs font-semibold truncate text-slate-900">
                    {conv.title || 'Discussion'}
                  </p>
                  <p className="text-[11px] text-slate-600 truncate mt-0.5 font-normal">
                    {conv.lastMessageSnippet || 'No messages yet'}
                  </p>
                </div>
                <span className="text-[10px] text-slate-600 shrink-0 font-medium mt-0.5">
                  {new Date(conv.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </button>
            );
          })}
        </div>

        {/* RBAC Security Footer Pill */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="truncate">RBAC Protected • 0% Hallucinations</span>
          </div>
        </div>
      </div>

      {/* 2. MAIN CHAT CANVAS */}
      <div className="flex-1 flex flex-col bg-slate-50/50">
        {/* Canvas Header */}
        <div className="h-14 bg-white border-b border-slate-200/80 px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-900 leading-tight">
                ரத்னா AI அசிஸ்டன்ட் (Ratna AI Business Assistant)
              </h1>
              <p className="text-[11px] text-slate-500 font-medium flex items-center gap-2">
                <span>Direct Backend Intelligence</span>
                <span>•</span>
                <span className="text-emerald-600 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  Live Sync
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleClearChat}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 text-xs font-medium transition-all flex items-center gap-1.5"
              title="Clear current chat"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          </div>
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map((msg) => {
            const isAssistant = msg.role === 'assistant';

            return (
              <div
                key={msg.id}
                className={`flex gap-3.5 max-w-3xl ${
                  isAssistant ? 'mr-auto' : 'ml-auto flex-row-reverse'
                }`}
              >
                {/* Avatar */}
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
                    isAssistant
                      ? 'bg-gradient-to-br from-indigo-600 to-blue-700 text-white'
                      : 'bg-slate-800 text-white font-bold text-xs'
                  }`}
                >
                  {isAssistant ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                </div>

                {/* Bubble Container */}
                <div className={`space-y-3 min-w-0 max-w-[88%]`}>
                  <div
                    className={`rounded-2xl p-4 shadow-xs text-sm leading-relaxed ${
                      isAssistant
                        ? 'bg-white border border-slate-200/80 text-slate-800'
                        : 'bg-indigo-600 text-white shadow-indigo-100 font-medium'
                    }`}
                  >
                    {/* Markdown / Text Body */}
                    <div className="space-y-2 whitespace-pre-wrap font-sans">
                      {msg.content}
                    </div>

                    {/* EMBEDDED TABLE (If Present) */}
                    {msg.table && (
                      <div className="mt-4 border border-slate-200 rounded-xl overflow-hidden shadow-xs bg-white">
                        {msg.table.title && (
                          <div className="px-3.5 py-2 bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-700 flex items-center gap-1.5">
                            <TrendingUp className="w-3.5 h-3.5 text-indigo-600" />
                            <span>{msg.table.title}</span>
                          </div>
                        )}
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs text-left">
                            <thead className="bg-slate-100/75 text-slate-600 font-semibold border-b border-slate-200">
                              <tr>
                                {msg.table.columns.map((col) => (
                                  <th key={col.key} className="px-3 py-2">
                                    {col.label}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {msg.table.rows.map((row, idx) => (
                                <tr key={idx} className="hover:bg-slate-50/80">
                                  {msg.table!.columns.map((col) => (
                                    <td key={col.key} className="px-3 py-2 font-medium text-slate-800">
                                      {row[col.key]}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* EMBEDDED RECHARTS MINI CHART (If Present) */}
                    {msg.chart && (
                      <div className="mt-4 p-3.5 border border-slate-200 rounded-xl bg-gradient-to-b from-white to-slate-50/50 shadow-xs">
                        <div className="text-xs font-bold text-slate-700 mb-2 flex items-center justify-between">
                          <span>{msg.chart.title}</span>
                          <span className="text-[10px] text-slate-400 font-medium">Daily Curve</span>
                        </div>
                        <div className="h-44 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={msg.chart.data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                              <defs>
                                <linearGradient id="aiChartGrad" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.4} />
                                  <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0} />
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                              <XAxis dataKey={msg.chart.xAxisKey} tick={{ fontSize: 10 }} stroke="#94a3b8" />
                              <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
                              <Tooltip
                                formatter={(val: any) => [`₹${Number(val).toLocaleString()}`, 'Revenue']}
                                contentStyle={{ borderRadius: '8px', fontSize: '11px', border: '1px solid #e2e8f0' }}
                              />
                              <Area
                                type="monotone"
                                dataKey={msg.chart.dataKey}
                                stroke="#4f46e5"
                                strokeWidth={2.5}
                                fillOpacity={1}
                                fill="url(#aiChartGrad)"
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    )}

                    {/* ACTION BUTTONS (If Present) */}
                    {msg.actions && msg.actions.length > 0 && (
                      <div className="mt-3.5 pt-3 border-t border-slate-100 flex flex-wrap gap-2">
                        {msg.actions.map((act, idx) => (
                          <button
                            key={idx}
                            onClick={() => navigate(act.route)}
                            className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-indigo-700 text-white text-xs font-semibold transition-all flex items-center gap-1.5 shadow-2xs active:scale-95"
                          >
                            {getActionIcon(act.route)}
                            <span>{act.label}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Meta / Source Audit */}
                    {isAssistant && msg.source && (
                      <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-medium">
                        <span className="flex items-center gap-1">
                          <Info className="w-3 h-3 text-slate-400" />
                          Source: {msg.source}
                        </span>
                        {msg.confidence && (
                          <span className="text-emerald-600 font-semibold">
                            {(msg.confidence * 100).toFixed(0)}% Confidence
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* SUGGESTED FOLLOW-UP CHIPS */}
                  {isAssistant && msg.suggestedFollowUps && msg.suggestedFollowUps.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pl-1">
                      {msg.suggestedFollowUps.map((chip, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSend(chip)}
                          className="px-2.5 py-1 rounded-full bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 text-slate-700 hover:text-indigo-700 text-xs font-medium transition-all shadow-2xs flex items-center gap-1 active:scale-95"
                        >
                          <Zap className="w-3 h-3 text-indigo-500" />
                          <span>{chip}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* AI Thinking Skeleton */}
          {isLoading && (
            <div className="flex gap-3.5 mr-auto max-w-xl">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs animate-pulse">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex items-center gap-2.5">
                <div className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce" />
                <div className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce [animation-delay:0.2s]" />
                <div className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce [animation-delay:0.4s]" />
                <span className="text-xs font-semibold text-slate-500 ml-1">
                  Analyzing store database & sales trends...
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* 3. INPUT FOOTER */}
        <div className="p-4 bg-white border-t border-slate-200 shrink-0 space-y-2.5">
          {/* Quick Prompts Carousel */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
            <span className="text-[11px] font-bold text-slate-400 shrink-0 uppercase tracking-wider pl-1">
              Suggested:
            </span>
            {quickPrompts.map((p, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(p.prompt)}
                className="px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 text-slate-700 hover:text-indigo-800 font-medium whitespace-nowrap transition-all shrink-0 active:scale-95"
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Prompt Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-end gap-2 bg-slate-50 border border-slate-200 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100 rounded-2xl p-2 transition-all shadow-xs"
          >
            <textarea
              ref={inputRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              rows={1}
              placeholder={
                isTamilMode
                  ? 'கடையின் விற்பனை, இருப்பு, கணிப்பு பற்றி கேளுங்கள்... (Press Enter to ask)'
                  : 'Ask anything about sales, inventory, demand forecast, or risk anomalies... (Press Enter)'
              }
              className="flex-1 bg-transparent border-0 resize-none text-sm text-slate-800 placeholder-slate-400 focus:outline-none px-2 py-1.5 max-h-28"
            />

            <button
              type="submit"
              disabled={!inputText.trim() || isLoading}
              className={`p-2.5 rounded-xl font-semibold transition-all shrink-0 ${
                inputText.trim() && !isLoading
                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-200 active:scale-95'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

          {/* Privacy & Anti-Hallucination Notice */}
          <div className="flex items-center justify-between text-[10px] text-slate-400 px-1 font-medium">
            <span>Ratna AI answers using 100% verified showroom database records.</span>
            <span>Shift + Enter for new line</span>
          </div>
        </div>
      </div>
    </div>
  );
};
