'use client';

import { useActionState } from 'react';
import { saveWeeklyCheckin } from '@/lib/actions/app';
import { initialFormState } from '@/lib/actions/state';
import { Select, Textarea } from '@/components/ui/input';
import { FormMessage, SubmitButton } from './form-parts';

export function WeeklyCheckinForm({ weekStart, initial }: { weekStart: string; initial?: Record<string, unknown> | null }) {
  const [state,action]=useActionState(saveWeeklyCheckin,initialFormState);
  return <form action={action} className="grid gap-4"><input type="hidden" name="week_start" value={weekStart}/><div className="grid gap-3 sm:grid-cols-3">{[['energy','Energía'],['recovery','Recuperación'],['soreness','Molestia muscular']].map(([name,label])=><label key={name} className="grid gap-2 text-sm font-semibold">{label}<Select name={name} defaultValue={String(initial?.[name]??3)}>{[1,2,3,4,5].map((value)=><option key={value} value={value}>{value} / 5</option>)}</Select></label>)}</div><label className="text-sm"><input className="mr-2" type="checkbox" name="pain" defaultChecked={Boolean(initial?.pain)}/>Tuve dolor esta semana</label><Textarea name="notes" defaultValue={String(initial?.notes??'')} placeholder="Nota opcional"/><FormMessage state={state}/><div><SubmitButton variant="ghost">Guardar revisión</SubmitButton></div></form>;
}
