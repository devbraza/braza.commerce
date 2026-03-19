import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  variable: '--font-sans',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'braza.commerce',
  description: 'AI-powered product page builder for e-commerce',
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
      <body className={`min-h-screen antialiased bg-[#09090b] text-[#fafafa] ${inter.variable} font-sans`}>
        {children}
      </body>
    </html>
  );
}
