'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { confirmNutritionTargets, estimateNutritionTargets, generateMealPlan, markMeal, swapMeal } from '@/lib/actions/app';
import { Button } from '@/components/ui/button';

export function TargetActions({ estimated, confirmed }: { estimated: boolean; confirmed: boolean }) {
  const router=useRouter(); const [pending,start]=useTransition(); const [message,setMessage]=useState('');
  const run=(action:()=>Promise<{ok:boolean;error?:string;message?:string}>)=>start(async()=>{const result=await action();setMessage(result.ok?(result.message??'Actualizado.'):result.error??'Error');router.refresh();});
  return <div className="flex flex-wrap items-start gap-3"><Button disabled={pending} onClick={()=>run(estimateNutritionTargets)} variant="ghost">Calcular estimación</Button>{estimated&&!confirmed&&<Button disabled={pending} onClick={()=>run(confirmNutritionTargets)} variant="secondary">Confirmar rango</Button>}{confirmed&&<Button disabled={pending} onClick={()=>run(()=>generateMealPlan())}>Generar menú semanal</Button>}{message&&<p className="w-full text-xs text-muted-foreground">{message}</p>}</div>;
}

export function MealActions({ itemId, status }: { itemId: string; status?: string }) {
  const router=useRouter(); const [pending,start]=useTransition(); const [message,setMessage]=useState('');
  const run=(action:()=>Promise<{ok:boolean;error?:string}>)=>start(async()=>{const result=await action();setMessage(result.ok?'Actualizado':result.error??'Error');router.refresh();});
  return <div className="mt-3 flex flex-wrap gap-2"><Button className="min-h-9 px-3 text-xs" variant={status==='completed'?'secondary':'ghost'} disabled={pending} onClick={()=>run(()=>markMeal(itemId,'completed'))}>La comí</Button><Button className="min-h-9 px-3 text-xs" variant="ghost" disabled={pending} onClick={()=>run(()=>swapMeal(itemId))}>Sustituir</Button>{message&&<span className="self-center text-xs text-muted-foreground">{message}</span>}</div>;
}
