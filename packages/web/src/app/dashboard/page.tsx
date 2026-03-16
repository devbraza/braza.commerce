'use client';

import { Suspense, useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  MousePointerClick,
  Users,
  ShoppingCart,
  DollarSign,
  Megaphone,
  Zap,
  CheckCircle,
  TrendingUp,
  PackagePlus,
  Rocket,
} from 'lucide-react';
import { apiFetch } from '@/lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────

type Period = 'today' | '7d' | '30d';

interface Changes {
  leads: number;
  clicks: number;
  orders: number;
  revenue: number;
}

interface Metrics {
  totalLeads: number;
  totalClicks: number;
  totalOrders: number;
  totalRevenue: number;
  totalEvents: number;
  eventsSentToMeta: number;
  campaigns: number;
  conversionRate: string;
  changes?: Changes;
}

interface TopCampaign {
  nome: string;
  cliques: number;
  leads: number;
  conversao: string;
}

interface TopProduct {
  nome: string;
  pedidos: number;
  receita: number;
}

interface TopData {
  campanhas: TopCampaign[];
  produtos: TopProduct[];
}

// ─── Skeleton Card ────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-xl border border-white/[0.06] bg-[#111113] p-5">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="h-3 w-20 rounded bg-white/[0.06]" />
          <div className="mt-3 h-7 w-16 rounded bg-white/[0.08]" />
          <div className="mt-2 h-3 w-12 rounded bg-white/[0.04]" />
        </div>
        <div className="h-8 w-8 rounded-lg bg-white/[0.06]" />
      </div>
    </div>
  );
}

// ─── Change Badge ─────────────────────────────────────────────────────────────

function ChangeBadge({ value }: { value?: number }) {
  if (value === undefined || value === null) return null;

  const positive = value >= 0;
  const arrow = positive ? '▲' : '▼';
  const color = positive ? 'text-emerald-400' : 'text-red-400';
  const abs = Math.abs(value).toFixed(1);

  return (
    <p className={`mt-1 text-[11px] font-medium ${color}`}>
      {arrow} {abs}% vs período anterior
    </p>
  );
}

// ─── Period Filter ────────────────────────────────────────────────────────────

const PERIOD_LABELS: Record<Period, string> = {
  today: 'Hoje',
  '7d': '7 dias',
  '30d': '30 dias',
};

interface PeriodFilterProps {
  current: Period;
  onChange: (p: Period) => void;
}

function PeriodFilter({ current, onChange }: PeriodFilterProps) {
  return (
    <div className="flex gap-0.5 rounded-lg border border-white/[0.06] bg-white/[0.04] p-1">
      {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className={
            current === p
              ? 'rounded-md bg-white/[0.1] px-3 py-1.5 text-[11px] font-semibold text-white'
              : 'rounded-md px-3 py-1.5 text-[11px] font-semibold text-zinc-500 hover:text-zinc-300'
          }
        >
          {PERIOD_LABELS[p]}
        </button>
      ))}
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-[#111113] p-10 text-center">
      <p className="text-sm text-zinc-400">
        Nenhum dado ainda. Crie seu primeiro produto e campanha para começar a
        rastrear conversões.
      </p>
      <div className="mt-6 flex justify-center gap-3">
        <Link
          href="/products"
          className="flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.06] px-4 py-2 text-sm font-medium text-white transition hover:bg-white/[0.1]"
        >
          <PackagePlus size={15} />
          Criar Produto
        </Link>
        <Link
          href="/campaigns"
          className="flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.06] px-4 py-2 text-sm font-medium text-white transition hover:bg-white/[0.1]"
        >
          <Rocket size={15} />
          Criar Campanha
        </Link>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const periodParam = (searchParams.get('period') as Period) || '7d';
  const [period, setPeriod] = useState<Period>(periodParam);

  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [topData, setTopData] = useState<TopData | null>(null);
  const [loadingMetrics, setLoadingMetrics] = useState(true);
  const [loadingTop, setLoadingTop] = useState(true);

  // Sync period to URL
  const handlePeriodChange = useCallback(
    (p: Period) => {
      setPeriod(p);
      const params = new URLSearchParams(searchParams.toString());
      params.set('period', p);
      router.push(`?${params.toString()}`, { scroll: false } as Parameters<typeof router.push>[1]);
    },
    [router, searchParams],
  );

  // Fetch metrics
  useEffect(() => {
    setLoadingMetrics(true);
    apiFetch<Metrics>(`/dashboard/metrics?period=${period}`)
      .then(setMetrics)
      .catch(console.error)
      .finally(() => setLoadingMetrics(false));
  }, [period]);

  // Fetch top tables
  useEffect(() => {
    setLoadingTop(true);
    apiFetch<TopData>(`/dashboard/top?period=${period}`)
      .then(setTopData)
      .catch(console.error)
      .finally(() => setLoadingTop(false));
  }, [period]);

  const iconColorMap: Record<string, string> = {
    amber: 'bg-amber-500/10 text-amber-400',
    sky: 'bg-sky-500/10 text-sky-400',
    violet: 'bg-violet-500/10 text-violet-400',
    emerald: 'bg-emerald-500/10 text-emerald-400',
    indigo: 'bg-indigo-500/10 text-indigo-400',
  };

  interface KpiConfig {
    label: string;
    value: string | number;
    icon: React.ElementType;
    color: string;
    change?: number;
  }

  const cards: KpiConfig[] = metrics
    ? [
        {
          label: 'Campanhas',
          value: metrics.campaigns,
          icon: Megaphone,
          color: 'amber',
        },
        {
          label: 'Cliques',
          value: metrics.totalClicks,
          icon: MousePointerClick,
          color: 'sky',
          change: metrics.changes?.clicks,
        },
        {
          label: 'Leads',
          value: metrics.totalLeads,
          icon: Users,
          color: 'violet',
          change: metrics.changes?.leads,
        },
        {
          label: 'Taxa de Conversão',
          value: metrics.conversionRate,
          icon: TrendingUp,
          color: 'emerald',
        },
        {
          label: 'Pedidos',
          value: metrics.totalOrders,
          icon: ShoppingCart,
          color: 'emerald',
          change: metrics.changes?.orders,
        },
        {
          label: 'Receita',
          value: `R$ ${metrics.totalRevenue.toFixed(2)}`,
          icon: DollarSign,
          color: 'emerald',
          change: metrics.changes?.revenue,
        },
        {
          label: 'Eventos',
          value: metrics.totalEvents,
          icon: Zap,
          color: 'indigo',
        },
        {
          label: 'Enviados ao Meta',
          value: metrics.eventsSentToMeta,
          icon: CheckCircle,
          color: 'indigo',
        },
      ]
    : [];

  // Determine if all core metrics are zero (empty state)
  const isEmpty =
    !loadingMetrics &&
    metrics !== null &&
    metrics.totalLeads === 0 &&
    metrics.totalClicks === 0 &&
    metrics.totalOrders === 0 &&
    metrics.totalRevenue === 0 &&
    metrics.campaigns === 0;

  return (
    <div className="min-h-screen bg-[#09090b] p-6 text-[#fafafa]">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-xl font-bold tracking-tight text-white">
            Dashboard
          </h1>
          <PeriodFilter current={period} onChange={handlePeriodChange} />
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {loadingMetrics
            ? Array.from({ length: 8 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))
            : cards.map((card) => {
                const Icon = card.icon;
                return (
                  <div
                    key={card.label}
                    className="card-glow relative overflow-hidden rounded-xl border border-white/[0.06] bg-[#111113] p-5"
                  >
                    {/* Gradient decorative element */}
                    <div className="pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-br from-white/[0.03] to-transparent" />

                    <div className="relative flex items-start justify-between">
                      <div>
                        <p className="text-[12px] font-medium text-zinc-500">
                          {card.label}
                        </p>
                        <p className="stat-number mt-2 text-2xl font-bold tracking-tight text-white">
                          {card.value}
                        </p>
                        <ChangeBadge value={card.change} />
                      </div>
                      <span
                        className={`flex items-center justify-center rounded-lg p-1.5 ${iconColorMap[card.color]}`}
                      >
                        <Icon size={16} />
                      </span>
                    </div>
                  </div>
                );
              })}
        </div>

        {/* Empty State */}
        {isEmpty && (
          <div className="mt-8">
            <EmptyState />
          </div>
        )}

        {/* Top Tables */}
        {!isEmpty && (
          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Top Campanhas */}
            <div className="rounded-xl border border-white/[0.06] bg-[#111113] overflow-hidden">
              <div className="border-b border-white/[0.06] px-5 py-3">
                <h2 className="text-sm font-semibold text-white">
                  Top Campanhas
                </h2>
              </div>
              {loadingTop ? (
                <div className="animate-pulse p-5 space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="h-4 rounded bg-white/[0.06]" />
                  ))}
                </div>
              ) : !topData?.campanhas?.length ? (
                <p className="p-5 text-sm text-zinc-500">
                  Nenhuma campanha encontrada.
                </p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-white/[0.04]">
                      <th className="px-5 py-2.5 text-left text-[11px] font-medium text-zinc-500">
                        Nome
                      </th>
                      <th className="px-3 py-2.5 text-right text-[11px] font-medium text-zinc-500">
                        Cliques
                      </th>
                      <th className="px-3 py-2.5 text-right text-[11px] font-medium text-zinc-500">
                        Leads
                      </th>
                      <th className="px-5 py-2.5 text-right text-[11px] font-medium text-zinc-500">
                        Conv.
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {topData.campanhas.map((row, i) => (
                      <tr
                        key={i}
                        className="border-t border-white/[0.04] transition hover:bg-white/[0.02]"
                      >
                        <td className="max-w-[140px] truncate px-5 py-3 text-zinc-300">
                          {row.nome}
                        </td>
                        <td className="px-3 py-3 text-right tabular-nums text-zinc-400">
                          {row.cliques}
                        </td>
                        <td className="px-3 py-3 text-right tabular-nums text-zinc-400">
                          {row.leads}
                        </td>
                        <td className="px-5 py-3 text-right tabular-nums text-emerald-400">
                          {row.conversao}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Top Produtos */}
            <div className="rounded-xl border border-white/[0.06] bg-[#111113] overflow-hidden">
              <div className="border-b border-white/[0.06] px-5 py-3">
                <h2 className="text-sm font-semibold text-white">
                  Top Produtos
                </h2>
              </div>
              {loadingTop ? (
                <div className="animate-pulse p-5 space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="h-4 rounded bg-white/[0.06]" />
                  ))}
                </div>
              ) : !topData?.produtos?.length ? (
                <p className="p-5 text-sm text-zinc-500">
                  Nenhum produto encontrado.
                </p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-white/[0.04]">
                      <th className="px-5 py-2.5 text-left text-[11px] font-medium text-zinc-500">
                        Nome
                      </th>
                      <th className="px-3 py-2.5 text-right text-[11px] font-medium text-zinc-500">
                        Pedidos
                      </th>
                      <th className="px-5 py-2.5 text-right text-[11px] font-medium text-zinc-500">
                        Receita
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {topData.produtos.map((row, i) => (
                      <tr
                        key={i}
                        className="border-t border-white/[0.04] transition hover:bg-white/[0.02]"
                      >
                        <td className="max-w-[180px] truncate px-5 py-3 text-zinc-300">
                          {row.nome}
                        </td>
                        <td className="px-3 py-3 text-right tabular-nums text-zinc-400">
                          {row.pedidos}
                        </td>
                        <td className="px-5 py-3 text-right tabular-nums text-emerald-400">
                          R$ {row.receita.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#09090b] p-6">
        <div className="max-w-5xl mx-auto">
          <div className="h-7 bg-white/[0.06] rounded w-40 mb-6 animate-pulse" />
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-[#111113] rounded-xl border border-white/[0.06] p-5 animate-pulse">
                <div className="h-3 bg-white/[0.06] rounded w-20 mb-4" />
                <div className="h-7 bg-white/[0.06] rounded w-28" />
              </div>
            ))}
          </div>
        </div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
