'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Megaphone,
  MessageSquare,
  Users,
  Package,
  ShoppingBag,
  CreditCard,
  Zap,
  Brain,
  Settings,
  FlaskConical,
} from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/campaigns', label: 'Campaigns', icon: Megaphone },
  { href: '/inbox', label: 'Inbox', icon: MessageSquare },
  { href: '/leads', label: 'Leads', icon: Users },
  { href: '/orders', label: 'Orders', icon: Package },
  { href: '/products', label: 'Products', icon: ShoppingBag },
  { href: '/ad-accounts', label: 'Ad Accounts', icon: CreditCard },
  { href: '/events', label: 'Events', icon: Zap },
  { href: '/ai-insights', label: 'AI Insights', icon: Brain },
  { href: '/teste', label: 'Teste', icon: FlaskConical },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  if (pathname === '/') return null;

  return (
    <aside className="flex h-screen w-[220px] flex-col bg-[#0c0c0e] border-r border-white/[0.06]">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2.5 border-b border-white/[0.06] px-4">
        <div className="relative">
          <img src="/logo.png" alt="Braza" className="h-8 w-8 rounded-lg" />
          <div className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-500 border border-[#0c0c0e]" />
        </div>
        <div>
          <span className="text-[13px] font-bold tracking-tight text-white">Braza Chat</span>
          <p className="text-[10px] text-zinc-500">by Braza Marketing</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        <span className="block px-3 pb-2 pt-3 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
          Menu
        </span>
        {navItems.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={
                active
                  ? 'flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium bg-white/[0.08] text-white shadow-none'
                  : 'flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-300'
              }
            >
              <Icon className="h-[18px] w-[18px]" />
              {item.label}
              {active && (
                <div className="ml-auto h-1.5 w-1.5 rounded-full bg-emerald-500" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-white/[0.06] p-3">
        <p className="px-3 text-[10px] text-zinc-700">v0.1.0</p>
      </div>
    </aside>
  );
}
