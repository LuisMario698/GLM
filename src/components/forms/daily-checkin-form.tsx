'use client';

import { useActionState } from 'react';
import { saveDailyCheckin } from '@/lib/actions/app';
import { initialFormState } from '@/lib/actions/state';
import { localISODate } from '@/lib/date';
import { Textarea } from '@/components/ui/input';
import { FormMessage, SubmitButton } from './form-parts';
import { SegmentedControl } from '@/components/ui/segmented-control';

export function DailyCheckinForm({ initial }: { initial?: Record<string, unknown> | null }) {
  const [state, action] = useActionState(saveDailyCheckin, initialFormState);
  return <form action={action} className="grid gap-5"><input type="hidden" name="recorded_on" value={localISODate()}/><div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{[
    ['energy','Energía'],['sleep_quality','Calidad de sueño'],['stress','Estrés'],['soreness','Molestia muscular'],['readiness','Disposición'],
  ].map(([name,label]) => <SegmentedControl key={name} name={name} label={label} defaultValue={Number(initial?.[name]??3)}/>)}</div><fieldset><legend className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Señales de alerta</legend><div className="mt-2 grid gap-2 sm:grid-cols-3">{[['pain','Dolor actual'],['dizziness','Mareo'],['chest_pain','Dolor en el pecho']].map(([name,label]) => <label key={name} className="flex min-h-11 items-center gap-2 rounded-xl border bg-white px-3 text-sm"><input className="size-4 accent-secondary" type="checkbox" name={name} defaultChecked={Boolean(initial?.[name])}/>{label}</label>)}</div></fieldset><label className="grid gap-2 text-sm font-semibold">Nota opcional<Textarea name="notes" defaultValue={String(initial?.notes ?? '')} placeholder="Describe sólo lo necesario para recordar cómo te sentías."/></label><FormMessage state={state}/><div><SubmitButton>Guardar y evaluar hoy</SubmitButton></div></form>;
}
