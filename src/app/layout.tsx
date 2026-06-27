import type { Metadata, Viewport } from 'next';
import './globals.css';

const appName = 'GLM';
const appTitle = 'GLM - Guía personal';
const appDescription = 'Guía personal de actividad física y alimentación general.';

export const metadata: Metadata = {
  applicationName: appName,
  title: { default: appTitle, template: `%s | ${appName}` },
  description: appDescription,
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, title: appName, statusBarStyle: 'default' },
  formatDetection: { telephone: false },
  icons: {
    icon: [
      { url: '/icons/icon.svg', type: 'image/svg+xml' },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  openGraph: {
    type: 'website',
    siteName: appName,
    title: appTitle,
    description: appDescription,
  },
};
export const viewport: Viewport = { themeColor: '#17201b', colorScheme: 'light' };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es"><body>{children}</body></html>;
}
