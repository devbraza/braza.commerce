'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

interface Product {
  id: string;
  name: string;
  price: number;
  currency: string;
  whatsappPhone: string | null;
  messageTemplate: string | null;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: '',
    price: '',
    whatsappPhone: '',
    messageTemplate: 'Oi, quero saber mais sobre o {product}',
  });

  const loadProducts = () => {
    apiFetch<{ data: Product[]; total: number; page: number; limit: number }>('/products')
      .then((res) => setProducts(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadProducts(); }, []);

  const [formError, setFormError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    try {
      await apiFetch('/products', {
        method: 'POST',
        body: JSON.stringify({
          name: form.name,
          price: parseFloat(form.price),
          whatsappPhone: form.whatsappPhone,
          messageTemplate: form.messageTemplate,
        }),
      });
      setShowForm(false);
      setForm({ name: '', price: '', whatsappPhone: '', messageTemplate: 'Oi, quero saber mais sobre o {product}' });
      loadProducts();
    } catch (err) {
      setFormError((err as Error).message || 'Erro ao salvar produto');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja deletar este produto?')) return;
    try {
      await apiFetch(`/products/${id}`, { method: 'DELETE' });
      loadProducts();
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#09090b] p-6 text-[#fafafa]">
      <div className="max-w-5xl mx-auto">
        <div className="h-7 bg-white/[0.06] rounded w-40 mb-6 animate-pulse" />
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
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#09090b] p-6 text-[#fafafa]">
      <div className="max-w-5xl mx-auto">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight text-white">Produtos</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
        >
          {showForm ? 'Cancelar' : 'Novo Produto'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 rounded-xl border border-white/[0.06] bg-[#111113] p-4 space-y-3">
          <input className="w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-[13px] text-white placeholder-zinc-500 outline-none" placeholder="Nome do produto" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <input className="w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-[13px] text-white placeholder-zinc-500 outline-none" placeholder="Preço" type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
          <input className="w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-[13px] text-white placeholder-zinc-500 outline-none" placeholder="WhatsApp (+5511999999999)" value={form.whatsappPhone} onChange={(e) => setForm({ ...form, whatsappPhone: e.target.value })} required />
          <input className="w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-[13px] text-white placeholder-zinc-500 outline-none" placeholder="Template de mensagem" value={form.messageTemplate} onChange={(e) => setForm({ ...form, messageTemplate: e.target.value })} required />
          {formError && <p className="text-xs text-red-400">{formError}</p>}
          <button type="submit" className="rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700">Salvar</button>
        </form>
      )}

      <table className="w-full rounded-xl border border-white/[0.06] bg-[#111113]">
        <thead>
          <tr className="border-b border-white/[0.06] bg-white/[0.04] text-left text-sm text-zinc-500">
            <th className="p-3">Nome</th>
            <th className="p-3">Preço</th>
            <th className="p-3">Telefone</th>
            <th className="p-3">Ações</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id} className="border-b border-white/[0.06] hover:bg-white/[0.04]">
              <td className="p-3">{p.name}</td>
              <td className="p-3">R$ {p.price.toFixed(2)}</td>
              <td className="p-3">{p.whatsappPhone}</td>
              <td className="p-3">
                <button onClick={() => handleDelete(p.id)} className="text-red-500 hover:underline text-sm">Deletar</button>
              </td>
            </tr>
          ))}
          {products.length === 0 && (
            <tr><td colSpan={4} className="p-4 text-center text-zinc-500">Nenhum produto cadastrado</td></tr>
          )}
        </tbody>
      </table>
      </div>
    </div>
  );
}
