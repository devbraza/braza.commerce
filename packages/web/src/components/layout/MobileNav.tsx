'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutGrid, Crosshair, BarChart3, Activity, Settings, Menu, X } from 'lucide-react';

const NAV_ITEMS = [
  { name: 'Paginas', href: '/pages', icon: LayoutGrid },
  { name: 'Campanhas', href: '/campaigns', icon: Crosshair },
  { name: 'Metricas', href: '/metrics', icon: BarChart3 },
  { name: 'Eventos', href: '/events', icon: Activity },
  { name: 'Configuracoes', href: '/settings', icon: Settings },
];

export default function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('keydown', handleEsc);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  const isActive = (href: string) => {
    if (href === '/pages') return pathname === '/pages' || pathname.startsWith('/pages/');
    return pathname === href || pathname.startsWith(href + '/');
  };

  return (
    <div className="md:hidden" ref={menuRef}>
      {/* Top bar */}
      <div className="h-14 flex items-center justify-between px-4 border-b border-white/[0.06] bg-[#0c0c0e]">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="Braza" className="w-7 h-7 rounded-lg" />
          <span className="text-[13px] font-bold text-white">braza.commerce</span>
        </div>
        <button
          onClick={() => setOpen(!open)}
          aria-label={open ? 'Fechar menu' : 'Abrir menu'}
          aria-expanded={open}
          className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-white/[0.04] text-zinc-400"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Dropdown menu */}
      {open && (
        <div className="absolute top-14 left-0 right-0 z-50 bg-[#0c0c0e] border-b border-white/[0.06] py-2 px-3">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                aria-current={active ? 'page' : undefined}
                className={`flex items-center gap-3 px-3 py-3 rounded-lg text-[13px] font-medium transition-colors ${
                  active
                    ? 'bg-white/[0.08] text-white'
                    : 'text-zinc-500 hover:bg-white/[0.04]'
                }`}
              >
                <Icon size={16} strokeWidth={2} />
                <span>{item.name}</span>
                {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-500" />}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
