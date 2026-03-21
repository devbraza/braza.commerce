'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface Stats {
  clicks: number;
  viewContent: number;
  checkouts: number;
  purchases: number;
  revenue: number;
  aov: number;
  viewContentRate: number;
  checkoutRate: number;
  purchaseRate: number;
  overallConversion: number;
}

interface PageInfo {
  id: string;
  title: string | null;
  slug: string;
}

type Period = 'today' | '7d' | '30d' | 'all';

function getDateRange(period: Period): { from?: string; to?: string } {
  const now = new Date();
  const to = now.toISOString();
  switch (period) {
    case 'today': {
      const start = new Date(now);
      start.setHours(0, 0, 0, 0);
      return { from: start.toISOString(), to };
    }
    case '7d': {
      const start = new Date(now);
      start.setDate(start.getDate() - 7);
      return { from: start.toISOString(), to };
    }
    case '30d': {
      const start = new Date(now);
      start.setDate(start.getDate() - 30);
      return { from: start.toISOString(), to };
    }
    case 'all':
      return {};
  }
}

function formatBRL(value: number): string {
  return `R$ ${value.toFixed(2).replace('.', ',')}`;
}

export default function StatsPage() {
  const params = useParams();
  const pageId = params.id as string;
  const [stats, setStats] = useState<Stats | null>(null);
  const [page, setPage] = useState<PageInfo | null>(null);
  const [period, setPeriod] = useState<Period>('30d');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<PageInfo>(`/pages/${pageId}`).then(setPage).catch(() => {});
  }, [pageId]);

  useEffect(() => {
    setLoading(true);
    const range = getDateRange(period);
    const qs = new URLSearchParams();
    if (range.from) qs.set('from', range.from);
    if (range.to) qs.set('to', range.to);
    const query = qs.toString() ? `?${qs.toString()}` : '';
    apiFetch<Stats>(`/pages/${pageId}/stats${query}`)
      .then(setStats)
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, [pageId, period]);

  const periods: { key: Period; label: string }[] = [
    { key: 'today', label: 'Hoje' },
    { key: '7d', label: '7d' },
    { key: '30d', label: '30d' },
    { key: 'all', label: 'Tudo' },
  ];

  const isEmpty = stats && stats.clicks === 0 && stats.viewContent === 0 && stats.purchases === 0;

  return (
    <div>
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Link href="/pages" className="text-zinc-500 text-xs hover:text-zinc-300 transition">&larr; Voltar</Link>
            <h1 className="text-xl font-bold text-white mt-1">{page?.title || 'Metricas'}</h1>
          </div>
          <div className="flex gap-1 bg-white/[0.04] rounded-lg p-1">
            {periods.map((p) => (
              <button
                key={p.key}
                onClick={() => setPeriod(p.key)}
                className={`px-3 py-1.5 rounded text-xs font-semibold transition ${
                  period === p.key ? 'bg-white/[0.1] text-white' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-zinc-500">Carregando...</div>
        ) : isEmpty ? (
          <div className="card-glow bg-[#111113] rounded-xl border border-white/[0.06] p-8 text-center">
            <p className="text-zinc-500 text-sm">Nenhum dado ainda</p>
            <p className="text-zinc-600 text-xs mt-2">Os dados aparecem quando leads acessam sua pagina.</p>
          </div>
        ) : stats ? (
          <div className="space-y-4">
            {/* Primary KPIs */}
            <div className="grid grid-cols-3 gap-4">
              <div className="card-glow bg-[#111113] rounded-xl border border-white/[0.06] p-5">
                <p className="text-zinc-500 text-[10px] uppercase tracking-wider mb-1">Page Views</p>
                <p className="text-2xl font-bold text-white font-mono">{stats.viewContent.toLocaleString()}</p>
              </div>
              <div className="card-glow bg-[#111113] rounded-xl border border-white/[0.06] p-5">
                <p className="text-zinc-500 text-[10px] uppercase tracking-wider mb-1">Checkouts</p>
                <p className="text-2xl font-bold text-white font-mono">{stats.checkouts.toLocaleString()}</p>
                <p className="text-zinc-600 text-[10px] mt-1">{stats.checkoutRate}%</p>
              </div>
              <div className="card-glow bg-[#111113] rounded-xl border border-white/[0.06] p-5">
                <p className="text-zinc-500 text-[10px] uppercase tracking-wider mb-1">Compras</p>
                <p className="text-2xl font-bold text-emerald-400 font-mono">{stats.purchases.toLocaleString()}</p>
                <p className="text-zinc-600 text-[10px] mt-1">{stats.purchaseRate}%</p>
              </div>
            </div>

            {/* Secondary KPIs */}
            <div className="grid grid-cols-3 gap-4">
              <div className="card-glow bg-[#111113] rounded-xl border border-white/[0.06] p-5">
                <p className="text-zinc-500 text-[10px] uppercase tracking-wider mb-1">Revenue</p>
                <p className="text-xl font-bold text-emerald-400 font-mono">{formatBRL(stats.revenue)}</p>
              </div>
              <div className="card-glow bg-[#111113] rounded-xl border border-white/[0.06] p-5">
                <p className="text-zinc-500 text-[10px] uppercase tracking-wider mb-1">Ticket Medio</p>
                <p className="text-xl font-bold text-white font-mono">{formatBRL(stats.aov)}</p>
              </div>
              <div className="card-glow bg-[#111113] rounded-xl border border-white/[0.06] p-5">
                <p className="text-zinc-500 text-[10px] uppercase tracking-wider mb-1">Conversao</p>
                <p className="text-xl font-bold text-white font-mono">{stats.overallConversion}%</p>
              </div>
            </div>

            {/* Funnel visualization */}
            <div className="card-glow bg-[#111113] rounded-xl border border-white/[0.06] p-6">
              <h3 className="text-zinc-500 text-[10px] uppercase tracking-wider mb-4">Funil</h3>
              <div className="space-y-3">
                <FunnelBar label="Page Views" value={stats.viewContent} max={stats.viewContent} color="bg-zinc-500" />
                <FunnelBar label="Checkouts" value={stats.checkouts} max={stats.viewContent} color="bg-amber-500" />
                <FunnelBar label="Compras" value={stats.purchases} max={stats.viewContent} color="bg-emerald-500" />
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function FunnelBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-zinc-400 text-xs">{label}</span>
        <span className="text-white text-xs font-mono">{value.toLocaleString()} ({pct.toFixed(1)}%)</span>
      </div>
      <div className="h-2 bg-white/[0.04] rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all duration-500`} style={{ width: `${Math.max(pct, 1)}%` }} />
      </div>
    </div>
  );
}
