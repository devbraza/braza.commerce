'use client';

import { useEffect, useState, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
import ConversionTable from '@/components/stats/ConversionTable';

interface EventRow {
  id: string;
  type: string;
  value: string | null;
  createdAt: string;
  click: { clickId: string; campaign: { name: string } };
}

interface EventsResponse {
  events: EventRow[];
  total: number;
  page: number;
  pages: number;
}

export default function EventsPage() {
  const [data, setData] = useState<EventsResponse | null>(null);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    apiFetch<EventsResponse>(`/events?page=${page}&limit=20`).then(setData).catch(() => setError('Erro ao carregar eventos'));
  }, [page]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-white">Eventos</h1>
      {error && (
        <div className="text-center py-10">
          <p className="text-red-400 text-sm mb-3">{error}</p>
          <button onClick={() => { setError(null); load(); }} className="px-4 py-2 bg-white/[0.08] hover:bg-white/[0.12] text-white rounded-lg text-[12px] font-semibold border border-white/[0.08]">Tentar novamente</button>
        </div>
      )}
      {!error && data ? (
        <>
          <div className="text-[11px] text-zinc-500">{data.total} eventos registrados</div>
          <ConversionTable
            events={data.events}
            page={data.page}
            pages={data.pages}
            onPageChange={setPage}
          />
        </>
      ) : !error ? (
        <div className="flex items-center justify-center py-20 text-zinc-500">Carregando...</div>
      ) : null}
    </div>
  );
}
