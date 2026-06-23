'use client';

import { ThemeProvider } from 'next-themes';
import type { ReactNode } from 'react';

export function AppProviders({ children }: { children: ReactNode }) {
  return <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>{children}</ThemeProvider>;
}
