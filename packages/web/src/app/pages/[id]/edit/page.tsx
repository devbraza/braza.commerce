'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';

interface TrackingData {
  checkoutUrl: string;
  pixelId: string;
  accessToken: string;
}

export default function EditPagePage() {
  const { id } = useParams();
  const router = useRouter();
  const [page, setPage] = useState<Record<string, unknown> | null>(null);
  const [saving, setSaving] = useState(false);
  const [trackingSaved, setTrackingSaved] = useState(false);
  const [tracking, setTracking] = useState<TrackingData>({ checkoutUrl: '', pixelId: '', accessToken: '' });

  useEffect(() => {
    apiFetch<Record<string, unknown>>(`/pages/${id}`).then((data) => {
      setPage(data);
      setTracking({
        checkoutUrl: (data.checkoutUrl as string) || '',
        pixelId: '',
        accessToken: '',
      });
      // Load campaign data for tracking fields
      apiFetch<Array<Record<string, unknown>>>('/campaigns').then((campaigns) => {
        const campaign = campaigns.find((c) => c.pageId === id || (c as any).page?.id === id);
        if (campaign) {
          setTracking({
            checkoutUrl: (campaign.checkoutUrl as string) || (data.checkoutUrl as string) || '',
            pixelId: (campaign.pixelId as string) || '',
            accessToken: '',
          });
        }
      }).catch(() => {});
    }).catch(() => router.push('/pages'));
  }, [id, router]);

  const save = async (field: string, value: string) => {
    setSaving(true);
    const content = (page?.userEditedContent || page?.aiGeneratedContent || {}) as Record<string, unknown>;
    await apiFetch(`/pages/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ userEditedContent: { ...content, [field]: value } }),
    });
    setSaving(false);
  };

  const saveTracking = async () => {
    if (tracking.checkoutUrl && !tracking.checkoutUrl.startsWith('https://')) {
      alert('URL do checkout deve comecar com https://');
      return;
    }
    setSaving(true);
    try {
      await apiFetch(`/pages/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          checkoutUrl: tracking.checkoutUrl || undefined,
          pixelId: tracking.pixelId || undefined,
          accessToken: tracking.accessToken || undefined,
        }),
      });
      setTrackingSaved(true);
      setTimeout(() => setTrackingSaved(false), 3000);
    } catch (err) {
      alert('Erro ao salvar tracking: ' + (err as Error).message);
    }
    setSaving(false);
  };

  if (!page) return <div className="flex items-center justify-center py-20 text-zinc-500">Carregando...</div>;

  const content = { ...(page.aiGeneratedContent as Record<string, unknown> || {}), ...(page.userEditedContent as Record<string, unknown> || {}) };

  return (
    <div>
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-white">Editar pagina</h1>
          <div className="flex gap-2">
            {saving && <span className="text-zinc-500 text-xs self-center">Salvando...</span>}
            <button onClick={() => router.push('/pages')} className="px-4 py-2 bg-zinc-800 text-zinc-300 rounded-lg text-sm">Voltar</button>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-zinc-500 text-xs block mb-1">Nome do produto</label>
            <input
              defaultValue={(content.name as string) || ''}
              onBlur={(e) => save('name', e.target.value)}
              className="w-full bg-zinc-900 text-white rounded-lg px-3 py-2 text-sm border border-zinc-800"
            />
          </div>
          <div>
            <label className="text-zinc-500 text-xs block mb-1">Descricao</label>
            <textarea
              defaultValue={(content.description as string) || ''}
              onBlur={(e) => save('description', e.target.value)}
              rows={3}
              className="w-full bg-zinc-900 text-white rounded-lg px-3 py-2 text-sm border border-zinc-800"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-zinc-500 text-xs block mb-1">Preco</label>
              <input
                type="number"
                defaultValue={String(page.price || '')}
                onBlur={(e) => apiFetch(`/pages/${id}`, { method: 'PATCH', body: JSON.stringify({ price: Number(e.target.value) }) })}
                className="w-full bg-zinc-900 text-white rounded-lg px-3 py-2 text-sm border border-zinc-800"
              />
            </div>
            <div>
              <label className="text-zinc-500 text-xs block mb-1">Preco original</label>
              <input
                type="number"
                defaultValue={String(page.originalPrice || '')}
                onBlur={(e) => apiFetch(`/pages/${id}`, { method: 'PATCH', body: JSON.stringify({ originalPrice: Number(e.target.value) }) })}
                className="w-full bg-zinc-900 text-white rounded-lg px-3 py-2 text-sm border border-zinc-800"
              />
            </div>
          </div>

          {/* Tracking Section */}
          <div className="card-glow bg-[#111113] rounded-xl border border-white/[0.06] p-6 mt-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-white font-semibold">Tracking</h2>
                <p className="text-zinc-500 text-xs mt-1">Configure o rastreamento de conversoes e pixel do Meta.</p>
              </div>
              {tracking.pixelId && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-900 text-emerald-400">ATIVO</span>
              )}
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-zinc-500 text-xs block mb-1">URL do checkout (Yampi)</label>
                <input
                  type="url"
                  value={tracking.checkoutUrl}
                  onChange={(e) => setTracking({ ...tracking, checkoutUrl: e.target.value })}
                  placeholder="https://seguro.loja.com.br/r/PRODUTO"
                  className="w-full bg-white/[0.04] text-white rounded-lg px-3 py-2 text-sm border border-white/[0.06]"
                />
              </div>
              <div>
                <label className="text-zinc-500 text-xs block mb-1">Pixel ID (Meta)</label>
                <input
                  type="text"
                  value={tracking.pixelId}
                  onChange={(e) => setTracking({ ...tracking, pixelId: e.target.value })}
                  placeholder="123456789"
                  className="w-full bg-white/[0.04] text-white rounded-lg px-3 py-2 text-sm border border-white/[0.06]"
                />
              </div>
              <div>
                <label className="text-zinc-500 text-xs block mb-1">Access Token (Meta)</label>
                <input
                  type="password"
                  value={tracking.accessToken}
                  onChange={(e) => setTracking({ ...tracking, accessToken: e.target.value })}
                  placeholder="EAAxxxxxxx... (preencha para atualizar)"
                  className="w-full bg-white/[0.04] text-white rounded-lg px-3 py-2 text-sm border border-white/[0.06]"
                />
                <p className="text-zinc-600 text-[10px] mt-1">Deixe vazio para manter o token atual.</p>
              </div>
              <button
                onClick={saveTracking}
                disabled={saving}
                className="w-full py-2.5 bg-emerald-500 text-white rounded-lg font-semibold text-sm hover:bg-emerald-600 transition disabled:opacity-50"
              >
                {saving ? 'Salvando...' : trackingSaved ? 'Salvo!' : 'Salvar tracking'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
