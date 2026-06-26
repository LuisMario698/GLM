import { Skeleton } from '@/components/ui/feedback';

export default function AppLoading() {
  return <div className="grid gap-6" aria-label="Cargando contenido"><Skeleton className="h-8 w-28"/><Skeleton className="h-14 max-w-xl"/><div className="grid gap-4 md:grid-cols-2"><Skeleton className="h-64"/><Skeleton className="h-64"/></div></div>;
}
