import { cn } from '@/lib/utils';

export function SegmentedControl({ name, label, defaultValue = 3 }: { name: string; label: string; defaultValue?: number }) {
  return <fieldset><legend className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{label}</legend><div className="mt-2 grid grid-cols-5 gap-1">{[1,2,3,4,5].map((value) => <label key={value} className="relative"><input className="peer sr-only" type="radio" name={name} value={value} defaultChecked={value === defaultValue}/><span className={cn('grid min-h-11 cursor-pointer place-items-center rounded-xl border bg-white text-sm font-semibold transition peer-checked:border-secondary peer-checked:bg-secondary peer-checked:text-white peer-focus-visible:outline peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-secondary')}>{value}</span></label>)}</div></fieldset>;
}
