'use client';

import { useState, useRef } from 'react';
import { apiFetch } from '@/lib/api';
import { useRouter } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function NewPagePage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState(1);
  const [pageId, setPageId] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [price, setPrice] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [checkoutUrl, setCheckoutUrl] = useState('');
  const [generating, setGenerating] = useState(false);
  const [images, setImages] = useState<{ url: string; position: number }[]>([]);
  const [content, setContent] = useState<Record<string, unknown> | null>(null);
  const [publishedSlug, setPublishedSlug] = useState<string | null>(null);

  const handleUpload = async (file: File) => {
    setPreview(URL.createObjectURL(file));

    // Create page first
    const page = await apiFetch<{ id: string }>('/pages', {
      method: 'POST',
      body: JSON.stringify({
        price: price ? Number(price) : undefined,
        originalPrice: originalPrice ? Number(originalPrice) : undefined,
        checkoutUrl: checkoutUrl || undefined,
      }),
    });
    setPageId(page.id);

    // Upload reference
    const form = new FormData();
    form.append('file', file);
    await fetch(`${API_URL}/pages/${page.id}/reference`, { method: 'POST', body: form });

    // Update price/checkout if set
    if (price || originalPrice || checkoutUrl) {
      await apiFetch(`/pages/${page.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          price: price ? Number(price) : undefined,
          originalPrice: originalPrice ? Number(originalPrice) : undefined,
          checkoutUrl: checkoutUrl || undefined,
        }),
      });
    }
  };

  const generate = async () => {
    if (!pageId) return;
    setGenerating(true);
    try {
      const [imgRes, copyRes] = await Promise.all([
        apiFetch<{ images: { url: string; position: number }[] }>(`/pages/${pageId}/generate-images`, { method: 'POST' }),
        apiFetch<{ content: Record<string, unknown> }>(`/pages/${pageId}/generate-copy`, { method: 'POST' }),
      ]);
      setImages(imgRes.images);
      setContent(copyRes.content);
      setStep(3);
    } catch (err) {
      alert('Erro ao gerar: ' + (err as Error).message);
    }
    setGenerating(false);
  };

  const publish = async () => {
    if (!pageId) return;
    const res = await apiFetch<{ slug: string }>(`/pages/${pageId}/publish`, { method: 'PATCH' });
    setPublishedSlug(res.slug);
    setStep(5);
  };

  return (
    <div className="min-h-screen bg-[#09090b] p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-8">Nova pagina</h1>

        {/* STEP 1: Upload + Price */}
        {step >= 1 && step < 5 && (
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6 mb-4">
            <h2 className="text-white font-semibold mb-4">1. Foto de referencia + dados</h2>
            <div
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-zinc-700 rounded-lg p-8 text-center cursor-pointer hover:border-zinc-500 transition mb-4"
            >
              {preview ? (
                <img src={preview} alt="Preview" className="mx-auto max-h-48 rounded" />
              ) : (
                <p className="text-zinc-500">Clique ou arraste uma foto do produto</p>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleUpload(f);
                }}
              />
            </div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <input type="number" placeholder="Preco (ex: 79.90)" value={price} onChange={(e) => setPrice(e.target.value)} className="bg-zinc-800 text-white rounded-lg px-3 py-2 text-sm border border-zinc-700" />
              <input type="number" placeholder="Preco original (ex: 129.90)" value={originalPrice} onChange={(e) => setOriginalPrice(e.target.value)} className="bg-zinc-800 text-white rounded-lg px-3 py-2 text-sm border border-zinc-700" />
            </div>
            <input type="url" placeholder="URL do checkout (ex: https://yampi.com.br/...)" value={checkoutUrl} onChange={(e) => setCheckoutUrl(e.target.value)} className="w-full bg-zinc-800 text-white rounded-lg px-3 py-2 text-sm border border-zinc-700 mb-4" />

            {pageId && step === 1 && (
              <button onClick={() => setStep(2)} className="w-full py-3 bg-[#2CB67D] text-white rounded-lg font-bold hover:bg-[#239d6a] transition">
                Continuar
              </button>
            )}
          </div>
        )}

        {/* STEP 2: Generate */}
        {step === 2 && (
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6 mb-4">
            <h2 className="text-white font-semibold mb-4">2. Gerar com IA</h2>
            <p className="text-zinc-500 text-sm mb-4">A IA vai gerar 6 imagens profissionais e todo o texto da sua pagina.</p>
            <button onClick={generate} disabled={generating} className="w-full py-3 bg-[#2CB67D] text-white rounded-lg font-bold hover:bg-[#239d6a] transition disabled:opacity-50">
              {generating ? 'Gerando... (pode levar ate 30s)' : 'Gerar com IA'}
            </button>
          </div>
        )}

        {/* STEP 3: Review content */}
        {step === 3 && content && (
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6 mb-4">
            <h2 className="text-white font-semibold mb-4">3. Revise o conteudo</h2>

            {images.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mb-4">
                {images.map((img) => (
                  <img key={img.position} src={img.url} alt={`Product ${img.position}`} className="rounded-lg w-full aspect-square object-cover" />
                ))}
              </div>
            )}

            <div className="space-y-3 text-sm">
              <div><span className="text-zinc-500">Nome:</span> <span className="text-white">{(content as Record<string, string>).name}</span></div>
              <div><span className="text-zinc-500">Descricao:</span> <span className="text-zinc-300">{(content as Record<string, string>).description}</span></div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setStep(4)} className="flex-1 py-3 bg-[#2CB67D] text-white rounded-lg font-bold hover:bg-[#239d6a] transition">
                Preview
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Preview + Publish */}
        {step === 4 && (
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6 mb-4">
            <h2 className="text-white font-semibold mb-4">4. Publicar</h2>
            <p className="text-zinc-500 text-sm mb-4">Sua pagina esta pronta para ser publicada.</p>
            <button onClick={publish} className="w-full py-3 bg-[#2CB67D] text-white rounded-lg font-bold hover:bg-[#239d6a] transition">
              Publicar agora
            </button>
          </div>
        )}

        {/* STEP 5: Published */}
        {step === 5 && publishedSlug && (
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6 text-center">
            <h2 className="text-white font-semibold mb-2">Pagina publicada!</h2>
            <a href={`/p/${publishedSlug}`} target="_blank" className="text-[#2CB67D] underline text-sm">
              {window.location.origin}/p/{publishedSlug}
            </a>
            <div className="mt-6">
              <button onClick={() => router.push('/pages')} className="px-6 py-2 bg-zinc-800 text-zinc-300 rounded-lg text-sm hover:bg-zinc-700">
                Voltar ao dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
