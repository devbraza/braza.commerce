'use client';

import { useEffect, useState, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
import { getPeriodDates } from '@/lib/period';
import KpiCard from '@/components/stats/KpiCard';
import FunnelChart from '@/components/stats/FunnelChart';
import PeriodFilter from '@/components/stats/PeriodFilter';

interface Overview {
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
  activeCampaigns: number;
}

export default function MetricsPage() {
  const [stats, setStats] = useState<Overview | null>(null);
  const [period, setPeriod] = useState('all');
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    const { from, to } = getPeriodDates(period);
    const qs = [from && `from=${from}`, to && `to=${to}`].filter(Boolean).join('&');
    apiFetch<Overview>(`/metrics/overview${qs ? `?${qs}` : ''}`).then(setStats).catch(() => setError('Erro ao carregar metricas'));
  }, [period]);

  useEffect(() => { load(); }, [load]);

  if (error) return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-white">Metricas gerais</h1>
      <div className="text-center py-10">
        <p className="text-red-400 text-sm mb-3">{error}</p>
        <button onClick={() => { setError(null); load(); }} className="px-4 py-2 bg-white/[0.08] hover:bg-white/[0.12] text-white rounded-lg text-[12px] font-semibold border border-white/[0.08]">Tentar novamente</button>
      </div>
    </div>
  );

  if (!stats) return <div className="flex items-center justify-center py-20 text-zinc-500">Carregando...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">Metricas gerais</h1>
        <PeriodFilter value={period} onChange={setPeriod} />
      </div>

      {/* Primary KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KpiCard label="Cliques totais" value={String(stats.clicks)} color="white" />
        <KpiCard label="Checkouts" value={String(stats.checkouts)} subtitle={`${stats.checkoutRate}% conv.`} color="amber" />
        <KpiCard label="Compras" value={String(stats.purchases)} subtitle={`${stats.overallConversion}% total`} color="emerald" />
        <KpiCard label="Receita total" value={`R$ ${stats.revenue.toFixed(2).replace('.', ',')}`} color="emerald" />
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <KpiCard label="Campanhas ativas" value={String(stats.activeCampaigns)} size="secondary" color="sky" />
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
    </div>
  );
}
