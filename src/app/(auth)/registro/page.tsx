import { AuthForm } from '@/components/auth/auth-form';
import { Card } from '@/components/ui/card';

export default function RegisterPage() { return <Card className="w-full max-w-md p-8"><p className="text-xs font-bold uppercase tracking-[.2em] text-primary">Cuenta personal</p><h1 className="font-display mt-3 text-4xl">Crea tu espacio</h1><p className="mt-3 mb-7 text-sm leading-6 text-muted-foreground">GLM es para personas adultas sanas y no sustituye atención médica o nutricional.</p><AuthForm mode="register"/></Card>; }
