'use client';

import { usePathname } from 'next/navigation';

const PAGE_TITLES: Record<string, { title: string; description: string }> = {
  '/pages': { title: 'Paginas', description: 'Gerencie suas landing pages' },
  '/pages/new': { title: 'Nova pagina', description: 'Crie uma nova landing page com IA' },
  '/campaigns': { title: 'Campanhas', description: 'Gerencie suas campanhas de trafego' },
  '/campaigns/new': { title: 'Nova campanha', description: 'Crie uma nova campanha' },
  '/metrics': { title: 'Metricas', description: 'Visao geral do desempenho' },
  '/events': { title: 'Eventos', description: 'Log de conversoes e eventos' },
  '/settings': { title: 'Configuracoes', description: 'Yampi, Meta Pixel e preferencias' },
};

export default function Header() {
  const pathname = usePathname();

  const getPageInfo = () => {
    if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
    if (pathname.match(/^\/pages\/[^/]+\/edit$/)) return { title: 'Editar pagina', description: 'Edite os textos e configuracoes' };
    if (pathname.match(/^\/campaigns\/[^/]+$/)) return { title: 'Campanha', description: 'Metricas e detalhes da campanha' };
    return { title: 'braza.commerce', description: '' };
  };

  const { title, description } = getPageInfo();

  return (
    <header className="h-16 flex items-center justify-between px-6 border-b border-white/[0.06] bg-[#09090b]">
      <div>
        <h1 className="text-[15px] font-semibold text-white">{title}</h1>
        {description && <p className="text-[11px] text-zinc-600">{description}</p>}
      </div>
    </header>
  );
}
