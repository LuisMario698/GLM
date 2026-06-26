import Link from 'next/link';
import { cn } from '@/lib/utils';

export type TabItem = { value: string; label: string; href: string; count?: number };

export function UrlTabs({ items, active, label = 'Secciones' }: { items: TabItem[]; active: string; label?: string }) {
  return <nav aria-label={label} className="scrollbar-none -mx-1 flex gap-1 overflow-x-auto rounded-2xl border bg-card/80 p-1 shadow-sm">
    {items.map((item) => <Link key={item.value} href={item.href} aria-current={active === item.value ? 'page' : undefined} className={cn('flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground', active === item.value && 'bg-[#17201b] text-white shadow-sm hover:bg-[#17201b] hover:text-white')}>{item.label}{item.count !== undefined && <span className={cn('rounded-full bg-muted px-2 py-0.5 text-[10px]', active === item.value && 'bg-white/15')}>{item.count}</span>}</Link>)}
  </nav>;
}
