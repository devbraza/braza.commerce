'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

interface Insight {
  id: string;
  type: string;
  data: Record<string, unknown>;
  confidence: number | null;
  sampleSize: number | null;
  createdAt: string;
}

export default function AiInsightsPage() {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const loadInsights = () => {
    apiFetch<Insight[]>('/ai/insights')
      .then(setInsights)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadInsights(); }, []);

  const generate = async () => {
    setGenerating(true);
    await apiFetch('/ai/insights/generate', { method: 'POST' });
    loadInsights();
    setGenerating(false);
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
        <h1 className="text-xl font-bold tracking-tight text-white">AI Insights</h1>
        <button
          onClick={generate}
          disabled={generating}
          className="rounded-lg bg-purple-600 px-4 py-2 text-white hover:bg-purple-700 disabled:opacity-50"
        >
          {generating ? 'Gerando...' : 'Gerar Insights'}
        </button>
      </div>

      <div className="space-y-4">
        {insights.map((insight) => (
          <div key={insight.id} className="rounded-xl border border-white/[0.06] bg-[#111113] p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="rounded bg-purple-500/10 border border-purple-500/20 px-2 py-1 text-xs font-medium text-purple-400">
                {insight.type}
              </span>
              {insight.confidence !== null && (
                <span className="text-sm text-zinc-500">
                  Confiança: {(insight.confidence * 100).toFixed(0)}%
                </span>
              )}
            </div>
            <pre className="text-sm whitespace-pre-wrap text-zinc-400">
              {JSON.stringify(insight.data, null, 2)}
            </pre>
          </div>
        ))}
        {insights.length === 0 && (
          <p className="text-center text-zinc-500">
            Nenhum insight gerado. Clique em &quot;Gerar Insights&quot; para analisar suas campanhas.
          </p>
        )}
      </div>
      </div>
    </div>
  );
}
