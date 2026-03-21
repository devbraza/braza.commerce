'use client';

import { useState, useRef, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import { useRouter } from 'next/navigation';

interface BrazaPagesDomain {
  id: string;
  domain: string;
  status: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface GeneratedContent {
  name: string;
  brand: string;
  description: string;
  features: string[];
  reviews: { stars: number; text: string; author: string; verified: boolean }[];
  faq: { question: string; answer: string }[];
  miniReview: { initials: string; stars: number; text: string; author: string };
}

interface UploadedImage {
  file: File;
  preview: string;
  url?: string;
}

export default function NewPagePage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState(1);
  const [pageId, setPageId] = useState<string | null>(null);
  const [photos, setPhotos] = useState<UploadedImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const [price, setPrice] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [checkoutUrl, setCheckoutUrl] = useState('');
  const [generating, setGenerating] = useState(false);
  const [content, setContent] = useState<GeneratedContent | null>(null);
  const [publishedSlug, setPublishedSlug] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [customSlug, setCustomSlug] = useState('');
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [checkingSlug, setCheckingSlug] = useState(false);
  const slugTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [brazaPagesStatus, setBrazaPagesStatus] = useState<'idle' | 'loading' | 'success' | 'error' | 'unavailable'>('idle');
  const [brazaPagesUrl, setBrazaPagesUrl] = useState<string | null>(null);
  const [brazaPagesError, setBrazaPagesError] = useState<string | null>(null);
  const [brazaPagesDomains, setBrazaPagesDomains] = useState<BrazaPagesDomain[]>([]);
  const [selectedDomainId, setSelectedDomainId] = useState<string>('');
  const [loadingDomains, setLoadingDomains] = useState(false);

  // Load braza.pages domains when reaching step 4
  useEffect(() => {
    if (step !== 4) return;
    setLoadingDomains(true);
    apiFetch<BrazaPagesDomain[]>('/pages/braza-pages-domains')
      .then((data) => {
        setBrazaPagesDomains(data);
        if (data.length > 0) setSelectedDomainId(data[0].id);
      })
      .catch(() => {
        setBrazaPagesDomains([]);
        setBrazaPagesStatus('unavailable');
      })
      .finally(() => setLoadingDomains(false));
  }, [step]);

  // Photo management
  const addPhotos = (files: FileList) => {
    const remaining = 6 - photos.length;
    const newPhotos = Array.from(files).slice(0, remaining).map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setPhotos([...photos, ...newPhotos]);
  };

  const removePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const movePhoto = (from: number, to: number) => {
    if (to < 0 || to >= photos.length) return;
    const updated = [...photos];
    const [moved] = updated.splice(from, 1);
    updated.splice(to, 0, moved);
    setPhotos(updated);
  };

  // Step 1 → Step 2: Create page + upload all photos + generate copy
  const handleGenerate = async () => {
    if (photos.length === 0) return alert('Adicione pelo menos 1 foto');
    setUploading(true);
    setGenerating(true);

    try {
      // 1. Create page
      const page = await apiFetch<{ id: string }>('/pages', {
        method: 'POST',
        body: JSON.stringify({
          price: price ? Number(price) : undefined,
          originalPrice: originalPrice ? Number(originalPrice) : undefined,
          checkoutUrl: checkoutUrl || undefined,
        }),
      });
      setPageId(page.id);

      // 2. Upload first photo as reference (for AI analysis)
      const refForm = new FormData();
      refForm.append('file', photos[0].file);
      const refRes = await fetch(`${API_URL}/pages/${page.id}/reference`, { method: 'POST', body: refForm });
      if (!refRes.ok) throw new Error('Erro no upload da foto de referencia');

      // 3. Upload all photos as page images
      const uploadedPhotos: UploadedImage[] = [];
      for (let i = 0; i < photos.length; i++) {
        const form = new FormData();
        form.append('file', photos[i].file);
        const res = await fetch(`${API_URL}/pages/${page.id}/images`, { method: 'POST', body: form });
        if (res.ok) {
          const data = await res.json();
          uploadedPhotos.push({ ...photos[i], url: data.url });
        } else {
          uploadedPhotos.push(photos[i]);
        }
      }
      setPhotos(uploadedPhotos);

      // 4. Generate copy with AI (texts only)
      const copyRes = await apiFetch<{ content: GeneratedContent }>(`/pages/${page.id}/generate-copy`, { method: 'POST' });
      setContent(copyRes.content);
      setStep(2);
    } catch (err) {
      alert('Erro: ' + (err as Error).message);
    }
    setUploading(false);
    setGenerating(false);
  };

  // Slug management
  const slugify = (text: string) =>
    text.toLowerCase().replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-').replace(/^-/, '');

  const handleSlugChange = (value: string) => {
    const sanitized = slugify(value);
    setCustomSlug(sanitized);
    setSlugAvailable(null);
    if (slugTimerRef.current) clearTimeout(slugTimerRef.current);
    if (sanitized.length >= 3) {
      setCheckingSlug(true);
      slugTimerRef.current = setTimeout(async () => {
        try {
          const res = await apiFetch<{ available: boolean }>(`/pages/check-slug/${sanitized}`);
          setSlugAvailable(res.available);
        } catch {
          setSlugAvailable(null);
        }
        setCheckingSlug(false);
      }, 300);
    } else {
      setCheckingSlug(false);
    }
  };

  // Content editing
  const updateField = (field: string, value: string) => {
    if (!content) return;
    setContent({ ...content, [field]: value });
  };

  const updateFeature = (index: number, value: string) => {
    if (!content) return;
    const features = [...content.features];
    features[index] = value;
    setContent({ ...content, features });
  };

  const updateReview = (index: number, field: string, value: string | number) => {
    if (!content) return;
    const reviews = [...content.reviews];
    reviews[index] = { ...reviews[index], [field]: value };
    setContent({ ...content, reviews });
  };

  const updateFaq = (index: number, field: string, value: string) => {
    if (!content) return;
    const faq = [...content.faq];
    faq[index] = { ...faq[index], [field]: value };
    setContent({ ...content, faq });
  };

  const saveContent = async () => {
    if (!pageId || !content) return;
    setSaving(true);
    try {
      await apiFetch(`/pages/${pageId}`, {
        method: 'PATCH',
        body: JSON.stringify({ userEditedContent: content }),
      });
      setStep(3);
    } catch (err) {
      alert('Erro ao salvar: ' + (err as Error).message);
    }
    setSaving(false);
  };

  const publishWithSlug = async () => {
    if (!pageId) return;
    setSaving(true);
    try {
      if (customSlug.length >= 3) {
        await apiFetch(`/pages/${pageId}`, {
          method: 'PATCH',
          body: JSON.stringify({ slug: customSlug }),
        });
      }
      const res = await apiFetch<{ slug: string }>(`/pages/${pageId}/publish`, { method: 'PATCH' });
      setPublishedSlug(res.slug);
      setStep(4);
    } catch (err) {
      alert('Erro ao publicar: ' + (err as Error).message);
    }
    setSaving(false);
  };

  const publishToBrazaPages = async () => {
    if (!pageId || !selectedDomainId) return;
    setBrazaPagesStatus('loading');
    setBrazaPagesError(null);
    try {
      const res = await apiFetch<{ success: boolean; url: string; deploymentId: string }>(
        `/pages/${pageId}/publish-to-braza-pages`,
        {
          method: 'POST',
          body: JSON.stringify({ domain_id: selectedDomainId }),
        },
      );
      setBrazaPagesUrl(res.url);
      setBrazaPagesStatus('success');
    } catch (err) {
      const message = (err as Error).message || 'Erro desconhecido';
      if (message.includes('503') || message.includes('nao configurada')) {
        setBrazaPagesStatus('unavailable');
      } else {
        setBrazaPagesStatus('error');
        setBrazaPagesError(message);
      }
    }
  };

  return (
    <div>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-xl font-bold text-white mb-8">Nova pagina</h1>

        {/* STEP 1: Photos + Price + Generate */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="card-glow bg-[#111113] rounded-xl border border-white/[0.06] p-6">
              <h2 className="text-white font-semibold mb-2">1. Fotos do produto</h2>
              <p className="text-zinc-500 text-xs mb-4">Adicione ate 6 fotos. A primeira sera usada pela IA para gerar os textos.</p>

              {/* Photo grid */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                {photos.map((photo, i) => (
                  <div key={photo.preview} className="relative group">
                    <img src={photo.preview} alt={`Foto ${i + 1}`} className="rounded-lg w-full aspect-square object-cover border border-white/[0.06]" />
                    <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition">
                      <button onClick={() => removePhoto(i)} className="w-6 h-6 bg-red-600 text-white rounded-full text-xs font-bold hover:bg-red-500">X</button>
                    </div>
                    <div className="absolute bottom-1 left-1 right-1 flex justify-between opacity-0 group-hover:opacity-100 transition">
                      {i > 0 && <button onClick={() => movePhoto(i, i - 1)} className="w-7 h-7 bg-black/60 text-white rounded text-xs hover:bg-white/[0.08]">←</button>}
                      {i < photos.length - 1 && <button onClick={() => movePhoto(i, i + 1)} className="w-7 h-7 bg-black/60 text-white rounded text-xs hover:bg-white/[0.08] ml-auto">→</button>}
                    </div>
                    <span className="absolute top-1 left-1 bg-black/60 text-zinc-400 text-[10px] px-1.5 py-0.5 rounded">
                      {i === 0 ? 'Principal' : i + 1}
                    </span>
                  </div>
                ))}

                {photos.length < 6 && (
                  <div
                    onClick={() => fileRef.current?.click()}
                    className="border-2 border-dashed border-white/[0.1] rounded-lg aspect-square flex items-center justify-center cursor-pointer hover:border-white/[0.2] transition"
                  >
                    <div className="text-center">
                      <span className="text-zinc-500 text-2xl block">+</span>
                      <span className="text-zinc-600 text-[10px]">{photos.length}/6</span>
                    </div>
                  </div>
                )}
              </div>

              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden"
                onChange={(e) => { if (e.target.files) addPhotos(e.target.files); e.target.value = ''; }} />
            </div>

            <div className="card-glow bg-[#111113] rounded-xl border border-white/[0.06] p-6">
              <h2 className="text-white font-semibold mb-4">2. Dados do produto</h2>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <input type="number" placeholder="Preco de venda (ex: 79.90)" value={price} onChange={(e) => setPrice(e.target.value)} className="bg-white/[0.04] text-white rounded-lg px-3 py-2 text-sm border border-white/[0.06]" />
                <input type="number" placeholder="Preco original (ex: 129.90)" value={originalPrice} onChange={(e) => setOriginalPrice(e.target.value)} className="bg-white/[0.04] text-white rounded-lg px-3 py-2 text-sm border border-white/[0.06]" />
              </div>
              <input type="url" placeholder="Link do checkout (ex: https://yampi.com.br/...)" value={checkoutUrl} onChange={(e) => setCheckoutUrl(e.target.value)} className="w-full bg-white/[0.04] text-white rounded-lg px-3 py-2 text-sm border border-white/[0.06]" />
            </div>

            <button onClick={handleGenerate} disabled={photos.length === 0 || uploading || generating}
              className="w-full py-3 bg-emerald-500 text-white rounded-lg font-bold hover:bg-emerald-600 transition disabled:opacity-50">
              {uploading ? 'Enviando fotos...' : generating ? 'Gerando textos com IA...' : 'Gerar pagina com IA'}
            </button>
          </div>
        )}

        {/* STEP 2: Review + Edit texts */}
        {step === 2 && content && (
          <div className="space-y-4">
            {/* Photos preview */}
            <div className="card-glow bg-[#111113] rounded-xl border border-white/[0.06] p-6">
              <h2 className="text-white font-semibold mb-2">Suas fotos ({photos.length})</h2>
              <div className="grid grid-cols-6 gap-2">
                {photos.map((photo, i) => (
                  <img key={photo.preview} src={photo.preview} alt={`${i + 1}`} className="rounded w-full aspect-square object-cover border border-white/[0.06]" />
                ))}
              </div>
            </div>

            {/* Text editing */}
            <div className="card-glow bg-[#111113] rounded-xl border border-white/[0.06] p-6">
              <h2 className="text-white font-semibold mb-1">Textos gerados pela IA</h2>
              <p className="text-zinc-500 text-xs mb-4">Revise e corrija o que precisar antes de publicar.</p>
              <div className="space-y-4">
                <div>
                  <label className="text-zinc-500 text-xs block mb-1">Nome do produto</label>
                  <input value={content.name} onChange={(e) => updateField('name', e.target.value)}
                    className="w-full bg-white/[0.04] text-white rounded-lg px-3 py-2 text-sm border border-white/[0.06]" />
                </div>
                <div>
                  <label className="text-zinc-500 text-xs block mb-1">Marca / Colecao</label>
                  <input value={content.brand} onChange={(e) => updateField('brand', e.target.value)}
                    className="w-full bg-white/[0.04] text-white rounded-lg px-3 py-2 text-sm border border-white/[0.06]" />
                </div>
                <div>
                  <label className="text-zinc-500 text-xs block mb-1">Descricao</label>
                  <textarea value={content.description} onChange={(e) => updateField('description', e.target.value)} rows={3}
                    className="w-full bg-white/[0.04] text-white rounded-lg px-3 py-2 text-sm border border-white/[0.06]" />
                </div>

                <div>
                  <label className="text-zinc-500 text-xs block mb-2">Features / Beneficios</label>
                  {content.features.map((f, i) => (
                    <input key={i} value={f} onChange={(e) => updateFeature(i, e.target.value)}
                      className="w-full bg-white/[0.04] text-white rounded-lg px-3 py-2 text-sm border border-white/[0.06] mb-2" />
                  ))}
                </div>

                <div>
                  <label className="text-zinc-500 text-xs block mb-2">Avaliacoes</label>
                  {content.reviews.map((r, i) => (
                    <div key={i} className="bg-white/[0.04] rounded-lg p-3 mb-2 border border-white/[0.06]">
                      <div className="flex gap-2 mb-2">
                        <select value={r.stars} onChange={(e) => updateReview(i, 'stars', Number(e.target.value))}
                          className="bg-white/[0.06] text-white rounded px-2 py-1 text-xs border border-white/[0.08]">
                          <option value={5}>5 estrelas</option>
                          <option value={4}>4 estrelas</option>
                          <option value={3}>3 estrelas</option>
                        </select>
                        <input value={r.author} onChange={(e) => updateReview(i, 'author', e.target.value)}
                          className="flex-1 bg-white/[0.06] text-white rounded px-2 py-1 text-xs border border-white/[0.08]" placeholder="Nome" />
                      </div>
                      <textarea value={r.text} onChange={(e) => updateReview(i, 'text', e.target.value)} rows={2}
                        className="w-full bg-white/[0.06] text-white rounded px-2 py-1 text-xs border border-white/[0.08]" />
                    </div>
                  ))}
                </div>

                <div>
                  <label className="text-zinc-500 text-xs block mb-2">FAQ</label>
                  {content.faq.map((f, i) => (
                    <div key={i} className="bg-white/[0.04] rounded-lg p-3 mb-2 border border-white/[0.06]">
                      <input value={f.question} onChange={(e) => updateFaq(i, 'question', e.target.value)}
                        className="w-full bg-white/[0.06] text-white rounded px-2 py-1 text-xs border border-white/[0.08] mb-2" placeholder="Pergunta" />
                      <textarea value={f.answer} onChange={(e) => updateFaq(i, 'answer', e.target.value)} rows={2}
                        className="w-full bg-white/[0.06] text-white rounded px-2 py-1 text-xs border border-white/[0.08]" placeholder="Resposta" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <button onClick={saveContent} disabled={saving} className="w-full py-3 bg-emerald-500 text-white rounded-lg font-bold hover:bg-emerald-600 transition disabled:opacity-50">
              {saving ? 'Salvando...' : 'Continuar'}
            </button>
          </div>
        )}

        {/* STEP 3: Custom Slug */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="card-glow bg-[#111113] rounded-xl border border-white/[0.06] p-6">
              <h2 className="text-white font-semibold mb-1">URL personalizada</h2>
              <p className="text-zinc-500 text-xs mb-4">Defina a URL da sua pagina para usar nos anuncios. Deixe vazio para usar a URL automatica.</p>

              <div className="flex items-center gap-0 bg-white/[0.04] rounded-lg border border-white/[0.06] overflow-hidden">
                <span className="text-zinc-500 text-sm px-3 py-2 bg-white/[0.02] border-r border-white/[0.06] whitespace-nowrap select-none">braza.commerce/p/</span>
                <input
                  type="text"
                  value={customSlug}
                  onChange={(e) => handleSlugChange(e.target.value)}
                  placeholder="meu-produto"
                  maxLength={60}
                  className="flex-1 bg-transparent text-white px-3 py-2 text-sm outline-none"
                />
                {checkingSlug && <span className="text-zinc-500 text-xs px-3">...</span>}
                {!checkingSlug && slugAvailable === true && <span className="text-emerald-500 text-xs px-3 font-semibold">Disponivel</span>}
                {!checkingSlug && slugAvailable === false && <span className="text-red-500 text-xs px-3 font-semibold">Ja existe</span>}
              </div>
              {customSlug.length > 0 && customSlug.length < 3 && (
                <p className="text-amber-500 text-xs mt-2">Minimo 3 caracteres</p>
              )}
            </div>

            <button
              onClick={publishWithSlug}
              disabled={saving || (customSlug.length > 0 && (customSlug.length < 3 || slugAvailable === false))}
              className="w-full py-3 bg-emerald-500 text-white rounded-lg font-bold hover:bg-emerald-600 transition disabled:opacity-50"
            >
              {saving ? 'Publicando...' : 'Publicar pagina'}
            </button>
          </div>
        )}

        {/* STEP 4: Published */}
        {step === 4 && publishedSlug && (
          <div className="space-y-4">
            <div className="card-glow bg-[#111113] rounded-xl border border-white/[0.06] p-6 text-center">
              <h2 className="text-white font-semibold mb-2">Pagina publicada!</h2>
              <p className="text-emerald-500 text-sm mt-2">
                {API_URL}/p/{publishedSlug}
              </p>
              <div className="mt-6 flex gap-3 justify-center">
                <a href={`${API_URL}/p/${publishedSlug}`}
                  target="_blank" className="px-6 py-2 bg-emerald-500 text-white rounded-lg text-sm font-semibold hover:bg-emerald-600">
                  Ver pagina
                </a>
                <button onClick={() => router.push('/pages')} className="px-6 py-2 bg-white/[0.04] text-zinc-300 rounded-lg text-sm hover:bg-white/[0.08]">
                  Dashboard
                </button>
              </div>
            </div>

            {/* braza.pages integration */}
            <div className="card-glow bg-[#111113] rounded-xl border border-white/[0.06] p-6 text-center">
              {brazaPagesStatus === 'success' && brazaPagesUrl ? (
                <>
                  <p className="text-emerald-500 font-semibold text-sm mb-1">Publicado no braza.pages!</p>
                  <a href={brazaPagesUrl} target="_blank" rel="noopener noreferrer" className="text-emerald-400 text-sm underline hover:text-emerald-300">
                    {brazaPagesUrl}
                  </a>
                </>
              ) : brazaPagesStatus === 'unavailable' ? (
                <>
                  <p className="text-zinc-500 text-sm mb-1">Servico indisponivel</p>
                  <button disabled className="mt-2 px-6 py-2 bg-white/[0.04] text-zinc-600 rounded-lg text-sm cursor-not-allowed">
                    Publicar com braza.pages
                  </button>
                </>
              ) : brazaPagesStatus === 'error' ? (
                <>
                  <p className="text-red-400 text-sm mb-1">{brazaPagesError || 'Falha ao publicar'}</p>
                  <button onClick={publishToBrazaPages} className="mt-2 px-6 py-2 bg-red-900/50 text-red-300 rounded-lg text-sm hover:bg-red-900">
                    Tentar novamente
                  </button>
                </>
              ) : (
                <>
                  <p className="text-zinc-400 text-xs mb-3">Publique em dominio customizado com CDN global</p>

                  {loadingDomains ? (
                    <p className="text-zinc-500 text-xs">Carregando dominios...</p>
                  ) : brazaPagesDomains.length === 0 ? (
                    <p className="text-zinc-500 text-xs">Nenhum dominio disponivel no braza.pages</p>
                  ) : (
                    <>
                      <select
                        value={selectedDomainId}
                        onChange={(e) => setSelectedDomainId(e.target.value)}
                        className="w-full bg-white/[0.04] text-white rounded-lg px-3 py-2 text-sm border border-white/[0.06] mb-3"
                      >
                        {brazaPagesDomains.map((d) => (
                          <option key={d.id} value={d.id}>{d.domain}</option>
                        ))}
                      </select>
                      <button
                        onClick={publishToBrazaPages}
                        disabled={brazaPagesStatus === 'loading' || !selectedDomainId}
                        className="px-6 py-2 bg-white/[0.06] text-zinc-200 rounded-lg text-sm font-semibold border border-white/[0.1] hover:bg-white/[0.1] transition disabled:opacity-50"
                      >
                        {brazaPagesStatus === 'loading' ? 'Publicando...' : 'Publicar com braza.pages'}
                      </button>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
