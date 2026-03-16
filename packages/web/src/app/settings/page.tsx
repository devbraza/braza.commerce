'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

interface UserProfile {
  id: string;
  email: string | null;
  name: string | null;
  timezone: string;
}

type TabId = 'profile' | 'integrations' | 'whatsapp' | 'tracking' | 'shipping';

const TABS: { id: TabId; label: string }[] = [
  { id: 'profile', label: 'Profile' },
  { id: 'integrations', label: 'Integrations' },
  { id: 'whatsapp', label: 'WhatsApp' },
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

function IntegrationsTab({ profile }: { profile: UserProfile | null }) {
  const [connected, setConnected] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  // Check if Facebook is connected (user has active accessToken)
  useEffect(() => {
    apiFetch<{ id: string; facebookConnected?: boolean }>('/auth/me')
      .then(user => {
        setConnected(!!user.facebookConnected);
      })
      .catch(() => setConnected(false));
  }, []);

  const handleConnect = () => {
    window.location.href = `${API_URL}/auth/facebook`;
  };

  const handleDisconnect = async () => {
    if (!confirm('Tem certeza? Dados históricos serão mantidos.')) return;
    setDisconnecting(true);
    try {
      await apiFetch('/users/facebook/disconnect', { method: 'POST' });
      setConnected(false);
    } catch {
      // ignore
    } finally {
      setDisconnecting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Status card */}
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
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
          <>
            {profile?.name && (
              <div>
                <p className="text-[11px] text-zinc-500">Conectado como</p>
                <p className="text-sm text-white font-medium">{profile.name} {profile.email ? `(${profile.email})` : ''}</p>
              </div>
            )}
            <div>
              <p className="mb-2 text-[11px] font-medium text-zinc-500 uppercase tracking-wider">Permissoes Ativas</p>
              <div className="flex flex-wrap gap-1.5">
                {FACEBOOK_PERMISSIONS.map(perm => (
                  <span key={perm} className="rounded-md bg-white/[0.06] px-2 py-0.5 font-mono text-[10px] text-zinc-300">{perm}</span>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {connected ? (
        <button
          type="button"
          onClick={handleDisconnect}
          disabled={disconnecting}
          className="w-full rounded-lg border border-red-500/20 bg-red-500/10 py-2.5 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/20 disabled:opacity-50"
        >
          {disconnecting ? 'Desconectando...' : 'Desconectar Facebook'}
        </button>
      ) : (
        <button
          type="button"
          onClick={handleConnect}
          className="w-full rounded-lg bg-[#1877F2] py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#166FE5]"
        >
          Conectar Facebook
        </button>
      )}
    </div>
  );
}

function WhatsAppTab() {
  const [instanceId, setInstanceId] = useState('');
  const [token, setToken] = useState('');
  const [clientToken, setClientToken] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [credentialsSaved, setCredentialsSaved] = useState(false);
  const [webhookStatus, setWebhookStatus] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'waiting' | null>(null);
  const [showQr, setShowQr] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Check if credentials are already saved
  useEffect(() => {
    apiFetch<{ connected: boolean; error: string }>('/users/whatsapp/status')
      .then(status => {
        setCredentialsSaved(true);
        setConnectionStatus(status.connected ? 'connected' : 'disconnected');
        if (!status.connected) setShowQr(true);
      })
      .catch(() => {
        setCredentialsSaved(false);
      });
  }, []);

  const handleSave = async () => {
    const newErrors: Record<string, string> = {};
    if (!instanceId) newErrors.instanceId = 'Campo obrigatório';
    if (!token) newErrors.token = 'Campo obrigatório';
    if (!clientToken) newErrors.clientToken = 'Campo obrigatório';
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;
    setSaving(true);
    setWebhookStatus(null);
    try {
      const result = await apiFetch<{ saved: boolean; webhooksRegistered: boolean }>('/users/whatsapp', {
        method: 'PUT',
        body: JSON.stringify({ instanceId, token, clientToken }),
      });
      setSaved(true);
      setCredentialsSaved(true);
      setWebhookStatus(result.webhooksRegistered ? 'Webhooks registrados com sucesso' : 'Credenciais salvas, mas falha ao registrar webhooks');
      setTimeout(() => setSaved(false), 3000);

      // Check status after saving
      const status = await apiFetch<{ connected: boolean }>('/users/whatsapp/status').catch(() => null);
      if (status?.connected) {
        setConnectionStatus('connected');
      } else {
        setConnectionStatus('waiting');
        setShowQr(true);
      }
    } catch {
      setWebhookStatus('Erro ao salvar. Verifique as credenciais.');
    } finally {
      setSaving(false);
    }
  };

  const handleRestore = async () => {
    setRestoring(true);
    try {
      const result = await apiFetch<{ restored: boolean }>('/users/whatsapp/restore', { method: 'POST' });
      if (result.restored) {
        // Wait a moment then check status
        setTimeout(async () => {
          const status = await apiFetch<{ connected: boolean }>('/users/whatsapp/status').catch(() => null);
          if (status?.connected) {
            setConnectionStatus('connected');
            setShowQr(false);
          } else {
            setShowQr(true);
          }
          setRestoring(false);
        }, 3000);
      } else {
        setShowQr(true);
        setRestoring(false);
      }
    } catch {
      setShowQr(true);
      setRestoring(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Desconectar o WhatsApp? Suas credenciais serão mantidas.')) return;
    await apiFetch('/users/whatsapp/disconnect', { method: 'POST' }).catch(() => null);
    setConnectionStatus('disconnected');
    setShowQr(false);
  };

  return (
    <div className="space-y-5">
      {/* Section 1: Credentials */}
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400 text-xs font-bold select-none">W</div>
          <div>
            <p className="text-sm font-semibold text-white">WhatsApp via Z-API</p>
            <p className="text-[11px] text-zinc-500">Conecte seu WhatsApp para receber e enviar mensagens</p>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <InputField label="Instance ID" id="zapi-instance" value={instanceId} onChange={(v) => { setInstanceId(v); setErrors(e => ({ ...e, instanceId: '' })); }} placeholder="ID da instancia Z-API" />
            {errors.instanceId && <p className="mt-1 text-[10px] text-red-400">{errors.instanceId}</p>}
          </div>
          <div>
            <InputField label="Token" id="zapi-token" value={token} onChange={(v) => { setToken(v); setErrors(e => ({ ...e, token: '' })); }} type="password" placeholder="Token da instancia" />
            {errors.token && <p className="mt-1 text-[10px] text-red-400">{errors.token}</p>}
          </div>
          <div>
            <InputField label="Client-Token" id="zapi-client-token" value={clientToken} onChange={(v) => { setClientToken(v); setErrors(e => ({ ...e, clientToken: '' })); }} type="password" placeholder="Token de seguranca da conta" />
            {errors.clientToken && <p className="mt-1 text-[10px] text-red-400">{errors.clientToken}</p>}
          </div>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !instanceId || !token || !clientToken}
          className="mt-2 rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Salvando...' : saved ? 'Salvo!' : 'Salvar'}
        </button>

        {webhookStatus && (
          <p className={`text-[11px] ${webhookStatus.includes('sucesso') ? 'text-emerald-400' : 'text-amber-400'}`}>
            {webhookStatus}
          </p>
        )}

        <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-3 space-y-1.5">
          <p className="text-[11px] text-zinc-500 font-medium">Como configurar:</p>
          <p className="text-[11px] text-zinc-400">1. Acesse <a href="https://z-api.io" target="_blank" rel="noopener noreferrer" className="text-indigo-400 underline">z-api.io</a> e crie uma instancia</p>
          <p className="text-[11px] text-zinc-400">2. Copie o Instance ID e Token da instancia</p>
          <p className="text-[11px] text-zinc-400">3. Va em Security e copie o Client-Token</p>
          <p className="text-[11px] text-zinc-400">4. Cole os dados acima e clique Salvar</p>
          <p className="text-[11px] text-zinc-400">5. Escaneie o QR Code abaixo com seu celular</p>
        </div>
      </div>

      {/* Section 2: Connection (visible after save) */}
      {credentialsSaved && (
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">Conexao WhatsApp</p>
            {connectionStatus === 'connected' && (
              <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 inline-block" />
                Conectado
              </span>
            )}
            {connectionStatus === 'disconnected' && (
              <span className="flex items-center gap-1.5 rounded-full bg-red-500/10 px-2.5 py-1 text-[11px] font-semibold text-red-400">
                <span className="h-1.5 w-1.5 rounded-full bg-red-400 inline-block" />
                Desconectado
              </span>
            )}
            {connectionStatus === 'waiting' && (
              <span className="flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-1 text-[11px] font-semibold text-amber-400">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse inline-block" />
                Aguardando QR
              </span>
            )}
          </div>

          {/* QR Code */}
          {showQr && connectionStatus !== 'connected' && (
            <WhatsAppQrCodeInline
              onConnected={() => {
                setConnectionStatus('connected');
                setShowQr(false);
              }}
            />
          )}

          {/* Device info */}
          {connectionStatus === 'connected' && <WhatsAppDeviceInline />}

          {/* Action buttons */}
          <div className="flex gap-2">
            {connectionStatus === 'disconnected' && (
              <button
                type="button"
                onClick={handleRestore}
                disabled={restoring}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {restoring ? 'Reconectando...' : 'Reconectar'}
              </button>
            )}
            {connectionStatus === 'connected' && (
              <button
                type="button"
                onClick={handleDisconnect}
                className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-500/20"
              >
                Desconectar WhatsApp
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Inline QR Code component (avoids separate file import issues with 'use client')
function WhatsAppQrCodeInline({ onConnected }: { onConnected: () => void }) {
  const [qrBase64, setQrBase64] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [failures, setFailures] = useState(0);

  const fetchQr = async () => {
    try {
      setLoading(true);
      const data = await apiFetch<{ base64?: string; connected?: boolean }>('/users/whatsapp/qrcode');
      if (data.connected) { onConnected(); return; }
      if (data.base64) { setQrBase64(data.base64); setFailures(0); }
    } catch {
      setFailures(prev => prev + 1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchQr(); }, []);// eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (failures >= 3) return;
    const interval = setInterval(async () => {
      const status = await apiFetch<{ connected: boolean }>('/users/whatsapp/status').catch(() => null);
      if (status?.connected) { onConnected(); return; }
      fetchQr();
    }, 20000);
    return () => clearInterval(interval);
  }, [failures]);// eslint-disable-line react-hooks/exhaustive-deps

  if (loading && !qrBase64) {
    return <div className="flex justify-center py-6"><div className="h-48 w-48 rounded-xl bg-white/[0.06] animate-pulse" /></div>;
  }

  if (failures >= 3) {
    return (
      <div className="flex flex-col items-center gap-3 py-4">
        <p className="text-xs text-zinc-500">QR Code expirado</p>
        <button type="button" onClick={() => { setFailures(0); fetchQr(); }} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
          Gerar novo QR Code
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 py-2">
      {qrBase64 && (
        <div className="rounded-xl border border-white/[0.08] bg-white p-3">
          <img src={qrBase64.startsWith('data:') ? qrBase64 : `data:image/png;base64,${qrBase64}`} alt="QR Code WhatsApp" className="h-48 w-48" />
        </div>
      )}
      <p className="text-[11px] text-zinc-500">Abra o WhatsApp → Aparelhos conectados → Conectar → Escaneie</p>
    </div>
  );
}

// Inline Device card
function WhatsAppDeviceInline() {
  const [device, setDevice] = useState<{ phone: string; name: string; photo: string; deviceModel: string; isBusiness: boolean } | null>(null);

  useEffect(() => {
    apiFetch<typeof device>('/users/whatsapp/device').then(setDevice).catch(() => null);
  }, []);

  if (!device) return null;

  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
      <div className="flex items-center gap-3">
        {device.photo ? (
          <img src={device.photo} alt={device.name} className="h-10 w-10 rounded-full object-cover" />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 text-sm font-bold">
            {device.name?.charAt(0)?.toUpperCase() || 'W'}
          </div>
        )}
        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-white">{device.name || 'WhatsApp'}</p>
            {device.isBusiness && (
              <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[9px] font-semibold text-emerald-400 uppercase">Business</span>
            )}
          </div>
          <p className="text-[11px] text-zinc-500 font-mono">+{device.phone}</p>
          {device.deviceModel && <p className="text-[10px] text-zinc-600">{device.deviceModel}</p>}
        </div>
      </div>
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
        {activeTab === 'integrations' && <IntegrationsTab profile={profile} />}
        {activeTab === 'whatsapp' && <WhatsAppTab />}
        {activeTab === 'tracking' && <TrackingTab />}
        {activeTab === 'shipping' && <ShippingTab />}
      </div>
    </div>
  );
}
