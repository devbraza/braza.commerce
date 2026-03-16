'use client';

import { useEffect, useState, useCallback } from 'react';
import { apiFetch } from '@/lib/api';

interface Props {
  onConnected: () => void;
}

export function WhatsAppQrCode({ onConnected }: Props) {
  const [qrBase64, setQrBase64] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [failures, setFailures] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const fetchQrCode = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiFetch<{ base64?: string; connected?: boolean }>('/users/whatsapp/qrcode');
      if (data.connected) {
        onConnected();
        return;
      }
      if (data.base64) {
        setQrBase64(data.base64);
        setFailures(0);
      }
    } catch {
      setFailures(prev => prev + 1);
      if (failures >= 2) {
        setError('QR Code expirado. Clique para gerar novo.');
      }
    } finally {
      setLoading(false);
    }
  }, [failures, onConnected]);

  useEffect(() => {
    fetchQrCode();
  }, []);// eslint-disable-line react-hooks/exhaustive-deps

  // Auto-refresh every 20s (QR invalidates every 20s per Z-API docs)
  useEffect(() => {
    if (failures >= 3 || !qrBase64) return;

    const interval = setInterval(async () => {
      const status = await apiFetch<{ connected: boolean }>('/users/whatsapp/status').catch(() => null);
      if (status?.connected) {
        onConnected();
        return;
      }
      fetchQrCode();
    }, 20000);

    return () => clearInterval(interval);
  }, [qrBase64, failures, onConnected, fetchQrCode]);

  if (loading && !qrBase64) {
    return (
      <div className="flex flex-col items-center gap-3 py-8">
        <div className="h-48 w-48 rounded-xl bg-white/[0.06] animate-pulse" />
        <p className="text-[11px] text-zinc-500">Carregando QR Code...</p>
      </div>
    );
  }

  if (error || failures >= 3) {
    return (
      <div className="flex flex-col items-center gap-3 py-8">
        <div className="h-48 w-48 rounded-xl border border-white/[0.08] bg-white/[0.02] flex items-center justify-center">
          <p className="text-xs text-zinc-500 text-center px-4">QR Code expirado</p>
        </div>
        <button
          type="button"
          onClick={() => { setFailures(0); setError(null); fetchQrCode(); }}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          Gerar novo QR Code
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 py-4">
      {qrBase64 && (
        <div className="rounded-xl border border-white/[0.08] bg-white p-3">
          <img
            src={qrBase64.startsWith('data:') ? qrBase64 : `data:image/png;base64,${qrBase64}`}
            alt="QR Code WhatsApp"
            className="h-48 w-48"
          />
        </div>
      )}
      <p className="text-[11px] text-zinc-500">Escaneie com seu WhatsApp para conectar</p>
      <div className="flex items-center gap-1.5">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse inline-block" />
        <span className="text-[11px] text-amber-400">Aguardando leitura...</span>
      </div>
    </div>
  );
}
