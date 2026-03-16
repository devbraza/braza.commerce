'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

interface DeviceInfo {
  phone: string;
  name: string;
  photo: string;
  deviceModel: string;
  isBusiness: boolean;
}

export function WhatsAppDeviceCard() {
  const [device, setDevice] = useState<DeviceInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<DeviceInfo>('/users/whatsapp/device')
      .then(setDevice)
      .catch(() => setDevice(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 animate-pulse">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-white/[0.06]" />
          <div className="space-y-1.5">
            <div className="h-3 w-24 bg-white/[0.06] rounded" />
            <div className="h-2.5 w-32 bg-white/[0.06] rounded" />
          </div>
        </div>
      </div>
    );
  }

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
              <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[9px] font-semibold text-emerald-400 uppercase">
                Business
              </span>
            )}
          </div>
          <p className="text-[11px] text-zinc-500 font-mono">
            +{device.phone}
          </p>
          {device.deviceModel && (
            <p className="text-[10px] text-zinc-600">{device.deviceModel}</p>
          )}
        </div>
      </div>
    </div>
  );
}
