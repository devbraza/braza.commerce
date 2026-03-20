'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface SettingsData {
  hasYampiSecret: boolean;
  defaultPixelId: string | null;
  defaultAccessToken: string | null;
  updatedAt: string;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [yampiSecret, setYampiSecret] = useState('');
  const [pixelId, setPixelId] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [saving, setSaving] = useState('');
  const [copied, setCopied] = useState(false);
  const [lastEventAt, setLastEventAt] = useState<string | null>(null);

  const webhookUrl = `${API_URL}/api/webhooks/yampi`;

  useEffect(() => {
    apiFetch<SettingsData>('/settings').then((s) => {
      setSettings(s);
      setPixelId(s.defaultPixelId || '');
      setAccessToken(s.defaultAccessToken || '');
    });
    // Check last event for connection status
    apiFetch<{ events: { createdAt: string }[] }>('/events?limit=1').then((d) => {
      if (d.events.length > 0) setLastEventAt(d.events[0].createdAt);
    }).catch(() => {});
  }, []);

  const saveYampi = async () => {
    setSaving('yampi');
    try {
      await apiFetch('/settings', { method: 'PATCH', body: JSON.stringify({ yampiSecretKey: yampiSecret }) });
    } catch {
      alert('Erro ao salvar configuracoes da Yampi');
    }
    setSaving('');
  };

  const savePixel = async () => {
    setSaving('pixel');
    try {
      await apiFetch('/settings', { method: 'PATCH', body: JSON.stringify({ defaultPixelId: pixelId, defaultAccessToken: accessToken }) });
    } catch {
      alert('Erro ao salvar configuracoes do Pixel');
    }
    setSaving('');
  };

  const copyWebhookUrl = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const maskToken = (token: string) => {
    if (!token || token.length < 8) return token;
    return '•'.repeat(token.length - 4) + token.slice(-4);
  };

  const isConnected = lastEventAt && (Date.now() - new Date(lastEventAt).getTime()) < 5 * 60 * 1000;

  if (!settings) return <div className="flex items-center justify-center py-20 text-zinc-500">Carregando...</div>;

  return (
    <div className="space-y-6 max-w-lg">
      <h1 className="text-xl font-bold text-white">Configuracoes</h1>

      {/* Yampi Section */}
      <div className="card-glow bg-[#111113] rounded-xl border border-white/[0.06] p-5 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-[12px] font-semibold text-white">Integracao Yampi</p>
          <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
            isConnected
              ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 live-pulse'
              : 'bg-zinc-500/10 border border-zinc-500/20 text-zinc-500'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-zinc-500'}`} />
            {isConnected ? 'Conectado' : 'Sem dados'}
          </span>
        </div>

        <div>
          <label className="text-[10px] font-semibold text-zinc-600 uppercase tracking-wider block mb-1.5">Webhook URL</label>
          <div className="flex gap-2">
            <input
              readOnly
              value={webhookUrl}
              className="flex-1 px-3 py-1.5 text-[11px] font-mono font-medium bg-white/[0.04] border border-white/[0.06] rounded-lg text-zinc-400"
            />
            <button
              onClick={copyWebhookUrl}
              className="px-3 py-1.5 text-[11px] font-semibold bg-white/[0.08] hover:bg-white/[0.12] text-white border border-white/[0.08] rounded-lg"
            >
              {copied ? 'Copiado!' : 'Copiar'}
            </button>
          </div>
        </div>

        <div>
          <label className="text-[10px] font-semibold text-zinc-600 uppercase tracking-wider block mb-1.5">Secret Key</label>
          <input
            type="password"
            value={yampiSecret}
            onChange={(e) => setYampiSecret(e.target.value)}
            placeholder={settings.hasYampiSecret ? 'Secret configurada — digite para substituir' : 'Cole a secret key da Yampi'}
            className="w-full px-3 py-1.5 text-[11px] font-medium bg-white/[0.04] border border-white/[0.06] rounded-lg text-zinc-300"
          />
        </div>

        <button
          onClick={saveYampi}
          disabled={saving === 'yampi'}
          className="px-4 py-1.5 text-[11px] font-semibold bg-white/[0.08] hover:bg-white/[0.12] text-white border border-white/[0.08] rounded-lg disabled:opacity-50"
        >
          {saving === 'yampi' ? 'Salvando...' : 'Salvar Yampi'}
        </button>
      </div>

      {/* Meta Pixel Section */}
      <div className="card-glow bg-[#111113] rounded-xl border border-white/[0.06] p-5 space-y-4">
        <p className="text-[12px] font-semibold text-white">Meta Pixel (padrao)</p>
        <p className="text-[10px] text-zinc-500">Usado como fallback quando a campanha nao tem pixel proprio.</p>

        <div>
          <label className="text-[10px] font-semibold text-zinc-600 uppercase tracking-wider block mb-1.5">Pixel ID</label>
          <input
            value={pixelId}
            onChange={(e) => setPixelId(e.target.value)}
            placeholder="123456789012345"
            className="w-full px-3 py-1.5 text-[11px] font-medium bg-white/[0.04] border border-white/[0.06] rounded-lg text-zinc-300"
          />
        </div>

        <div>
          <label className="text-[10px] font-semibold text-zinc-600 uppercase tracking-wider block mb-1.5">Access Token</label>
          <div className="relative">
            <input
              type="password"
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
              placeholder="EAAxxxxxxx..."
              className="w-full px-3 py-1.5 text-[11px] font-medium bg-white/[0.04] border border-white/[0.06] rounded-lg text-zinc-300"
            />
            {settings.defaultAccessToken && !accessToken && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-zinc-500 font-mono">
                {maskToken(settings.defaultAccessToken)}
              </span>
            )}
          </div>
        </div>

        <button
          onClick={savePixel}
          disabled={saving === 'pixel'}
          className="px-4 py-1.5 text-[11px] font-semibold bg-white/[0.08] hover:bg-white/[0.12] text-white border border-white/[0.08] rounded-lg disabled:opacity-50"
        >
          {saving === 'pixel' ? 'Salvando...' : 'Salvar Pixel'}
        </button>
      </div>
    </div>
  );
}
