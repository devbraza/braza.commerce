'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number; name: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  const gasto = payload.find((p) => p.name === 'Gasto')?.value || 0;
  const receita = payload.find((p) => p.name === 'Receita')?.value || 0;
  const roas = gasto > 0 ? (receita / gasto).toFixed(2) : '—';

  return (
    <div className="rounded-lg border border-white/[0.08] bg-[#111113] px-3 py-2 text-xs shadow-lg">
      <p className="mb-1 text-zinc-400">{label}</p>
      <p className="text-rose-400">Gasto: {formatCurrency(gasto)}</p>
      <p className="text-emerald-400">Receita: {formatCurrency(receita)}</p>
      <p className="mt-1 text-zinc-300">ROAS: {roas}x</p>
    </div>
  );
}

interface ChartDataPoint {
  date: string;
  Gasto: number;
  Receita: number;
}

export default function SpendRevenueChart({ data }: { data: ChartDataPoint[] }) {
  if (!data.length) return null;

  return (
    <div className="mt-6 rounded-xl border border-white/[0.06] bg-[#111113] p-6">
      <h3 className="mb-4 text-sm font-medium text-zinc-400">Gasto vs Receita</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid stroke="rgba(255,255,255,0.04)" />
          <XAxis dataKey="date" tick={{ fill: '#71717a', fontSize: 12 }} />
          <YAxis tick={{ fill: '#71717a', fontSize: 12 }} />
          <Tooltip content={<ChartTooltip />} />
          <Legend wrapperStyle={{ fontSize: 12, color: '#a1a1aa' }} />
          <Line type="monotone" dataKey="Gasto" stroke="#f43f5e" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="Receita" stroke="#10b981" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
