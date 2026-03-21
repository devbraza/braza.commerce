'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import Link from 'next/link';

interface CampaignItem {
  id: string;
  name: string;
  status: string;
  pageTitle: string | null;
  pageSlug: string;
  checkoutUrl: string;
  pixelId: string | null;
  createdAt: string;
  clicks: number;
  purchases: number;
  revenue: number;
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<CampaignItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingName, setEditingName] = useState<string | null>(null);

  const load = () => {
    apiFetch<CampaignItem[]>('/campaigns')
      .then(setCampaigns)
      .catch(() => setError('Erro ao carregar campanhas'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const renameCampaign = async (id: string, newName: string) => {
    if (!newName.trim()) return;
    try {
      await apiFetch(`/campaigns/${id}`, { method: 'PATCH', body: JSON.stringify({ name: newName.trim() }) });
      setCampaigns(campaigns.map((c) => c.id === id ? { ...c, name: newName.trim() } : c));
    } catch { /* empty */ }
    setEditingName(null);
  };

  const toggleStatus = async (id: string, status: string) => {
    const action = status === 'ACTIVE' ? 'pause' : 'activate';
    try {
      await apiFetch(`/campaigns/${id}/${action}`, { method: 'PATCH' });
      load();
    } catch {
      alert('Erro ao alterar status da campanha');
    }
  };

  if (loading) return <div className="flex items-center justify-center py-20 text-zinc-500">Carregando...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-xl font-bold text-white">Campanhas</h1>
        <Link href="/campaigns/new" className="px-3 py-1.5 text-[12px] font-semibold bg-white/[0.08] hover:bg-white/[0.12] text-white border border-white/[0.08] rounded-lg transition">
          + Nova campanha
        </Link>
      </div>

      {error && (
        <div className="text-center py-10">
          <p className="text-red-400 text-sm mb-3">{error}</p>
          <button onClick={() => { setError(null); load(); }} className="px-4 py-2 bg-white/[0.08] hover:bg-white/[0.12] text-white rounded-lg text-[12px] font-semibold border border-white/[0.08]">Tentar novamente</button>
        </div>
      )}

      {!error && campaigns.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-zinc-500 mb-4 text-sm">Nenhuma campanha criada</p>
          <Link href="/campaigns/new" className="px-4 py-2 bg-white/[0.08] hover:bg-white/[0.12] text-white rounded-lg text-[12px] font-semibold border border-white/[0.08]">
            Criar primeira campanha
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {campaigns.map((c) => (
            <div key={c.id} className="card-glow bg-[#111113] rounded-xl border border-white/[0.06] p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  {editingName === c.id ? (
                    <input
                      autoFocus
                      defaultValue={c.name}
                      onBlur={(e) => renameCampaign(c.id, e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); if (e.key === 'Escape') setEditingName(null); }}
                      className="text-[15px] font-semibold text-white bg-white/[0.06] rounded px-2 py-0.5 border border-white/[0.1] outline-none"
                    />
                  ) : (
                    <h2
                      onClick={() => setEditingName(c.id)}
                      className="text-[15px] font-semibold text-white cursor-pointer hover:text-emerald-400 transition"
                      title="Clique para renomear"
                    >{c.name}</h2>
                  )}
                  <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                    c.status === 'ACTIVE'
                      ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 live-pulse'
                      : 'bg-zinc-500/10 border border-zinc-500/20 text-zinc-500'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${c.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-zinc-500'}`} />
                    {c.status === 'ACTIVE' ? 'Ativa' : 'Pausada'}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Link href={`/campaigns/${c.id}`} className="px-3 py-1.5 text-[11px] font-medium bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 rounded-lg border border-white/[0.06]">
                    Metricas
                  </Link>
                  <button onClick={() => toggleStatus(c.id, c.status)} className="px-3 py-1.5 text-[11px] font-medium bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 rounded-lg border border-white/[0.06]">
                    {c.status === 'ACTIVE' ? 'Pausar' : 'Ativar'}
                  </button>
                </div>
              </div>
              <p className="text-[11px] text-zinc-500 mb-3">
                Pagina: <span className="text-zinc-400">{c.pageTitle || c.pageSlug}</span>
                {c.pixelId && <> · Pixel: <span className="font-mono text-zinc-400">{c.pixelId}</span></>}
              </p>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-wider">Cliques</p>
                  <p className="text-[15px] font-semibold text-white stat-number">{c.clicks}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-wider">Compras</p>
                  <p className="text-[15px] font-semibold text-white stat-number">{c.purchases}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-wider">Receita</p>
                  <p className="text-[15px] font-semibold text-emerald-500 stat-number">R$ {c.revenue.toFixed(2).replace('.', ',')}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
