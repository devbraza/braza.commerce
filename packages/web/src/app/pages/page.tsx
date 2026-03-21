'use client';

import { useEffect, useState } from 'react';
import { apiFetch, getPageUrl } from '@/lib/api';
import Link from 'next/link';

interface PageItem {
  id: string;
  title: string | null;
  slug: string;
  status: string;
  createdAt: string;
  publishedAt: string | null;
  staticUrl: string | null;
  thumbnail: string | null;
}

export default function DashboardPage() {
  const [pages, setPages] = useState<PageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);

  const load = async () => {
    try {
      const data = await apiFetch<PageItem[]>('/pages');
      setPages(data);
    } catch { /* empty */ }
    setLoading(false);
  };

  useEffect(() => {
    let cancelled = false;
    apiFetch<PageItem[]>('/pages')
      .then((data) => { if (!cancelled) setPages(data); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  const copyLink = (slug: string) => {
    const url = getPageUrl(slug);
    navigator.clipboard.writeText(url);
    setCopied(slug);
    setTimeout(() => setCopied(null), 2000);
  };

  const deletePage = async (id: string) => {
    if (!confirm('Tem certeza? Esta acao nao pode ser desfeita.')) return;
    try {
      await apiFetch(`/pages/${id}`, { method: 'DELETE' });
      load();
    } catch {
      alert('Erro ao deletar pagina');
    }
  };

  const togglePublish = async (id: string, status: string) => {
    const action = status === 'PUBLISHED' ? 'unpublish' : 'publish';
    try {
      await apiFetch(`/pages/${id}/${action}`, { method: 'PATCH' });
      load();
    } catch {
      alert('Erro ao alterar status da pagina');
    }
  };

  const duplicate = async (id: string) => {
    try {
      await apiFetch(`/pages/${id}/duplicate`, { method: 'POST' });
      load();
    } catch {
      alert('Erro ao duplicar pagina');
    }
  };

  if (loading) return <div className="flex items-center justify-center py-20 text-zinc-500">Carregando...</div>;

  return (
    <div>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-xl font-bold text-white">Minhas paginas</h1>
          <Link href="/pages/new" className="px-4 py-2 bg-emerald-500 text-white rounded-lg font-semibold text-sm hover:bg-emerald-600 transition">
            + Nova pagina
          </Link>
        </div>

        {pages.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-zinc-500 mb-4">Nenhuma pagina criada ainda</p>
            <Link href="/pages/new" className="px-6 py-3 bg-emerald-500 text-white rounded-lg font-semibold hover:bg-emerald-600 transition">
              Criar primeira pagina
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pages.map((p) => (
              <div key={p.id} className="card-glow bg-[#111113] rounded-xl border border-white/[0.06] overflow-hidden">
                <div className="h-40 bg-white/[0.04] flex items-center justify-center">
                  {p.thumbnail ? (
                    <img src={p.thumbnail} alt={p.title || ''} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-zinc-600 text-sm">Sem imagem</span>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-white font-semibold text-sm truncate">{p.title || 'Sem titulo'}</h2>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      p.status === 'PUBLISHED' ? 'bg-green-900 text-green-400' :
                      p.status === 'ARCHIVED' ? 'bg-red-900 text-red-400' :
                      'bg-white/[0.04] text-zinc-400'
                    }`}>
                      {p.status}
                    </span>
                  </div>
                  <p className="text-zinc-500 text-xs mb-3">{new Date(p.createdAt).toLocaleDateString('pt-BR')}</p>
                  <div className="flex gap-2 flex-wrap">
                    <Link href={`/pages/${p.id}/edit`} className="text-xs px-3 py-1 bg-white/[0.04] text-zinc-300 rounded hover:bg-white/[0.08]">Editar</Link>
                    <button onClick={() => togglePublish(p.id, p.status)} className="text-xs px-3 py-1 bg-white/[0.04] text-zinc-300 rounded hover:bg-white/[0.08]">
                      {p.status === 'PUBLISHED' ? 'Despublicar' : 'Publicar'}
                    </button>
                    {p.status === 'PUBLISHED' && (
                      <button onClick={() => copyLink(p.slug)} className="text-xs px-3 py-1 bg-white/[0.04] text-zinc-300 rounded hover:bg-white/[0.08]">
                        {copied === p.slug ? 'Copiado!' : 'Copiar link'}
                      </button>
                    )}
                    <button onClick={() => duplicate(p.id)} className="text-xs px-3 py-1 bg-white/[0.04] text-zinc-300 rounded hover:bg-white/[0.08]">Duplicar</button>
                    <button onClick={() => deletePage(p.id)} className="text-xs px-3 py-1 bg-red-900/50 text-red-400 rounded hover:bg-red-900">Deletar</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
