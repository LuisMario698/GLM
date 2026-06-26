import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Stepper({ steps, current }: { steps: string[]; current: number }) {
  return <ol aria-label="Progreso de configuración" className="grid grid-cols-4 gap-2">{steps.map((step, index) => <li key={step} className="min-w-0"><div className={cn('h-1.5 rounded-full bg-border', index <= current && 'bg-primary')}/><div className="mt-2 flex items-center gap-1.5"><span className={cn('grid size-6 shrink-0 place-items-center rounded-full border text-[10px] font-bold', index < current && 'border-secondary bg-secondary text-white', index === current && 'border-primary bg-primary text-white')}>{index < current ? <Check size={12}/> : index + 1}</span><span className="hidden truncate text-xs font-semibold text-muted-foreground sm:block">{step}</span></div></li>)}</ol>;
}
