import { AuthForm } from '@/components/auth/auth-form';
import { Card } from '@/components/ui/card';

export default function LoginPage() { return <Card className="w-full max-w-md p-8"><p className="text-xs font-bold uppercase tracking-[.2em] text-primary">GLM</p><h1 className="font-display mt-3 text-4xl">Tu guía empieza aquí</h1><p className="mt-3 mb-7 text-sm leading-6 text-muted-foreground">Registra lo que haces y recibe orientación basada en tu situación real.</p><AuthForm mode="login"/></Card>; }
