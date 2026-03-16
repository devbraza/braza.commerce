'use client';

import { useState } from 'react';
import { FlaskConical, ArrowRight, CheckCircle, XCircle, Copy } from 'lucide-react';

export default function TestePage() {
  // UTM Test
  const [utmUrl, setUtmUrl] = useState(
    'https://link.brazachat.shop/c/ABX92?utm_source=fb&utm_medium=paid_social&utm_campaign=Brain+Caps&utm_content=Video+01&utm_term=Saude+25-45&fbclid=abc123xyz'
  );
  const [parsedUtms, setParsedUtms] = useState<Record<string, string> | null>(null);

  // CAPI Test
  const [capiPixelId, setCapiPixelId] = useState('');
  const [capiAccessToken, setCapiAccessToken] = useState('');
  const [capiEventName, setCapiEventName] = useState('ViewContent');
  const [capiPhone, setCapiPhone] = useState('');
  const [capiTestCode, setCapiTestCode] = useState('');
  const [capiResult, setCapiResult] = useState<{ success: boolean; response: string } | null>(null);
  const [capiLoading, setCapiLoading] = useState(false);

  const parseUtms = () => {
    try {
      const url = new URL(utmUrl);
      const params: Record<string, string> = {};
      url.searchParams.forEach((value, key) => {
        params[key] = value;
      });
      setParsedUtms(params);
    } catch {
      setParsedUtms({ error: 'URL inválida' });
    }
  };

  const sendTestEvent = async () => {
    if (!capiPixelId || !capiAccessToken) return;
    setCapiLoading(true);
    setCapiResult(null);

    const eventTime = Math.floor(Date.now() / 1000);
    const eventId = `test_${Date.now()}`;

    // SHA-256 hash helper
    const sha256 = async (text: string) => {
      const encoder = new TextEncoder();
      const data = encoder.encode(text.toLowerCase().trim());
      const hash = await crypto.subtle.digest('SHA-256', data);
      return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
    };

    const phoneHash = capiPhone ? await sha256(capiPhone.replace(/[\s\-\(\)]/g, '')) : undefined;

    const payload = {
      data: [
        {
          event_name: capiEventName,
          event_time: eventTime,
          event_id: eventId,
          action_source: 'website',
          event_source_url: 'https://link.brazachat.shop/c/test',
          user_data: {
            client_ip_address: '127.0.0.1',
            client_user_agent: navigator.userAgent,
            ...(phoneHash && { ph: [phoneHash] }),
            external_id: [await sha256(eventId)],
            fbc: `fb.1.${Date.now()}.test_fbclid_123`,
            fbp: `fb.1.${Date.now()}.${Math.floor(Math.random() * 9000000000) + 1000000000}`,
          },
          custom_data: {
            value: 1.00,
            currency: 'BRL',
          },
        },
      ],
      ...(capiTestCode && { test_event_code: capiTestCode }),
    };

    try {
      const res = await fetch(
        `https://graph.facebook.com/v21.0/${capiPixelId}/events?access_token=${capiAccessToken}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
      );
      const data = await res.json();
      setCapiResult({
        success: res.ok,
        response: JSON.stringify(data, null, 2),
      });
    } catch (err: unknown) {
      setCapiResult({
        success: false,
        response: err instanceof Error ? err.message : 'Erro desconhecido',
      });
    } finally {
      setCapiLoading(false);
    }
  };

  const inputClass = 'w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-indigo-500';

  return (
    <div className="min-h-screen bg-[#09090b] p-6 text-[#fafafa]">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-lg bg-violet-500/10 text-violet-400">
            <FlaskConical className="h-5 w-5" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">Teste de Integrações</h1>
        </div>

        {/* Section 1: UTM Test */}
        <div className="rounded-xl border border-white/[0.06] bg-[#111113] p-6 space-y-4">
          <h2 className="text-[15px] font-semibold text-white">1. Testar Recebimento de UTMs</h2>
          <p className="text-[12px] text-zinc-500">
            Cole uma URL com UTMs para verificar se o sistema captura os parâmetros corretamente.
          </p>

          <div className="flex gap-2">
            <input
              value={utmUrl}
              onChange={(e) => setUtmUrl(e.target.value)}
              placeholder="Cole aqui a URL com UTMs..."
              className={`${inputClass} flex-1`}
            />
            <button
              onClick={parseUtms}
              className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
            >
              Analisar <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          {parsedUtms && (
            <div className="rounded-lg border border-white/[0.06] bg-[#09090b] overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06] bg-white/[0.04]">
                    <th className="p-2.5 text-left text-[11px] text-zinc-500">Parâmetro</th>
                    <th className="p-2.5 text-left text-[11px] text-zinc-500">Valor Capturado</th>
                    <th className="p-2.5 text-left text-[11px] text-zinc-500">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid'].map((key) => (
                    <tr key={key} className="border-b border-white/[0.06]">
                      <td className="p-2.5 font-mono text-[11px] text-zinc-400">{key}</td>
                      <td className="p-2.5 font-mono text-[11px] text-white">{parsedUtms[key] || '—'}</td>
                      <td className="p-2.5">
                        {parsedUtms[key] ? (
                          <CheckCircle className="h-4 w-4 text-emerald-400" />
                        ) : (
                          <XCircle className="h-4 w-4 text-zinc-600" />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Section 2: CAPI Test */}
        <div className="rounded-xl border border-white/[0.06] bg-[#111113] p-6 space-y-4">
          <h2 className="text-[15px] font-semibold text-white">2. Testar Envio de Conversão (Meta CAPI)</h2>
          <p className="text-[12px] text-zinc-500">
            Envie um evento de teste diretamente para a Meta Conversion API e veja a resposta.
          </p>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-[11px] text-zinc-500">Pixel ID *</label>
              <input
                value={capiPixelId}
                onChange={(e) => setCapiPixelId(e.target.value)}
                placeholder="Ex: 123456789012345"
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] text-zinc-500">Access Token *</label>
              <input
                type="password"
                value={capiAccessToken}
                onChange={(e) => setCapiAccessToken(e.target.value)}
                placeholder="Token do Facebook"
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] text-zinc-500">Tipo de Evento</label>
              <select
                value={capiEventName}
                onChange={(e) => setCapiEventName(e.target.value)}
                className={inputClass}
              >
                <option value="ViewContent" className="bg-[#111113]">ViewContent</option>
                <option value="AddToCart" className="bg-[#111113]">AddToCart</option>
                <option value="InitiateCheckout" className="bg-[#111113]">InitiateCheckout</option>
                <option value="Purchase" className="bg-[#111113]">Purchase</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[11px] text-zinc-500">Telefone (opcional)</label>
              <input
                value={capiPhone}
                onChange={(e) => setCapiPhone(e.target.value)}
                placeholder="+5511999999999"
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-[11px] text-zinc-500">Test Event Code (copie do Events Manager do Facebook)</label>
            <input
              value={capiTestCode}
              onChange={(e) => setCapiTestCode(e.target.value)}
              placeholder="Ex: TEST58521 — deixe vazio para enviar como evento real"
              className={inputClass}
            />
            <p className="mt-1 text-[10px] text-zinc-600">Encontre em: Events Manager → Pixel → Eventos de teste → Servidor → test_event_code</p>
          </div>

          <button
            onClick={sendTestEvent}
            disabled={!capiPixelId || !capiAccessToken || capiLoading}
            className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {capiLoading ? 'Enviando...' : 'Enviar Evento de Teste'}
          </button>

          {capiResult && (
            <div className={`rounded-lg border p-4 ${
              capiResult.success
                ? 'border-emerald-500/20 bg-emerald-500/[0.04]'
                : 'border-red-500/20 bg-red-500/[0.04]'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                {capiResult.success ? (
                  <CheckCircle className="h-4 w-4 text-emerald-400" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-400" />
                )}
                <span className={`text-sm font-semibold ${capiResult.success ? 'text-emerald-400' : 'text-red-400'}`}>
                  {capiResult.success ? 'Evento enviado com sucesso' : 'Falha no envio'}
                </span>
              </div>
              <pre className="text-[11px] font-mono text-zinc-400 whitespace-pre-wrap overflow-x-auto">
                {capiResult.response}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
