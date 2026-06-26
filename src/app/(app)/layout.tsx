import { AppShell } from '@/components/layout/app-shell';
import { requireProfile } from '@/lib/auth';

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireProfile();
  return <AppShell name={profile.name}>{children}</AppShell>;
}
