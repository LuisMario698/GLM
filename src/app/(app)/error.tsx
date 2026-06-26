'use client';

import { AlertTriangle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AppError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <div className="grid min-h-[55dvh] place-items-center"><div className="max-w-md rounded-[2rem] border bg-card p-7 text-center shadow-sm"><span className="mx-auto grid size-14 place-items-center rounded-full bg-amber-100 text-amber-800"><AlertTriangle size={26}/></span><h1 className="font-display mt-5 text-3xl">No pudimos cargar esta sección</h1><p className="mt-3 text-sm leading-6 text-muted-foreground">Tus datos no se modificaron. Reintenta la consulta o vuelve desde la navegación.</p><Button onClick={reset} className="mt-6"><RotateCcw size={17}/>Reintentar</Button></div></div>;
}
