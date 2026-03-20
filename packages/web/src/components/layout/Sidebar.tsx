'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutGrid, Crosshair, BarChart3, Activity, Settings } from 'lucide-react';

const NAV_SECTIONS = [
  {
    label: 'PRINCIPAL',
    items: [
      { name: 'Paginas', href: '/pages', icon: LayoutGrid },
      { name: 'Campanhas', href: '/campaigns', icon: Crosshair },
    ],
  },
  {
    label: 'ANALYTICS',
    items: [
      { name: 'Metricas', href: '/metrics', icon: BarChart3 },
      { name: 'Eventos', href: '/events', icon: Activity },
    ],
  },
  {
    label: 'SISTEMA',
    items: [
      { name: 'Configuracoes', href: '/settings', icon: Settings },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/pages') return pathname === '/pages' || pathname.startsWith('/pages/');
    return pathname === href || pathname.startsWith(href + '/');
  };

  return (
    <aside className="hidden md:flex flex-col w-[220px] bg-[#0c0c0e] border-r border-white/[0.06] h-screen sticky top-0">
      {/* Logo */}
      <div className="h-16 flex items-center gap-3 px-5 border-b border-white/[0.06]">
        <div className="relative">
          <div className="w-8 h-8 bg-white/[0.08] rounded-lg flex items-center justify-center text-[13px] font-bold text-white">
            B
          </div>
          <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-[#0c0c0e]" />
        </div>
        <div>
          <p className="text-[13px] font-bold text-white tracking-tight">braza.commerce</p>
          <p className="text-[10px] text-zinc-500 font-medium">Product Pages</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-6 overflow-y-auto">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label}>
            <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-wider px-3 mb-2">
              {section.label}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const active = isActive(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-colors ${
                      active
                        ? 'bg-white/[0.08] text-white'
                        : 'text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-300'
                    }`}
                  >
                    <Icon size={16} strokeWidth={2} />
                    <span>{item.name}</span>
                    {active && (
                      <div className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-white/[0.06]">
        <p className="text-[10px] text-zinc-600 font-medium">braza.commerce v1.1</p>
      </div>
    </aside>
  );
}
