import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { Sidebar } from '@/components/sidebar';

const inter = Inter({
  variable: '--font-sans',
  subsets: ['latin'],
});

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'BrazaChat',
  description: 'WhatsApp-centric CRM for Meta Ads',
};

export const viewport: Viewport = {
  themeColor: '#09090b',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className="dark">
      <body className={`flex min-h-screen antialiased bg-[#09090b] text-[#fafafa] ${inter.variable} ${jetbrainsMono.variable} font-sans`}>
        <Sidebar />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </body>
    </html>
  );
}
