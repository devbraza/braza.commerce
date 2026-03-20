'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import { useRouter } from 'next/navigation';

interface PageOption {
  id: string;
  title: string | null;
  slug: string;
  status: string;
}

export default function NewCampaignPage() {
  const router = useRouter();
  const [pages, setPages] = useState<PageOption[]>([]);
  const [name, setName] = useState('');
  const [pageId, setPageId] = useState('');
  const [checkoutUrl, setCheckoutUrl] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiFetch<PageOption[]>('/pages').then((data) => {
      setPages(data.filter((p) => p.status === 'PUBLISHED'));
    });
  }, []);

  const handleSubmit = async () => {
    if (!name || !pageId || !checkoutUrl) return alert('Preencha nome, pagina e checkout URL');
    setSaving(true);
    try {
      await apiFetch('/campaigns', {
        method: 'POST',
        body: JSON.stringify({
          name,
          pageId,
          checkoutUrl,
        }),
      });
      router.push('/campaigns');
    } catch (err) {
      alert('Erro: ' + (err as Error).message);
    }
    setSaving(false);
  };

  return (
    <div>
      <h1 className="text-xl font-bold text-white mb-8">Nova campanha</h1>
      <div className="max-w-lg space-y-4">
        <div className="card-glow bg-[#111113] rounded-xl border border-white/[0.06] p-5 space-y-4">
          <div>
            <label className="text-[10px] font-semibold text-zinc-600 uppercase tracking-wider block mb-1.5">Nome da campanha</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Black Friday Coelha"
              className="w-full px-3 py-1.5 text-[11px] font-medium bg-white/[0.04] border border-white/[0.06] rounded-lg text-zinc-300"
            />
          </div>
          <div>
            <label className="text-[10px] font-semibold text-zinc-600 uppercase tracking-wider block mb-1.5">Pagina vinculada</label>
            <select
              value={pageId}
              onChange={(e) => setPageId(e.target.value)}
              className="w-full px-3 py-1.5 text-[11px] font-medium bg-white/[0.04] border border-white/[0.06] rounded-lg text-zinc-300 cursor-pointer"
            >
              <option value="">Selecione uma pagina publicada</option>
              {pages.map((p) => (
                <option key={p.id} value={p.id}>{p.title || p.slug}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-semibold text-zinc-600 uppercase tracking-wider block mb-1.5">URL do checkout (Yampi)</label>
            <input
              value={checkoutUrl}
              onChange={(e) => setCheckoutUrl(e.target.value)}
              placeholder="https://checkout.yampi.com.br/..."
              className="w-full px-3 py-1.5 text-[11px] font-medium bg-white/[0.04] border border-white/[0.06] rounded-lg text-zinc-300"
            />
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={saving || !name || !pageId || !checkoutUrl}
          className="w-full py-2.5 text-[12px] font-semibold bg-white/[0.08] hover:bg-white/[0.12] text-white border border-white/[0.08] rounded-lg transition disabled:opacity-50"
        >
          {saving ? 'Criando...' : 'Criar campanha'}
        </button>
      </div>
    </div>
  );
}
