'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogOut, MoreHorizontal, Settings, Sparkles } from 'lucide-react';
import { libraryNavigation, primaryNavigation } from '@/lib/constants';
import { signOut } from '@/lib/actions/auth';
import { cn } from '@/lib/utils';
import { Sheet } from '@/components/ui/sheet';

export function AppShell({ name, children }: { name: string; children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname.startsWith('/sesion/')) return <div className="app-surface min-h-dvh"><main>{children}</main></div>;
  return <div className="app-surface mobile-shell-padding min-h-screen lg:pb-0">
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-[#17201b] p-5 text-white lg:flex">
      <Link href="/hoy" className="flex items-center gap-3 px-2 text-xl font-semibold"><span className="grid size-10 place-items-center rounded-full bg-primary"><Sparkles size={18}/></span> GLM</Link>
      <p className="mt-3 px-2 text-xs leading-5 text-white/45">Guía personal de actividad y alimentación</p>
      <NavGroup label="Principal" items={primaryNavigation} pathname={pathname}/>
      <NavGroup label="Biblioteca" items={libraryNavigation} pathname={pathname}/>
      <div className="mt-auto border-t border-white/10 pt-4"><p className="truncate px-2 text-sm">{name}</p><Link href="/ajustes" className="mt-2 flex items-center gap-3 rounded-xl px-2 py-2 text-sm text-white/50 hover:bg-white/7 hover:text-white"><Settings size={17}/>Ajustes</Link><form action={signOut}><button className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-sm text-white/50 hover:bg-white/7 hover:text-white"><LogOut size={17}/>Cerrar sesión</button></form></div>
    </aside>
    <main className="lg:pl-64"><div className="page-enter app-content mx-auto max-w-[1440px] px-4 pb-6 sm:px-7 lg:px-10 lg:pb-10">{children}</div></main>
    <nav aria-label="Navegación principal" className="safe-bottom fixed inset-x-0 bottom-0 z-40 grid grid-cols-6 border-t bg-card/95 px-1 pt-1 shadow-[0_-12px_35px_rgba(23,32,27,.09)] backdrop-blur lg:hidden">{primaryNavigation.map((item) => { const active = pathname.startsWith(item.href); return <MobileLink key={item.href} item={item} active={active}/>; })}<Sheet title="Más opciones" trigger={<button aria-label="Más" className="flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-xl text-[9px] font-semibold text-muted-foreground"><MoreHorizontal size={21}/>Más</button>}><MoreMenu pathname={pathname}/></Sheet></nav>
  </div>;
}

function NavGroup({ label, items, pathname }: { label: string; items: readonly {href:string;label:string;icon:React.ComponentType<{size?:number}>}[]; pathname: string }) { return <div className="mt-7"><p className="px-3 text-[10px] font-bold uppercase tracking-[.2em] text-white/30">{label}</p><nav className="mt-2 grid gap-1">{items.map((item)=>{const active=pathname.startsWith(item.href);return <Link key={item.href} href={item.href} className={cn('flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm text-white/60 transition hover:bg-white/7 hover:text-white',active&&'bg-white/10 text-white')}><item.icon size={18}/>{item.label}</Link>})}</nav></div> }
function MobileLink({ item, active }: { item: {href:string;label:string;icon:React.ComponentType<{size?:number}>}; active:boolean }) { return <Link href={item.href} aria-label={item.label} aria-current={active?'page':undefined} className={cn('flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-xl text-[9px] font-semibold text-muted-foreground',active&&'bg-secondary text-white')}><item.icon size={19}/>{item.label}</Link> }
function MoreMenu({ pathname }: { pathname:string }) { return <div className="grid gap-2">{libraryNavigation.map((item)=>{const active=pathname.startsWith(item.href);return <Link key={item.href} href={item.href} className={cn('flex min-h-12 items-center gap-3 rounded-xl border bg-white px-4 text-sm font-semibold',active&&'border-secondary bg-emerald-50 text-secondary')}><item.icon size={19}/>{item.label}</Link>})}<Link href="/ajustes" className="flex min-h-12 items-center gap-3 rounded-xl border bg-white px-4 text-sm font-semibold"><Settings size={19}/>Ajustes</Link><form action={signOut}><button className="flex min-h-12 w-full items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 text-sm font-semibold text-red-700"><LogOut size={19}/>Cerrar sesión</button></form></div> }
