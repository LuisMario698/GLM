import type { LucideIcon } from 'lucide-react';
import { Card, CardTitle } from '@/components/ui/card';
export function StatCard({ title, value, caption, icon: Icon }: { title: string; value: string; caption: string; icon: LucideIcon }) { return <Card><div className="flex items-start justify-between"><div><CardTitle>{title}</CardTitle><p className="mt-3 text-3xl font-semibold tracking-tight">{value}</p><p className="mt-2 text-sm text-muted-foreground">{caption}</p></div><span className="rounded-xl bg-primary/10 p-3 text-primary"><Icon size={20}/></span></div></Card>; }
