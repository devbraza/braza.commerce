'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

interface EventItem {
  id: string;
  eventId: string;
  type: string;
  value: number | null;
  currency: string;
  sentToMeta: boolean;
  createdAt: string;
  lead: { phone: string; name: string | null };
}

export default function EventsPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<{ data: EventItem[]; total: number; page: number; limit: number }>('/events')
      .then((res) => setEvents(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const retryFailed = async () => {
    await apiFetch('/events/retry', { method: 'POST' });
    const updated = await apiFetch<{ data: EventItem[]; total: number; page: number; limit: number }>('/events');
    setEvents(updated.data);
  };

  if (loading) return (
    <div className="min-h-screen bg-[#09090b] p-6 text-[#fafafa]">
      <div className="max-w-5xl mx-auto">
        <div className="h-7 bg-white/[0.06] rounded w-40 mb-6 animate-pulse" />
        <div className="rounded-xl border border-white/[0.06] bg-[#111113] overflow-hidden">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-4 p-4 border-b border-white/[0.06] animate-pulse">
              <div className="h-4 bg-white/[0.06] rounded w-32" />
              <div className="h-4 bg-white/[0.06] rounded w-24" />
              <div className="h-4 bg-white/[0.06] rounded w-20" />
              <div className="h-4 bg-white/[0.06] rounded w-16" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#09090b] p-6 text-[#fafafa]">
      <div className="max-w-5xl mx-auto">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight text-white">Eventos (CAPI)</h1>
        <button
          onClick={retryFailed}
          className="rounded-lg bg-orange-600 px-4 py-2 text-white hover:bg-orange-700 text-sm"
        >
          Reenviar falhos
        </button>
      </div>

      <table className="w-full rounded-xl border border-white/[0.06] bg-[#111113]">
        <thead>
          <tr className="border-b border-white/[0.06] bg-white/[0.04] text-left text-sm text-zinc-500">
            <th className="p-3">Tipo</th>
            <th className="p-3">Lead</th>
            <th className="p-3">Valor</th>
            <th className="p-3">Enviado Meta</th>
            <th className="p-3">Data</th>
          </tr>
        </thead>
        <tbody>
          {events.map((e) => (
            <tr key={e.id} className="border-b border-white/[0.06] hover:bg-white/[0.04]">
              <td className="p-3 font-medium">{e.type}</td>
              <td className="p-3">{e.lead.name || e.lead.phone}</td>
              <td className="p-3">{e.value ? `R$ ${e.value.toFixed(2)}` : '—'}</td>
              <td className="p-3">
                {e.sentToMeta
                  ? <span className="text-emerald-400 font-medium">Sim</span>
                  : <span className="text-red-400 font-medium">Não</span>}
              </td>
              <td className="p-3 text-sm text-zinc-500">{new Date(e.createdAt).toLocaleString('pt-BR')}</td>
            </tr>
          ))}
          {events.length === 0 && (
            <tr><td colSpan={5} className="p-4 text-center text-zinc-500">Nenhum evento</td></tr>
          )}
        </tbody>
      </table>
      </div>
    </div>
  );
}
