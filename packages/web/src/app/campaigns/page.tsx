'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Campaign {
  id: string;
  name: string;
  trackingCode: string;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmContent: string | null;
  utmTerm: string | null;
  product: { name: string };
  adAccount: { name: string };
  _count: { clicks: number; leads: number };
}

interface Product {
  id: string;
  name: string;
  messageTemplate?: string | null;
}

interface AdAccount {
  id: string;
  name: string;
  accountId: string;
}

interface Pixel {
  id: string;
  name: string;
  pixelId: string;
}

interface CreatedCampaign {
  id: string;
  name: string;
  trackingCode: string;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmContent: string | null;
  utmTerm: string | null;
  product?: { name: string; messageTemplate: string | null };
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DOMAIN = 'link.brazachat.shop';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildFullLink(trackingCode: string, utm: {
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  utmContent?: string | null;
  utmTerm?: string | null;
}): string {
  const params = new URLSearchParams();
  if (utm.utmSource) params.set('utm_source', utm.utmSource);
  if (utm.utmMedium) params.set('utm_medium', utm.utmMedium);
  if (utm.utmCampaign) params.set('utm_campaign', utm.utmCampaign);
  if (utm.utmContent) params.set('utm_content', utm.utmContent);
  if (utm.utmTerm) params.set('utm_term', utm.utmTerm);
  const qs = params.toString();
  return `https://${DOMAIN}/c/${trackingCode}${qs ? `?${qs}` : ''}`;
}

function buildShortLink(trackingCode: string): string {
  return `https://${DOMAIN}/c/${trackingCode}`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback: do nothing
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="rounded-lg border border-white/[0.06] bg-white/[0.04] px-4 py-2 text-sm font-medium text-white transition hover:bg-white/[0.08] active:scale-95"
    >
      {copied ? 'Copiado!' : label}
    </button>
  );
}

function WhatsAppPreview({ campaign }: { campaign: CreatedCampaign }) {
  const template = campaign.product?.messageTemplate ?? 'Oi, quero saber mais sobre o {product}';
  const productName = campaign.product?.name ?? 'produto';
  const message = template.replace('{product}', productName);

  return (
    <div className="mt-5">
      <p className="mb-2 text-xs text-zinc-500">Preview WhatsApp</p>
      <div className="flex justify-start">
        <div className="bg-emerald-600 text-white rounded-xl p-3 max-w-xs text-sm leading-snug shadow-md">
          {message}
        </div>
      </div>
      <p className="mt-1.5 text-[10px] text-zinc-600">
        Mensagem que o lead receberá ao clicar no link
      </p>
    </div>
  );
}

function TrackingLinkPanel({ campaign }: { campaign: CreatedCampaign }) {
  const fullLink = buildFullLink(campaign.trackingCode, {
    utmSource: campaign.utmSource,
    utmMedium: campaign.utmMedium,
    utmCampaign: campaign.utmCampaign,
    utmContent: campaign.utmContent,
    utmTerm: campaign.utmTerm,
  });
  const shortLink = buildShortLink(campaign.trackingCode);

  const utmRows = [
    { param: 'utm_source', value: campaign.utmSource },
    { param: 'utm_medium', value: campaign.utmMedium },
    { param: 'utm_campaign', value: campaign.utmCampaign },
    { param: 'utm_content', value: campaign.utmContent },
    { param: 'utm_term', value: campaign.utmTerm },
  ].filter((r) => r.value);

  return (
    <div className="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.04] p-5">
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-emerald-400">
        Link de Campanha
      </h3>

      {/* Full link */}
      <div className="mb-3">
        <p className="mb-1 text-xs text-zinc-500">Link Completo (com UTMs)</p>
        <div className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-[#09090b] px-3 py-2">
          <span className="flex-1 truncate font-mono text-xs text-indigo-300">{fullLink}</span>
        </div>
      </div>

      {/* Short link */}
      <div className="mb-4">
        <p className="mb-1 text-xs text-zinc-500">Link Curto</p>
        <div className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-[#09090b] px-3 py-2">
          <span className="flex-1 truncate font-mono text-xs text-indigo-300">{shortLink}</span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="mb-5 flex flex-wrap gap-2">
        <CopyButton text={fullLink} label="Copiar Link Completo" />
        <CopyButton text={shortLink} label="Copiar Link Curto" />
        <button
          onClick={() => window.open(fullLink, '_blank', 'noopener,noreferrer')}
          className="rounded-lg border border-white/[0.06] bg-white/[0.04] px-4 py-2 text-sm font-medium text-white transition hover:bg-white/[0.08] active:scale-95"
        >
          Testar Link ↗
        </button>
      </div>

      {/* UTM table */}
      {utmRows.length > 0 && (
        <div>
          <p className="mb-2 text-xs text-zinc-500">Parâmetros UTM</p>
          <table className="w-full rounded-lg border border-white/[0.06] bg-[#09090b] text-sm">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="p-2 text-left text-xs text-zinc-500">Parâmetro</th>
                <th className="p-2 text-left text-xs text-zinc-500">Valor</th>
              </tr>
            </thead>
            <tbody>
              {utmRows.map((r) => (
                <tr key={r.param} className="border-b border-white/[0.06] last:border-0">
                  <td className="p-2 font-mono text-xs text-zinc-400">{r.param}</td>
                  <td className="p-2 font-mono text-xs text-white">{r.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* WhatsApp Preview */}
      <WhatsAppPreview campaign={campaign} />
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CampaignsPage() {
  // List state
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loadingList, setLoadingList] = useState(true);

  // Form toggle
  const [showForm, setShowForm] = useState(false);

  // Dropdown options
  const [products, setProducts] = useState<Product[]>([]);
  const [adAccounts, setAdAccounts] = useState<AdAccount[]>([]);
  const [pixels, setPixels] = useState<Pixel[]>([]);
  const [loadingPixels, setLoadingPixels] = useState(false);

  // Form fields
  const [formName, setFormName] = useState('');
  const [formProductId, setFormProductId] = useState('');
  const [formAdAccountId, setFormAdAccountId] = useState('');
  const [formPixelId, setFormPixelId] = useState('');
  const [formAdsetName, setFormAdsetName] = useState('');
  const [formAdName, setFormAdName] = useState('');
  const [formCreativeName, setFormCreativeName] = useState('');

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [createdCampaign, setCreatedCampaign] = useState<CreatedCampaign | null>(null);

  // ── Load campaign list ──
  useEffect(() => {
    apiFetch<{ data: Campaign[]; total: number; page: number; limit: number }>('/campaigns')
      .then((res) => setCampaigns(res.data))
      .catch(console.error)
      .finally(() => setLoadingList(false));
  }, []);

  // ── Load dropdowns when form opens ──
  useEffect(() => {
    if (!showForm) return;
    apiFetch<Product[]>('/products').then(setProducts).catch(console.error);
    apiFetch<AdAccount[]>('/meta/ad-accounts').then(setAdAccounts).catch(console.error);
  }, [showForm]);

  // ── Load pixels when adAccountId changes ──
  useEffect(() => {
    if (!formAdAccountId) {
      setPixels([]);
      setFormPixelId('');
      return;
    }
    setLoadingPixels(true);
    setFormPixelId('');
    apiFetch<Pixel[]>(`/meta/ad-accounts/${formAdAccountId}/pixels`)
      .then(setPixels)
      .catch(console.error)
      .finally(() => setLoadingPixels(false));
  }, [formAdAccountId]);

  // ── Submit ──
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitting(true);
    try {
      const body = {
        name: formName,
        productId: formProductId,
        adAccountId: formAdAccountId,
        pixelId: formPixelId || undefined,
        adsetName: formAdsetName || undefined,
        adName: formAdName || undefined,
        creativeName: formCreativeName || undefined,
      };
      const created = await apiFetch<CreatedCampaign>('/campaigns', {
        method: 'POST',
        body: JSON.stringify(body),
      });
      // Enrich with product info for WhatsApp preview
      const selectedProduct = products.find((p) => p.id === formProductId);
      setCreatedCampaign({
        ...created,
        product: selectedProduct
          ? { name: selectedProduct.name, messageTemplate: selectedProduct.messageTemplate ?? null }
          : undefined,
      });
      // Refresh list
      apiFetch<{ data: Campaign[]; total: number; page: number; limit: number }>('/campaigns').then((res) => setCampaigns(res.data)).catch(console.error);
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : 'Erro ao criar campanha');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Reset form ──
  const resetForm = () => {
    setFormName('');
    setFormProductId('');
    setFormAdAccountId('');
    setFormPixelId('');
    setFormAdsetName('');
    setFormAdName('');
    setFormCreativeName('');
    setSubmitError(null);
    setCreatedCampaign(null);
    setPixels([]);
  };

  const toggleForm = () => {
    if (showForm) resetForm();
    setShowForm((v) => !v);
  };

  // Detail drawer
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [editingUtms, setEditingUtms] = useState<Record<string, string>>({});

  const openDetail = (c: Campaign) => {
    setSelectedCampaign(c);
    setEditingUtms({
      utmSource: c.utmSource || '',
      utmMedium: c.utmMedium || '',
      utmCampaign: c.utmCampaign || '',
      utmContent: c.utmContent || '',
      utmTerm: c.utmTerm || '',
    });
  };

  const saveUtms = async () => {
    if (!selectedCampaign) return;
    await apiFetch(`/campaigns/${selectedCampaign.id}`, {
      method: 'PATCH',
      body: JSON.stringify(editingUtms),
    });
    // Refresh
    const res = await apiFetch<{ data: Campaign[] }>('/campaigns');
    setCampaigns(res.data);
    const updated = res.data.find((c) => c.id === selectedCampaign.id);
    if (updated) setSelectedCampaign(updated);
  };

  // ── Helpers for campaign list ──
  const copyListLink = (c: Campaign) => {
    navigator.clipboard.writeText(buildFullLink(c.trackingCode, c));
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#09090b] p-6 text-[#fafafa]">
      <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight text-white">Campanhas</h1>
        <button
          onClick={toggleForm}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 active:scale-95"
        >
          {showForm ? '✕ Fechar' : '+ Nova Campanha'}
        </button>
      </div>

      {/* ── Creation Form ── */}
      {showForm && (
        <div className="mb-8 rounded-xl border border-white/[0.06] bg-[#111113] p-6">
          <h2 className="mb-5 text-base font-semibold text-white">Nova Campanha</h2>

          {createdCampaign ? (
            <>
              <p className="mb-1 text-sm text-emerald-400 font-medium">
                Campanha &ldquo;{createdCampaign.name}&rdquo; criada com sucesso!
              </p>
              <TrackingLinkPanel campaign={createdCampaign} />
              <button
                onClick={resetForm}
                className="mt-4 rounded-lg border border-white/[0.06] bg-white/[0.04] px-4 py-2 text-sm text-white hover:bg-white/[0.08]"
              >
                Criar outra campanha
              </button>
            </>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Row 1: Name */}
              <div>
                <label className="mb-1 block text-xs text-zinc-500">Nome da Campanha *</label>
                <input
                  required
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ex: Black Friday — Produto X"
                  className="w-full rounded-lg border border-white/[0.06] bg-white/[0.04] px-3 py-2 text-sm text-white placeholder-zinc-600 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {/* Row 2: Product + Ad Account */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs text-zinc-500">Produto *</label>
                  <select
                    required
                    value={formProductId}
                    onChange={(e) => setFormProductId(e.target.value)}
                    className="w-full rounded-lg border border-white/[0.06] bg-white/[0.04] px-3 py-2 text-sm text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="" disabled className="bg-[#111113]">Selecione um produto</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id} className="bg-[#111113]">{p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs text-zinc-500">Ad Account *</label>
                  <select
                    required
                    value={formAdAccountId}
                    onChange={(e) => setFormAdAccountId(e.target.value)}
                    className="w-full rounded-lg border border-white/[0.06] bg-white/[0.04] px-3 py-2 text-sm text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="" disabled className="bg-[#111113]">Selecione uma conta</option>
                    {adAccounts.map((a) => (
                      <option key={a.id} value={a.id} className="bg-[#111113]">{a.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 3: Pixel */}
              <div>
                <label className="mb-1 block text-xs text-zinc-500">
                  Pixel {formAdAccountId ? '' : '(selecione uma Ad Account primeiro)'}
                </label>
                <select
                  value={formPixelId}
                  onChange={(e) => setFormPixelId(e.target.value)}
                  disabled={!formAdAccountId || loadingPixels}
                  className="w-full rounded-lg border border-white/[0.06] bg-white/[0.04] px-3 py-2 text-sm text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <option value="" className="bg-[#111113]">
                    {loadingPixels ? 'Carregando pixels...' : 'Nenhum pixel (opcional)'}
                  </option>
                  {pixels.map((px) => (
                    <option key={px.id} value={px.id} className="bg-[#111113]">
                      {px.name} ({px.pixelId})
                    </option>
                  ))}
                </select>
              </div>

              {/* Error */}
              {submitError && (
                <p className="rounded-lg border border-red-500/20 bg-red-500/[0.06] px-3 py-2 text-sm text-red-400">
                  {submitError}
                </p>
              )}

              {/* Submit */}
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-indigo-600 px-6 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 active:scale-95"
                >
                  {submitting ? 'Criando...' : 'Criar Campanha'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* ── Campaign List ── */}
      {loadingList ? (
        <div className="rounded-xl border border-white/[0.06] bg-[#111113] overflow-hidden">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-4 p-4 border-b border-white/[0.06] animate-pulse">
              <div className="h-4 bg-white/[0.06] rounded w-32" />
              <div className="h-4 bg-white/[0.06] rounded w-24" />
              <div className="h-4 bg-white/[0.06] rounded w-20" />
              <div className="h-4 bg-white/[0.06] rounded w-16" />
            </div>
          ))}
        </div>
      ) : (
        <table className="w-full rounded-xl border border-white/[0.06] bg-[#111113]">
          <thead>
            <tr className="border-b border-white/[0.06] bg-white/[0.04] text-left text-sm text-zinc-500">
              <th className="p-3">Nome</th>
              <th className="p-3">Produto</th>
              <th className="p-3">Ad Account</th>
              <th className="p-3">Link</th>
              <th className="p-3">Cliques</th>
              <th className="p-3">Leads</th>
              <th className="p-3">Conversão</th>
            </tr>
          </thead>
          <tbody>
            {campaigns.map((c) => {
              const rate =
                c._count.clicks > 0
                  ? ((c._count.leads / c._count.clicks) * 100).toFixed(1)
                  : '0.0';
              return (
                <tr key={c.id} className="border-b border-white/[0.06] hover:bg-white/[0.04] cursor-pointer" onClick={() => openDetail(c)}>
                  <td className="p-3 font-medium">{c.name}</td>
                  <td className="p-3">{c.product.name}</td>
                  <td className="p-3">{c.adAccount.name}</td>
                  <td className="p-3">
                    <button
                      onClick={() => copyListLink(c)}
                      className="text-indigo-400 hover:underline text-sm"
                      title={buildFullLink(c.trackingCode, c)}
                    >
                      {c.trackingCode} 📋
                    </button>
                  </td>
                  <td className="p-3">{c._count.clicks}</td>
                  <td className="p-3">{c._count.leads}</td>
                  <td className="p-3">{rate}%</td>
                </tr>
              );
            })}
            {campaigns.length === 0 && (
              <tr>
                <td colSpan={7} className="p-4 text-center text-zinc-500">
                  Nenhuma campanha cadastrada
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
      {/* Detail Drawer */}
      {selectedCampaign && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50" onClick={() => setSelectedCampaign(null)}>
          <div className="w-full max-w-lg overflow-y-auto bg-[#111113] border-l border-white/[0.06] p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-[15px] font-semibold text-white">{selectedCampaign.name}</h2>
              <button onClick={() => setSelectedCampaign(null)} className="text-zinc-500 hover:text-white text-lg">✕</button>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.04] px-3 py-2 text-center">
                <p className="text-[10px] text-zinc-500">Cliques</p>
                <p className="text-lg font-bold text-white">{selectedCampaign._count.clicks}</p>
              </div>
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.04] px-3 py-2 text-center">
                <p className="text-[10px] text-zinc-500">Leads</p>
                <p className="text-lg font-bold text-white">{selectedCampaign._count.leads}</p>
              </div>
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.04] px-3 py-2 text-center">
                <p className="text-[10px] text-zinc-500">Conversão</p>
                <p className="text-lg font-bold text-white">
                  {selectedCampaign._count.clicks > 0
                    ? ((selectedCampaign._count.leads / selectedCampaign._count.clicks) * 100).toFixed(1)
                    : '0.0'}%
                </p>
              </div>
            </div>

            {/* Links */}
            <div className="mb-6 space-y-2">
              <p className="text-xs text-zinc-500">Link Completo</p>
              <div className="rounded-lg border border-white/[0.06] bg-[#09090b] px-3 py-2">
                <span className="font-mono text-xs text-indigo-300 break-all">{buildFullLink(selectedCampaign.trackingCode, editingUtms)}</span>
              </div>
              <p className="text-xs text-zinc-500 mt-2">Link Curto</p>
              <div className="rounded-lg border border-white/[0.06] bg-[#09090b] px-3 py-2">
                <span className="font-mono text-xs text-indigo-300">{buildShortLink(selectedCampaign.trackingCode)}</span>
              </div>
            </div>

            {/* Inline-editable UTMs */}
            <div className="mb-6">
              <p className="text-xs text-zinc-500 mb-2">Parâmetros UTM (editáveis)</p>
              <div className="space-y-2">
                {['utmSource', 'utmMedium', 'utmCampaign', 'utmContent', 'utmTerm'].map((key) => (
                  <div key={key} className="flex items-center gap-2">
                    <label className="w-28 text-[11px] font-mono text-zinc-500">{key.replace('utm', 'utm_').replace(/([A-Z])/g, (m) => `_${m.toLowerCase()}`).replace('utm__', 'utm_')}</label>
                    <input
                      value={editingUtms[key] || ''}
                      onChange={(e) => setEditingUtms({ ...editingUtms, [key]: e.target.value })}
                      className="flex-1 rounded-lg border border-white/[0.08] bg-white/[0.04] px-2 py-1.5 text-xs text-white outline-none focus:border-indigo-500"
                    />
                  </div>
                ))}
              </div>
              <button
                onClick={saveUtms}
                className="mt-3 rounded-lg bg-indigo-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500"
              >
                Salvar UTMs
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
