'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';

export default function EditPagePage() {
  const { id } = useParams();
  const router = useRouter();
  const [page, setPage] = useState<Record<string, unknown> | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiFetch<Record<string, unknown>>(`/pages/${id}`).then(setPage).catch(() => router.push('/pages'));
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

  if (!page) return <div className="flex min-h-screen items-center justify-center bg-[#09090b] text-zinc-500">Carregando...</div>;

  const content = { ...(page.aiGeneratedContent as Record<string, unknown> || {}), ...(page.userEditedContent as Record<string, unknown> || {}) };

  return (
    <div className="min-h-screen bg-[#09090b] p-6">
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
          <div>
            <label className="text-zinc-500 text-xs block mb-1">URL do checkout</label>
            <input
              defaultValue={(page.checkoutUrl as string) || ''}
              onBlur={(e) => apiFetch(`/pages/${id}`, { method: 'PATCH', body: JSON.stringify({ checkoutUrl: e.target.value }) })}
              className="w-full bg-zinc-900 text-white rounded-lg px-3 py-2 text-sm border border-zinc-800"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
