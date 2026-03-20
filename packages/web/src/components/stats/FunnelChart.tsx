interface FunnelStep {
  label: string;
  value: number;
  rate: number;
}

interface FunnelChartProps {
  steps: FunnelStep[];
}

function getSemaforoColor(rate: number): string {
  if (rate >= 3) return 'bg-emerald-500';
  if (rate >= 1) return 'bg-amber-500';
  return 'bg-red-500';
}

function getSemaforoBorder(rate: number): string {
  if (rate >= 3) return 'border-emerald-500/30';
  if (rate >= 1) return 'border-amber-500/30';
  return 'border-red-500/30';
}

export default function FunnelChart({ steps }: FunnelChartProps) {
  const maxValue = Math.max(...steps.map((s) => s.value), 1);

  return (
    <div className="card-glow bg-[#111113] rounded-xl border border-white/[0.06] p-5">
      <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-wider mb-4">Funil de conversao</p>
      <div className="space-y-3">
        {steps.map((step) => {
          const width = Math.max((step.value / maxValue) * 100, 4);
          return (
            <div key={step.label}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] text-zinc-400">{step.label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-white">{step.value}</span>
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border-2 ${getSemaforoBorder(step.rate)} ${step.rate >= 3 ? 'text-emerald-500' : step.rate >= 1 ? 'text-amber-500' : 'text-red-500'}`}>
                    {step.rate}%
                  </span>
                </div>
              </div>
              <div className="h-2 bg-white/[0.04] rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${getSemaforoColor(step.rate)}`}
                  style={{ width: `${width}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
