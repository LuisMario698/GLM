'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { signIn, signUp } from '@/lib/actions/auth';
import { initialFormState } from '@/lib/actions/state';
import { Input } from '@/components/ui/input';
import { FormMessage, SubmitButton } from '@/components/forms/form-parts';

export function AuthForm({ mode }: { mode: 'login' | 'register' }) {
  const [state, action] = useActionState(mode === 'login' ? signIn : signUp, initialFormState);
  return <form action={action} className="grid gap-4"><label className="grid gap-2 text-sm font-semibold">Correo<Input name="email" type="email" autoComplete="email" required/></label><label className="grid gap-2 text-sm font-semibold">Contraseña<Input name="password" type="password" minLength={8} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} required/></label>{mode === 'register' && <label className="grid gap-2 text-sm font-semibold">Confirmar contraseña<Input name="confirmation" type="password" minLength={8} autoComplete="new-password" required/></label>}<FormMessage state={state}/><SubmitButton>{mode === 'login' ? 'Entrar' : 'Crear cuenta'}</SubmitButton><p className="text-center text-sm text-muted-foreground">{mode === 'login' ? '¿Aún no tienes cuenta?' : '¿Ya tienes cuenta?'} <Link className="font-semibold text-secondary underline" href={mode === 'login' ? '/registro' : '/login'}>{mode === 'login' ? 'Regístrate' : 'Inicia sesión'}</Link></p></form>;
}
