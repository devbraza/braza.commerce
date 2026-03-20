'use client';

interface PeriodFilterProps {
  value: string;
  onChange: (period: string) => void;
}

const PERIODS = [
  { label: 'Hoje', value: 'today' },
  { label: '7d', value: '7d' },
  { label: '30d', value: '30d' },
  { label: 'Tudo', value: 'all' },
];

export default function PeriodFilter({ value, onChange }: PeriodFilterProps) {
  return (
    <div className="flex gap-0.5 bg-white/[0.04] rounded-lg p-1 border border-white/[0.06]">
      {PERIODS.map((p) => (
        <button
          key={p.value}
          onClick={() => onChange(p.value)}
          className={`px-3 py-1.5 text-[11px] font-semibold rounded-md transition ${
            value === p.value
              ? 'bg-white/[0.1] text-white shadow-sm'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}
