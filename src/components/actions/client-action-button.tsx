'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import type { ActionResult } from '@/types/domain';

export function ClientActionButton({ label, pendingLabel = 'Procesando…', action, variant = 'primary' }: { label: string; pendingLabel?: string; action: () => Promise<ActionResult>; variant?: 'primary' | 'secondary' | 'ghost' | 'danger' }) {
  const [pending, start] = useTransition();
  const [message, setMessage] = useState('');
  return <div><Button variant={variant} disabled={pending} onClick={() => start(async () => { const result = await action(); setMessage(result.ok ? (result.message ?? 'Actualizado.') : result.error); })}>{pending ? pendingLabel : label}</Button>{message && <p role="status" className="mt-2 max-w-sm text-xs text-muted-foreground">{message}</p>}</div>;
}
