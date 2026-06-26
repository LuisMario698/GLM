export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <main className="app-surface grid min-h-screen place-items-center px-4 py-10">{children}</main>;
}
