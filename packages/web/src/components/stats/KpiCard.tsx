interface KpiCardProps {
  label: string;
  value: string;
  subtitle?: string;
  color?: 'emerald' | 'amber' | 'sky' | 'violet' | 'red' | 'white';
  size?: 'primary' | 'secondary';
}

const colorMap = {
  emerald: 'text-emerald-500',
  amber: 'text-amber-500',
  sky: 'text-sky-500',
  violet: 'text-violet-500',
  red: 'text-red-500',
  white: 'text-white',
};

export default function KpiCard({ label, value, subtitle, color = 'white', size = 'primary' }: KpiCardProps) {
  if (size === 'secondary') {
    return (
      <div className="card-glow bg-[#111113] rounded-xl border border-white/[0.06] px-4 py-3 flex items-center gap-3">
        <div>
          <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-wider">{label}</p>
          <p className={`text-[15px] font-semibold stat-number ${colorMap[color]}`}>{value}</p>
        </div>
      </div>
    );
  }
  return (
    <div className="card-glow bg-[#111113] rounded-xl border border-white/[0.06] p-5 relative overflow-hidden">
      <p className="text-[12px] font-medium text-zinc-500">{label}</p>
      <p className={`text-2xl font-bold stat-number tracking-tight ${colorMap[color]}`}>{value}</p>
      {subtitle && <p className="text-[11px] text-emerald-500 font-medium mt-1">{subtitle}</p>}
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-white/[0.02] to-transparent" />
    </div>
  );
}
