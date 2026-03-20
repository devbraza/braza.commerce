'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { getPeriodDates } from '@/lib/period';
import KpiCard from '@/components/stats/KpiCard';
import FunnelChart from '@/components/stats/FunnelChart';
import ConversionTable from '@/components/stats/ConversionTable';
import PeriodFilter from '@/components/stats/PeriodFilter';

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

interface EventRow {
  id: string;
  type: string;
  value: string | null;
  createdAt: string;
  click: { clickId: string };
}

interface EventsResponse {
  events: EventRow[];
  total: number;
  page: number;
  pages: number;
}

export default function CampaignDetailPage() {
  const { id } = useParams();
  const [stats, setStats] = useState<Stats | null>(null);
  const [events, setEvents] = useState<EventsResponse | null>(null);
  const [period, setPeriod] = useState('all');
  const [eventsPage, setEventsPage] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const loadStats = useCallback(() => {
    const { from, to } = getPeriodDates(period);
    const qs = [from && `from=${from}`, to && `to=${to}`].filter(Boolean).join('&');
    apiFetch<Stats>(`/campaigns/${id}/stats${qs ? `?${qs}` : ''}`).then(setStats).catch(() => setError('Erro ao carregar dados da campanha'));
  }, [id, period]);

  const loadEvents = useCallback(() => {
    apiFetch<EventsResponse>(`/campaigns/${id}/events?page=${eventsPage}`).then(setEvents).catch(() => {});
  }, [id, eventsPage]);

  useEffect(() => { loadStats(); }, [loadStats]);
  useEffect(() => { loadEvents(); }, [loadEvents]);

  if (error) return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-white">Dashboard da campanha</h1>
      <div className="text-center py-10">
        <p className="text-red-400 text-sm mb-3">{error}</p>
        <button onClick={() => { setError(null); loadStats(); }} className="px-4 py-2 bg-white/[0.08] hover:bg-white/[0.12] text-white rounded-lg text-[12px] font-semibold border border-white/[0.08]">Tentar novamente</button>
      </div>
    </div>
  );

  if (!stats) return <div className="flex items-center justify-center py-20 text-zinc-500">Carregando...</div>;

  const cpa = stats.purchases > 0 ? stats.revenue / stats.purchases : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">Dashboard da campanha</h1>
        <PeriodFilter value={period} onChange={setPeriod} />
      </div>

      {/* Primary KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KpiCard label="Cliques" value={String(stats.clicks)} color="white" />
        <KpiCard label="Checkouts" value={String(stats.checkouts)} subtitle={`${stats.checkoutRate}% conv.`} color="amber" />
        <KpiCard label="Compras" value={String(stats.purchases)} subtitle={`${stats.overallConversion}% total`} color="emerald" />
        <KpiCard label="Receita" value={`R$ ${stats.revenue.toFixed(2).replace('.', ',')}`} color="emerald" />
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <KpiCard label="CPA" value={`R$ ${cpa.toFixed(2).replace('.', ',')}`} size="secondary" color="sky" />
        <KpiCard label="AOV" value={`R$ ${stats.aov.toFixed(2).replace('.', ',')}`} size="secondary" color="violet" />
        <KpiCard label="Conv. Rate" value={`${stats.overallConversion}%`} size="secondary" color={stats.overallConversion >= 3 ? 'emerald' : stats.overallConversion >= 1 ? 'amber' : 'red'} />
      </div>

      {/* Funnel */}
      <FunnelChart steps={[
        { label: 'Cliques', value: stats.clicks, rate: 100 },
        { label: 'View Content', value: stats.viewContent, rate: stats.viewContentRate },
        { label: 'Checkout', value: stats.checkouts, rate: stats.checkoutRate },
        { label: 'Compra', value: stats.purchases, rate: stats.purchaseRate },
      ]} />

      {/* Events table */}
      {events && (
        <ConversionTable
          events={events.events}
          page={events.page}
          pages={events.pages}
          onPageChange={setEventsPage}
        />
      )}
    </div>
  );
}
