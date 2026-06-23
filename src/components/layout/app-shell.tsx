import Link from 'next/link';
import type { ReactNode } from 'react';
import { Activity } from 'lucide-react';
import { navigation } from '@/lib/constants';

export function AppShell({ children }: { children: ReactNode }) {
  return <div className="min-h-screen bg-[radial-gradient(circle_at_top,#ecfdf5,transparent_35%),#fff]"><aside className="fixed inset-y-0 left-0 hidden w-64 border-r bg-white/80 p-6 backdrop-blur lg:block"><Link href="/dashboard" className="flex items-center gap-2 text-xl font-semibold"><span className="rounded-xl bg-primary p-2 text-primary-foreground"><Activity size={20}/></span>GLM</Link><nav className="mt-10 grid gap-2">{navigation.map((item)=><Link key={item.href} href={item.href} className="rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground">{item.label}</Link>)}</nav></aside><main className="lg:pl-64"><div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">{children}</div></main></div>;
}
