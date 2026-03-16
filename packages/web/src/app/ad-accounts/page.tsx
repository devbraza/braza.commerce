'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

interface AdAccount {
  id: string;
  metaId: string;
  name: string;
  status: string;
}

interface Pixel {
  id: string;
  metaId: string;
  name: string;
}

export default function AdAccountsPage() {
  const [accounts, setAccounts] = useState<AdAccount[]>([]);
  const [pixels, setPixels] = useState<Pixel[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadAccounts = () => {
    setLoading(true);
    apiFetch<AdAccount[]>('/meta/ad-accounts')
      .then(setAccounts)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadAccounts(); }, []);

  const selectAccount = async (id: string) => {
    setSelectedAccount(id);
    const px = await apiFetch<Pixel[]>(`/meta/ad-accounts/${id}/pixels`);
    setPixels(px);
  };

  if (loading) return (
    <div className="min-h-screen bg-[#09090b] p-6 text-[#fafafa]">
      <div className="max-w-5xl mx-auto">
        <div className="h-7 bg-white/[0.06] rounded w-40 mb-6 animate-pulse" />
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-[#111113] rounded-xl border border-white/[0.06] p-5 animate-pulse">
              <div className="h-4 bg-white/[0.06] rounded w-28 mb-3" />
              <div className="h-3 bg-white/[0.06] rounded w-40" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#09090b] p-6 text-[#fafafa]">
      <div className="max-w-5xl mx-auto">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight text-white">Ad Accounts</h1>
        <button onClick={loadAccounts} className="rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 text-sm">Sincronizar</button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <h2 className="mb-2 font-semibold text-white">Contas</h2>
          {accounts.map((a) => (
            <div
              key={a.id}
              onClick={() => selectAccount(a.id)}
              className={`cursor-pointer rounded-xl border border-white/[0.06] p-3 mb-2 hover:bg-white/[0.04] transition-colors ${
                selectedAccount === a.id
                  ? 'border-indigo-500/50 bg-white/[0.08]'
                  : 'bg-[#111113]'
              }`}
            >
              <p className="font-medium text-white">{a.name}</p>
              <p className="text-sm text-zinc-500">ID: {a.metaId} | Status: {a.status}</p>
            </div>
          ))}
          {accounts.length === 0 && <p className="text-zinc-500">Nenhuma conta encontrada</p>}
        </div>

        <div>
          <h2 className="mb-2 font-semibold text-white">Pixels</h2>
          {selectedAccount ? (
            pixels.length > 0 ? (
              pixels.map((p) => (
                <div key={p.id} className="rounded-xl border border-white/[0.06] bg-[#111113] p-3 mb-2">
                  <p className="font-medium text-white">{p.name}</p>
                  <p className="text-sm text-zinc-500">ID: {p.metaId}</p>
                </div>
              ))
            ) : (
              <p className="text-zinc-500">Nenhum pixel</p>
            )
          ) : (
            <p className="text-zinc-500">Selecione uma conta</p>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}
