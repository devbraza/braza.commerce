interface EventRow {
  id: string;
  type: string;
  value: string | null;
  createdAt: string;
  click: { clickId: string; campaign?: { name: string } };
}

interface ConversionTableProps {
  events: EventRow[];
  page: number;
  pages: number;
  onPageChange: (page: number) => void;
}

const typeLabels: Record<string, { label: string; color: string }> = {
  VIEW_CONTENT: { label: 'View Content', color: 'text-sky-400' },
  INITIATE_CHECKOUT: { label: 'Checkout', color: 'text-amber-400' },
  ADD_PAYMENT_INFO: { label: 'Payment Info', color: 'text-violet-400' },
  PURCHASE: { label: 'Purchase', color: 'text-emerald-400' },
  PAYMENT_REFUSED: { label: 'Recusado', color: 'text-red-400' },
};

export default function ConversionTable({ events, page, pages, onPageChange }: ConversionTableProps) {
  return (
    <div className="card-glow bg-[#111113] rounded-xl border border-white/[0.06] overflow-hidden">
      <div className="px-4 py-3 border-b border-white/[0.03]">
        <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-wider">Ultimas conversoes</p>
      </div>
      <table className="w-full">
        <thead>
          <tr className="border-b border-white/[0.03]">
            <th className="text-[10px] font-semibold text-zinc-600 uppercase tracking-wider px-4 py-3 text-left">Data</th>
            <th className="text-[10px] font-semibold text-zinc-600 uppercase tracking-wider px-4 py-3 text-left">Click ID</th>
            <th className="text-[10px] font-semibold text-zinc-600 uppercase tracking-wider px-4 py-3 text-left">Tipo</th>
            <th className="text-[10px] font-semibold text-zinc-600 uppercase tracking-wider px-4 py-3 text-right">Valor</th>
          </tr>
        </thead>
        <tbody>
          {events.length === 0 && (
            <tr><td colSpan={4} className="text-center py-8 text-zinc-500 text-[11px]">Nenhum evento registrado</td></tr>
          )}
          {events.map((e) => {
            const type = typeLabels[e.type] || { label: e.type, color: 'text-zinc-400' };
            return (
              <tr key={e.id} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                <td className="px-4 py-3.5 text-[11px] text-zinc-500">
                  {new Date(e.createdAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                </td>
                <td className="px-4 py-3.5 font-mono text-[11px] text-zinc-400">{e.click.clickId}</td>
                <td className={`px-4 py-3.5 text-[11px] font-semibold ${type.color}`}>{type.label}</td>
                <td className="px-4 py-3.5 text-[11px] text-zinc-300 text-right">
                  {e.value ? `R$ ${Number(e.value).toFixed(2).replace('.', ',')}` : '—'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {pages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-white/[0.03]">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className="text-[11px] text-zinc-500 hover:text-zinc-300 disabled:opacity-30"
          >
            Anterior
          </button>
          <span className="text-[10px] text-zinc-600">{page} / {pages}</span>
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= pages}
            className="text-[11px] text-zinc-500 hover:text-zinc-300 disabled:opacity-30"
          >
            Proximo
          </button>
        </div>
      )}
    </div>
  );
}
