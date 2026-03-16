'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

interface Order {
  id: string;
  orderId: string;
  value: number;
  currency: string;
  status: string;
  trackingCode: string | null;
  createdAt: string;
  lead: { phone: string; name: string | null };
  product: { name: string } | null;
}

function statusBadgeClass(status: string): string {
  switch (status) {
    case 'awaiting_address': return 'bg-red-500/10 text-red-400 border border-red-500/20';
    case 'address_complete': return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
    case 'label_generated': return 'bg-sky-500/10 text-sky-400 border border-sky-500/20';
    case 'shipped': return 'bg-orange-500/10 text-orange-400 border border-orange-500/20';
    case 'delivered': return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
    case 'pending': return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
    case 'confirmed': return 'bg-sky-500/10 text-sky-400 border border-sky-500/20';
    case 'cancelled': return 'bg-red-500/10 text-red-400 border border-red-500/20';
    default: return 'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20';
  }
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  const loadOrders = () => {
    const query = statusFilter ? `?status=${statusFilter}` : '';
    apiFetch<{ data: Order[]; total: number; page: number; limit: number }>(`/orders${query}`)
      .then((res) => setOrders(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadOrders(); }, [statusFilter]);

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
        <h1 className="text-xl font-bold tracking-tight text-white">Pedidos</h1>
        <select
          className="rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-[13px] text-white placeholder-zinc-500 outline-none"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">Todos</option>
          <option value="pending">Pendente</option>
          <option value="confirmed">Confirmado</option>
          <option value="awaiting_address">Aguardando Endereço</option>
          <option value="address_complete">Endereço Completo</option>
          <option value="label_generated">Etiqueta Gerada</option>
          <option value="shipped">Enviado</option>
          <option value="delivered">Entregue</option>
          <option value="cancelled">Cancelado</option>
        </select>
      </div>

      <table className="w-full rounded-xl border border-white/[0.06] bg-[#111113]">
        <thead>
          <tr className="border-b border-white/[0.06] bg-white/[0.04] text-left text-sm text-zinc-500">
            <th className="p-3">Pedido</th>
            <th className="p-3">Lead</th>
            <th className="p-3">Produto</th>
            <th className="p-3">Valor</th>
            <th className="p-3">Status</th>
            <th className="p-3">Rastreio</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id} className="border-b border-white/[0.06] hover:bg-white/[0.04]">
              <td className="p-3 font-mono text-sm">{o.orderId}</td>
              <td className="p-3">{o.lead.name || o.lead.phone}</td>
              <td className="p-3">{o.product?.name || '—'}</td>
              <td className="p-3">R$ {o.value.toFixed(2)}</td>
              <td className="p-3">
                <span className={`rounded px-2 py-1 text-xs font-medium ${statusBadgeClass(o.status)}`}>
                  {o.status}
                </span>
              </td>
              <td className="p-3 font-mono text-sm">{o.trackingCode || '—'}</td>
            </tr>
          ))}
          {orders.length === 0 && (
            <tr><td colSpan={6} className="p-4 text-center text-zinc-500">Nenhum pedido</td></tr>
          )}
        </tbody>
      </table>
      </div>
    </div>
  );
}
