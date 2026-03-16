'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

interface UserProfile {
  id: string;
  email: string | null;
  name: string | null;
  timezone: string;
}

type TabId = 'profile' | 'integrations' | 'tracking' | 'shipping';

const TABS: { id: TabId; label: string }[] = [
  { id: 'profile', label: 'Profile' },
  { id: 'integrations', label: 'Integrations' },
  { id: 'tracking', label: 'Tracking' },
  { id: 'shipping', label: 'Shipping' },
];

const TIMEZONES = [
  'America/Sao_Paulo',
  'America/Manaus',
  'America/Belem',
  'America/Fortaleza',
  'America/Recife',
  'America/Cuiaba',
  'America/Porto_Velho',
  'America/Boa_Vista',
  'America/Rio_Branco',
  'America/Noronha',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Lisbon',
  'Europe/Madrid',
  'UTC',
];

const BR_STATES = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA',
  'MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN',
  'RS','RO','RR','SC','SP','SE','TO',
];

const FACEBOOK_PERMISSIONS = [
  'ads_management',
  'ads_read',
  'business_management',
  'whatsapp_business_management',
];

// ---------- Sub-components ----------

function InputField({
  label,
  id,
  value,
  onChange,
  readOnly = false,
  type = 'text',
  placeholder,
}: {
  label: string;
  id: string;
  value: string;
  onChange?: (v: string) => void;
  readOnly?: boolean;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">
        {label}
      </label>
      <input
        id={id}
        type={type}
        readOnly={readOnly}
        value={value}
        onChange={e => onChange?.(e.target.value)}
        placeholder={placeholder}
        className={
          'w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-zinc-600 outline-none transition-colors ' +
          (readOnly
            ? 'cursor-default text-zinc-400 select-all'
            : 'focus:border-white/[0.16] focus:bg-white/[0.06]')
        }
      />
    </div>
  );
}

function SelectField({
  label,
  id,
  value,
  onChange,
  options,
}: {
  label: string;
  id: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-white outline-none transition-colors focus:border-white/[0.16] focus:bg-white/[0.06] appearance-none"
      >
        {options.map(opt => (
          <option key={opt} value={opt} className="bg-[#111113] text-white">
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
}

function SaveButton() {
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <button
      type="button"
      onClick={handleSave}
      className="mt-2 rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 active:scale-95"
    >
      {saved ? 'Salvo!' : 'Salvar'}
    </button>
  );
}

// ---------- Tab content components ----------

function ProfileTab({ profile }: { profile: UserProfile | null }) {
  const [name, setName] = useState(profile?.name ?? '');
  const [timezone, setTimezone] = useState(profile?.timezone ?? 'America/Sao_Paulo');

  useEffect(() => {
    if (profile) {
      setName(profile.name ?? '');
      setTimezone(profile.timezone);
    }
  }, [profile]);

  return (
    <div className="space-y-5">
      <InputField
        label="Nome"
        id="profile-name"
        value={name}
        onChange={setName}
        placeholder="Seu nome completo"
      />
      <InputField
        label="Email"
        id="profile-email"
        value={profile?.email ?? ''}
        readOnly
      />
      <SelectField
        label="Fuso Horário"
        id="profile-timezone"
        value={timezone}
        onChange={setTimezone}
        options={TIMEZONES}
      />
      <div className="flex flex-col gap-1.5">
        <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">ID da Conta</span>
        <span className="font-mono text-sm text-zinc-400 select-all">{profile?.id ?? '—'}</span>
      </div>
      <SaveButton />
    </div>
  );
}

function IntegrationsTab() {
  const [connected, setConnected] = useState(false);

  const handleDisconnect = () => {
    if (confirm('Tem certeza? Dados históricos serão mantidos.')) {
      setConnected(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Status card */}
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Facebook icon placeholder */}
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1877f2]/20 text-[#1877f2] text-xs font-bold select-none">f</div>
            <div>
              <p className="text-sm font-semibold text-white">Facebook</p>
              <p className="text-[11px] text-zinc-500">Meta Business Suite</p>
            </div>
          </div>
          {connected ? (
            <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 inline-block" />
              Conectado
            </span>
          ) : (
            <span className="flex items-center gap-1.5 rounded-full bg-red-500/10 px-2.5 py-1 text-[11px] font-semibold text-red-400">
              <span className="h-1.5 w-1.5 rounded-full bg-red-400 inline-block" />
              Desconectado
            </span>
          )}
        </div>

        {connected && (
          <div>
            <p className="mb-2 text-[11px] font-medium text-zinc-500 uppercase tracking-wider">Permissões Ativas</p>
            <div className="flex flex-wrap gap-1.5">
              {FACEBOOK_PERMISSIONS.map(perm => (
                <span
                  key={perm}
                  className="rounded-md bg-white/[0.06] px-2 py-0.5 font-mono text-[10px] text-zinc-300"
                >
                  {perm}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {connected ? (
        <button
          type="button"
          onClick={handleDisconnect}
          className="w-full rounded-lg border border-red-500/20 bg-red-500/10 py-2.5 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/20"
        >
          Desconectar Facebook
        </button>
      ) : (
        <button
          type="button"
          className="w-full rounded-lg bg-[#1877F2] py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#166FE5]"
        >
          Conectar Facebook
        </button>
      )}

      {/* WhatsApp Cloud API */}
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400 text-xs font-bold select-none">W</div>
          <div>
            <p className="text-sm font-semibold text-white">WhatsApp Cloud API</p>
            <p className="text-[11px] text-zinc-500">Receber e enviar mensagens</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">WhatsApp Token</label>
            <input type="password" placeholder="Token permanente da API" className="w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-white/[0.16]" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">Phone Number ID</label>
            <input type="text" placeholder="ID do número de telefone" className="w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-white/[0.16]" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">Webhook URL</label>
            <div className="flex items-center gap-2">
              <input type="text" readOnly value="https://api.brazachat.shop/webhook/whatsapp" className="flex-1 rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-white outline-none" />
              <button type="button" onClick={() => navigator.clipboard.writeText('https://api.brazachat.shop/webhook/whatsapp')} className="rounded-lg bg-white/[0.08] px-3 py-2 text-[11px] font-semibold text-zinc-400 hover:bg-white/[0.12] hover:text-white">Copiar</button>
            </div>
            <p className="text-[10px] text-zinc-500">Cole essa URL no campo Webhook do Meta Developers</p>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">Verify Token</label>
            <div className="flex items-center gap-2">
              <input type="text" readOnly value="brazachat-webhook-2026" className="flex-1 rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-white outline-none" />
              <button type="button" onClick={() => navigator.clipboard.writeText('brazachat-webhook-2026')} className="rounded-lg bg-white/[0.08] px-3 py-2 text-[11px] font-semibold text-zinc-400 hover:bg-white/[0.12] hover:text-white">Copiar</button>
            </div>
            <p className="text-[10px] text-zinc-500">Cole esse token no campo Verify Token do Meta Developers</p>
          </div>
        </div>
      </div>

      <SaveButton />
    </div>
  );
}

function TrackingTab() {
  const [privacyUrl, setPrivacyUrl] = useState('https://link.brazachat.shop/privacy');

  return (
    <div className="space-y-5">
      {/* Domain — pending */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">Domínio de Tracking</label>
        <input
          type="text"
          readOnly
          value="https://link.brazachat.shop"
          className="w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-white outline-none"
        />
      </div>

      {/* UTM Template for Facebook */}
      <div className="flex flex-col gap-2">
        <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">
          UTMs padrão — Cole em &quot;URL Parameters&quot; no Facebook Ads
        </span>
        <div className="relative rounded-lg border border-white/[0.06] bg-[#09090b] px-3 py-3">
          <code className="block break-all font-mono text-[11px] text-indigo-300 leading-relaxed select-all">
            utm_source={'{{site_source_name}}'}&utm_medium=paid_social&utm_campaign={'{{campaign.name}}'}&utm_content={'{{ad.name}}'}&utm_term={'{{adset.name}}'}
          </code>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText('utm_source={{site_source_name}}&utm_medium=paid_social&utm_campaign={{campaign.name}}&utm_content={{ad.name}}&utm_term={{adset.name}}');
            }}
            className="absolute right-2 top-2 rounded-md bg-white/[0.08] px-2.5 py-1 text-[10px] font-semibold text-zinc-400 hover:bg-white/[0.12] hover:text-white transition-colors"
          >
            Copiar
          </button>
        </div>
        <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-3 space-y-1.5">
          <p className="text-[11px] text-zinc-500 font-medium">Como usar:</p>
          <p className="text-[11px] text-zinc-400">1. Abra o Facebook Ads Manager</p>
          <p className="text-[11px] text-zinc-400">2. Crie ou edite um anúncio → seção Tracking</p>
          <p className="text-[11px] text-zinc-400">3. Cole no campo &quot;URL Parameters&quot;</p>
          <p className="text-[11px] text-zinc-500 mt-2">O Facebook substitui automaticamente pelos nomes reais da sua campanha, grupo de anúncio e criativo.</p>
        </div>
      </div>

      {/* Privacy URL */}
      <InputField
        label="URL da Política de Privacidade"
        id="privacy-url"
        value={privacyUrl}
        onChange={setPrivacyUrl}
        placeholder="https://meusite.com/privacidade"
        type="url"
      />

      <SaveButton />
    </div>
  );
}

function ShippingTab() {
  const [form, setForm] = useState({
    senderName: '',
    address: '',
    city: '',
    state: 'SP',
    zipCode: '',
    phone: '',
  });

  const set = (key: keyof typeof form) => (val: string) =>
    setForm(prev => ({ ...prev, [key]: val }));

  return (
    <div className="space-y-5">
      <InputField
        label="Nome / Empresa Remetente"
        id="ship-name"
        value={form.senderName}
        onChange={set('senderName')}
        placeholder="Ex: Loja Braza Ltda"
      />
      <InputField
        label="Endereço"
        id="ship-address"
        value={form.address}
        onChange={set('address')}
        placeholder="Rua, número, complemento"
      />
      <div className="grid grid-cols-2 gap-4">
        <InputField
          label="Cidade"
          id="ship-city"
          value={form.city}
          onChange={set('city')}
          placeholder="São Paulo"
        />
        <SelectField
          label="Estado"
          id="ship-state"
          value={form.state}
          onChange={set('state')}
          options={BR_STATES}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <InputField
          label="CEP"
          id="ship-zip"
          value={form.zipCode}
          onChange={set('zipCode')}
          placeholder="00000-000"
        />
        <InputField
          label="Telefone"
          id="ship-phone"
          value={form.phone}
          onChange={set('phone')}
          placeholder="+55 11 99999-9999"
        />
      </div>
      <SaveButton />
    </div>
  );
}

// ---------- Main page ----------

export default function SettingsPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>('profile');

  useEffect(() => {
    apiFetch<UserProfile>('/auth/me')
      .then(setProfile)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
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
  }

  return (
    <div className="min-h-screen bg-[#09090b] p-6 text-[#fafafa]">
      <h1 className="mb-6 text-xl font-bold tracking-tight text-white">Configurações</h1>

      {/* Tab bar — Braza DS date preset pattern */}
      <div className="mb-6 inline-flex gap-0.5 rounded-lg border border-white/[0.06] bg-white/[0.04] p-1">
        {TABS.map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={
              'px-3 py-1.5 text-[11px] font-semibold rounded-md transition-colors ' +
              (activeTab === tab.id
                ? 'bg-white/[0.1] text-white'
                : 'text-zinc-500 hover:text-zinc-300')
            }
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content card */}
      <div className="max-w-lg rounded-xl border border-white/[0.06] bg-[#111113] p-6">
        {activeTab === 'profile' && <ProfileTab profile={profile} />}
        {activeTab === 'integrations' && <IntegrationsTab />}
        {activeTab === 'tracking' && <TrackingTab />}
        {activeTab === 'shipping' && <ShippingTab />}
      </div>
    </div>
  );
}
