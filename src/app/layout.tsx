import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import type { ReactNode } from 'react';
import { AppProviders } from '@/components/providers/app-providers';
import './globals.css';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });

export const metadata: Metadata = {
  applicationName: 'GLM',
  title: { default: 'GLM | Salud, hábitos y entrenamiento', template: '%s | GLM' },
  description: 'Progressive Web App para tomar mejores decisiones sobre entrenamiento, nutrición, descanso y actividad física.',
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'GLM' },
  icons: { icon: '/icons/icon-192.svg', apple: '/icons/icon-192.svg' },
};

export const viewport: Viewport = { themeColor: '#22C55E', width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return <html lang="es" suppressHydrationWarning><body className={`${geistSans.variable} ${geistMono.variable}`}><AppProviders>{children}</AppProviders></body></html>;
}
