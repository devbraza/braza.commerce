'use client';

import { useEffect, useState, useMemo } from 'react';
import { apiFetch } from '@/lib/api';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Lead {
  id: string;
  phone: string;
  name: string | null;
  status: string;
  createdAt: string;
  campaign: { name: string } | null;
  product: { name: string } | null;
  click: {
    utmSource: string | null;
    utmMedium: string | null;
    utmCampaign: string | null;
    utmContent: string | null;
    utmTerm: string | null;
  } | null;
  lastEventType: string | null;
  lastEventAt: string | null;
  lastMessageAt: string | null;
  _count: { conversations: number; events: number; orders: number };
}

interface Campaign {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
}

type SortKey = 'createdAt' | 'lastMessageAt' | 'lastEventAt';
type SortDir = 'asc' | 'desc';

// ─── Constants ───────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  new: 'Novo',
  contacted: 'Contactado',
  converted: 'Convertido',
  lost: 'Perdido',
  unmatched: 'Sem match',
};

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-sky-500/10 text-sky-400 border border-sky-500/20',
  contacted: 'bg-violet-500/10 text-violet-400 border border-violet-500/20',
  converted: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
  lost: 'bg-red-500/10 text-red-400 border border-red-500/20',
  unmatched: 'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20',
};

const EVENT_COLORS: Record<string, string> = {
  ViewContent: 'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20',
  AddToCart: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
  InitiateCheckout: 'bg-orange-500/10 text-orange-400 border border-orange-500/20',
  Purchase: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' }) +
    ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function exportCsv(leads: Lead[]) {
  const headers = [
    'Telefone', 'Nome', 'Status', 'Campanha', 'Produto',
    'Fonte (UTM Source)', 'Mídia (UTM Medium)', 'Campanha UTM',
    'Criativo (UTM Content)', 'Termo (UTM Term)',
    'Último Evento', 'Última Msg', 'Criado em',
  ];

  const rows = leads.map((l) => [
    l.phone,
    l.name ?? '',
    STATUS_LABELS[l.status] ?? l.status,
    l.campaign?.name ?? '',
    l.product?.name ?? '',
    l.click?.utmSource ?? '',
    l.click?.utmMedium ?? '',
    l.click?.utmCampaign ?? '',
    l.click?.utmContent ?? '',
    l.click?.utmTerm ?? '',
    l.lastEventType ?? '',
    l.lastMessageAt ? new Date(l.lastMessageAt).toISOString() : '',
    new Date(l.createdAt).toISOString(),
  ]);

  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `leads-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function KpiCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-[#111113] rounded-xl border border-white/[0.06] px-4 py-3 flex flex-col gap-1 min-w-[100px]">
      <span className="text-xs text-zinc-500">{label}</span>
      <span className="text-xl font-bold text-white">{value}</span>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`rounded px-2 py-1 text-xs font-medium ${STATUS_COLORS[status] ?? STATUS_COLORS.unmatched}`}>
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

function EventBadge({ type }: { type: string | null }) {
  if (!type) return <span className="text-zinc-600">—</span>;
  return (
    <span className={`rounded px-2 py-1 text-xs font-medium ${EVENT_COLORS[type] ?? 'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20'}`}>
      {type}
    </span>
  );
}

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <span className="ml-1 text-zinc-600">↕</span>;
  return <span className="ml-1 text-white">{dir === 'asc' ? '▲' : '▼'}</span>;
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCampaign, setFilterCampaign] = useState('');
  const [filterProduct, setFilterProduct] = useState('');
  const [filterSearch, setFilterSearch] = useState('');

  // Sort
  const [sortKey, setSortKey] = useState<SortKey>('createdAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  // Load reference data once
  useEffect(() => {
    apiFetch<{ data: Campaign[] }>('/campaigns').then(r => setCampaigns(r.data || [])).catch(() => {});
    apiFetch<{ data: Product[] }>('/products').then(r => setProducts(r.data || [])).catch(() => {});
  }, []);

  // Load leads when filters change
  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterStatus) params.set('status', filterStatus);
    if (filterCampaign) params.set('campaignId', filterCampaign);
    if (filterProduct) params.set('productId', filterProduct);
    if (filterSearch) params.set('search', filterSearch);

    const qs = params.toString();
    apiFetch<{ data: Lead[]; total: number; page: number; limit: number }>(`/leads${qs ? '?' + qs : ''}`)
      .then((res) => setLeads(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [filterStatus, filterCampaign, filterProduct, filterSearch]);

  // Client-side sorting
  const sorted = useMemo(() => {
    return [...leads].sort((a, b) => {
      const av = a[sortKey] ? new Date(a[sortKey]!).getTime() : 0;
      const bv = b[sortKey] ? new Date(b[sortKey]!).getTime() : 0;
      return sortDir === 'desc' ? bv - av : av - bv;
    });
  }, [leads, sortKey, sortDir]);

  // KPI counters (from loaded slice)
  const counters = useMemo(() => {
    const base = { total: leads.length, new: 0, contacted: 0, converted: 0, lost: 0 };
    leads.forEach((l) => {
      if (l.status === 'new') base.new++;
      else if (l.status === 'contacted') base.contacted++;
      else if (l.status === 'converted') base.converted++;
      else if (l.status === 'lost') base.lost++;
    });
    return base;
  }, [leads]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  }

  const inputCls =
    'bg-white/[0.04] border border-white/[0.08] text-white text-sm rounded-lg px-3 py-2 outline-none focus:border-white/20 placeholder-zinc-600';
  const selectCls =
    'bg-white/[0.04] border border-white/[0.08] text-white text-sm rounded-lg px-3 py-2 outline-none focus:border-white/20';

  return (
    <div className="min-h-screen bg-[#09090b] p-6 text-[#fafafa]">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-xl font-bold tracking-tight text-white">Leads</h1>
          <button
            onClick={() => exportCsv(sorted)}
            className="flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.04] px-4 py-2 text-sm text-white transition hover:bg-white/[0.08] active:scale-95"
          >
            ↓ Exportar CSV
          </button>
        </div>

        {/* KPI Cards */}
        <div className="mb-6 flex flex-wrap gap-3">
          <KpiCard label="Total" value={counters.total} />
          <KpiCard label="Novos" value={counters.new} />
          <KpiCard label="Contactados" value={counters.contacted} />
          <KpiCard label="Convertidos" value={counters.converted} />
          <KpiCard label="Perdidos" value={counters.lost} />
        </div>

        {/* Filter Bar */}
        <div className="mb-5 flex flex-wrap gap-3">
          <input
            type="text"
            placeholder="Buscar nome, telefone..."
            value={filterSearch}
            onChange={(e) => setFilterSearch(e.target.value)}
            className={inputCls + ' flex-1 min-w-[180px]'}
          />

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className={selectCls}
          >
            <option value="">Todos os status</option>
            {Object.entries(STATUS_LABELS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>

          <select
            value={filterCampaign}
            onChange={(e) => setFilterCampaign(e.target.value)}
            className={selectCls}
          >
            <option value="">Todas as campanhas</option>
            {campaigns.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <select
            value={filterProduct}
            onChange={(e) => setFilterProduct(e.target.value)}
            className={selectCls}
          >
            <option value="">Todos os produtos</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        {/* Table */}
        {loading ? (
          <p className="text-zinc-500 py-12 text-center">Carregando leads...</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-white/[0.06]">
            <table className="w-full bg-[#111113] text-sm">
              <thead>
                <tr className="border-b border-white/[0.06] bg-white/[0.04] text-left text-xs text-zinc-500">
                  <th className="p-3 whitespace-nowrap">Telefone</th>
                  <th className="p-3 whitespace-nowrap">Nome</th>
                  <th className="p-3 whitespace-nowrap">Status</th>
                  <th className="p-3 whitespace-nowrap">Campanha</th>
                  <th className="p-3 whitespace-nowrap">Produto</th>
                  <th className="p-3 whitespace-nowrap">Fonte</th>
                  <th className="p-3 whitespace-nowrap">Criativo</th>
                  <th className="p-3 whitespace-nowrap">Último Evento</th>
                  <th
                    className="p-3 whitespace-nowrap cursor-pointer select-none hover:text-zinc-300"
                    onClick={() => toggleSort('lastMessageAt')}
                  >
                    Última Msg
                    <SortIcon active={sortKey === 'lastMessageAt'} dir={sortDir} />
                  </th>
                  <th
                    className="p-3 whitespace-nowrap cursor-pointer select-none hover:text-zinc-300"
                    onClick={() => toggleSort('createdAt')}
                  >
                    Criado em
                    <SortIcon active={sortKey === 'createdAt'} dir={sortDir} />
                  </th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((l) => (
                  <tr key={l.id} className="border-b border-white/[0.06] hover:bg-white/[0.04] transition-colors">
                    <td className="p-3 font-mono text-zinc-300">{l.phone}</td>
                    <td className="p-3 text-white">{l.name || '—'}</td>
                    <td className="p-3">
                      <StatusBadge status={l.status} />
                    </td>
                    <td className="p-3 text-zinc-400">{l.campaign?.name || '—'}</td>
                    <td className="p-3 text-zinc-400">{l.product?.name || '—'}</td>
                    <td className="p-3 text-zinc-400">{l.click?.utmSource || '—'}</td>
                    <td className="p-3 text-zinc-400">{l.click?.utmContent || '—'}</td>
                    <td className="p-3">
                      <EventBadge type={l.lastEventType} />
                    </td>
                    <td className="p-3 text-zinc-500 text-xs">{fmtDate(l.lastMessageAt)}</td>
                    <td className="p-3 text-zinc-500 text-xs">{fmtDate(l.createdAt)}</td>
                  </tr>
                ))}
                {sorted.length === 0 && (
                  <tr>
                    <td colSpan={10} className="p-8 text-center text-zinc-600">
                      Nenhum lead encontrado
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
