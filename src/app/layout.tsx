import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = { title: { default: 'GLM', template: '%s | GLM' }, description: 'Guía personal de actividad física y alimentación general.', manifest: '/manifest.webmanifest' };
export const viewport: Viewport = { themeColor: '#17201b', colorScheme: 'light' };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es"><body>{children}</body></html>;
}
