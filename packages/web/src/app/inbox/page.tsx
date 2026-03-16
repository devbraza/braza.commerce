'use client';

import { useEffect, useState } from 'react';
import { ShoppingCart, CreditCard, CheckCircle, Send } from 'lucide-react';
import { apiFetch } from '@/lib/api';

interface ConversationItem {
  id: string;
  unreadCount: number;
  lastMessageAt: string | null;
  lead: {
    phone: string;
    name: string | null;
    status: string;
    product: { name: string } | null;
    campaign: { name: string; creativeName: string | null } | null;
  };
  messages: Array<{ content: string; createdAt: string }>;
}

interface Message {
  id: string;
  content: string;
  direction: string;
  type: string;
  createdAt: string;
}

const EVENT_BUTTONS = [
  {
    type: 'AddToCart',
    label: 'AddToCart',
    className: 'bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20',
    icon: ShoppingCart,
  },
  {
    type: 'InitiateCheckout',
    label: 'Checkout',
    className: 'bg-orange-500/10 text-orange-400 border border-orange-500/20 hover:bg-orange-500/20',
    icon: CreditCard,
  },
  {
    type: 'Purchase',
    label: 'Purchase',
    className: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20',
    icon: CheckCircle,
  },
];

export default function InboxPage() {
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [firedEvents, setFiredEvents] = useState<Set<string>>(new Set());
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    apiFetch<ConversationItem[]>('/conversations')
      .then(setConversations)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const deleteSelected = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Excluir ${selectedIds.size} conversa(s)? Mensagens serão apagadas.`)) return;
    setDeleting(true);
    try {
      await Promise.all(Array.from(selectedIds).map(id => apiFetch(`/conversations/${id}`, { method: 'DELETE' })));
      setConversations(prev => prev.filter(c => !selectedIds.has(c.id)));
      if (selected && selectedIds.has(selected)) {
        setSelected(null);
        setMessages([]);
      }
      setSelectedIds(new Set());
    } catch { /* ignore */ }
    finally { setDeleting(false); }
  };

  const selectedConv = conversations.find((c) => c.id === selected);

  const selectConversation = async (id: string) => {
    setSelected(id);
    setFiredEvents(new Set());
    const msgs = await apiFetch<Message[]>(`/conversations/${id}/messages`);
    setMessages(msgs);
  };

  const sendMessage = async () => {
    if (!selected || !newMessage.trim()) return;
    await apiFetch(`/conversations/${selected}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content: newMessage }),
    });
    setNewMessage('');
    const msgs = await apiFetch<Message[]>(`/conversations/${selected}/messages`);
    setMessages(msgs);
  };

  const fireEvent = async (type: string) => {
    if (!selected) return;
    const confirmed = confirm(`Marcar ${type} para ${selectedConv?.lead.name || selectedConv?.lead.phone}?`);
    if (!confirmed) return;

    const value = type === 'Purchase' ? (selectedConv?.lead.product as any)?.price : undefined;

    await apiFetch(`/conversations/${selected}/events`, {
      method: 'POST',
      body: JSON.stringify({ type, value }),
    });

    setFiredEvents((prev) => new Set(prev).add(type));
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-[#09090b] text-[#fafafa]">
        {/* Sidebar skeleton */}
        <div className="w-[30%] min-w-[280px] border-r border-white/[0.06] bg-[#0c0c0e]">
          <div className="border-b border-white/[0.06] p-4">
            <div className="h-5 bg-white/[0.06] rounded w-16 animate-pulse" />
          </div>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="border-b border-white/[0.06] px-4 py-3 animate-pulse">
              <div className="h-4 bg-white/[0.06] rounded w-32 mb-2" />
              <div className="h-3 bg-white/[0.06] rounded w-48" />
            </div>
          ))}
        </div>
        {/* Chat area skeleton */}
        <div className="flex flex-1 flex-col">
          <div className="border-b border-white/[0.06] bg-[#111113] px-4 py-3 animate-pulse">
            <div className="h-4 bg-white/[0.06] rounded w-40 mb-2" />
            <div className="h-3 bg-white/[0.06] rounded w-64" />
          </div>
          <div className="flex-1 p-4 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className={`animate-pulse ${i % 2 === 0 ? '' : 'flex justify-end'}`}>
                <div className={`h-10 bg-white/[0.06] rounded-xl ${i % 2 === 0 ? 'w-56' : 'w-44'}`} />
              </div>
            ))}
          </div>
          <div className="border-t border-white/[0.06] bg-[#0c0c0e] p-3">
            <div className="h-10 bg-white/[0.06] rounded-lg animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#09090b] text-[#fafafa]">
      {/* Conversation list — 30% width (FR9) */}
      <div className="w-[30%] min-w-[280px] overflow-y-auto border-r border-white/[0.06] bg-[#0c0c0e]">
        <div className="border-b border-white/[0.06] p-4 flex items-center justify-between">
          <h2 className="text-[15px] font-semibold text-white">Inbox</h2>
          {selectedIds.size > 0 && (
            <button
              onClick={deleteSelected}
              disabled={deleting}
              className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-1 text-[11px] font-medium text-red-400 hover:bg-red-500/20 disabled:opacity-50"
            >
              {deleting ? '...' : `Excluir (${selectedIds.size})`}
            </button>
          )}
        </div>
        {conversations.map((c) => (
          <div
            key={c.id}
            className={`flex items-center gap-2 cursor-pointer border-b border-white/[0.06] px-3 py-3 hover:bg-white/[0.04] ${
              selected === c.id ? 'bg-white/[0.08]' : ''
            }`}
          >
            <input
              type="checkbox"
              checked={selectedIds.has(c.id)}
              onChange={() => toggleSelect(c.id)}
              onClick={(e) => e.stopPropagation()}
              className="accent-indigo-500 cursor-pointer flex-shrink-0"
            />
            <div className="flex-1 min-w-0" onClick={() => selectConversation(c.id)}>
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-medium text-white truncate">
                  {c.lead.name || c.lead.phone}
                  {c.lead.product && (
                    <span className="ml-1.5 text-zinc-500">[{c.lead.product.name}]</span>
                  )}
                </span>
                {c.unreadCount > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-500 px-1.5 text-[10px] font-semibold text-white flex-shrink-0">
                    {c.unreadCount}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
        {conversations.length === 0 && (
          <p className="p-6 text-center text-[13px] text-zinc-500">
            Nenhuma conversa ainda — crie uma campanha e compartilhe o link
          </p>
        )}
      </div>

      {/* Chat view — 70% width */}
      <div className="flex flex-1 flex-col">
        {selected && selectedConv ? (
          <>
            {/* FR10: Header with lead, product, campaign, creative */}
            <div className="border-b border-white/[0.06] bg-[#111113] px-4 py-3">
              <p className="text-[13px] font-medium text-white">
                {selectedConv.lead.name || selectedConv.lead.phone}
              </p>
              <div className="mt-1 flex gap-3 text-[11px] text-zinc-500">
                {selectedConv.lead.product && (
                  <span>Produto: <span className="text-zinc-400">{selectedConv.lead.product.name}</span></span>
                )}
                {selectedConv.lead.campaign && (
                  <span>Campanha: <span className="text-zinc-400">{selectedConv.lead.campaign.name}</span></span>
                )}
                {selectedConv.lead.campaign?.creativeName && (
                  <span>Criativo: <span className="text-zinc-400">{selectedConv.lead.campaign.creativeName}</span></span>
                )}
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`max-w-[70%] rounded-xl px-3 py-2 text-[13px] ${
                    m.direction === 'inbound'
                      ? 'bg-white/[0.08] text-white'
                      : 'bg-emerald-600 text-white ml-auto'
                  }`}
                >
                  <p>{m.content}</p>
                  <p className="mt-1 text-[10px] opacity-50">
                    {new Date(m.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              ))}
            </div>

            {/* FR11: Event buttons */}
            <div className="flex gap-2 border-t border-white/[0.06] bg-[#111113] px-4 py-2">
              {EVENT_BUTTONS.map((btn) => {
                const Icon = btn.icon;
                const fired = firedEvents.has(btn.type);
                return (
                  <button
                    key={btn.type}
                    onClick={() => fireEvent(btn.type)}
                    disabled={fired}
                    className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-[12px] font-semibold transition-colors ${
                      fired ? 'opacity-50 cursor-not-allowed' : ''
                    } ${btn.className}`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {fired ? `${btn.label} ✓` : btn.label}
                  </button>
                );
              })}
            </div>

            {/* Input */}
            <div className="border-t border-white/[0.06] bg-[#0c0c0e] p-3 flex gap-2">
              <input
                className="flex-1 rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-[13px] text-white placeholder-zinc-500 outline-none focus:border-white/[0.16]"
                placeholder="Digite sua mensagem..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              />
              <button
                onClick={sendMessage}
                className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-[13px] font-medium text-white hover:bg-emerald-700"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center text-zinc-500 text-[13px]">
            Selecione uma conversa
          </div>
        )}
      </div>
    </div>
  );
}
