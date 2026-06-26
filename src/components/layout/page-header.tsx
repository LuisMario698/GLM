export function PageHeader({ eyebrow, title, description, children }: { eyebrow: string; title: string; description: string; children?: React.ReactNode }) {
  return <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-[.22em] text-primary">{eyebrow}</p><h1 className="font-display mt-2 text-[clamp(2.5rem,7vw,4rem)] leading-[.98] tracking-[-.025em]">{title}</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">{description}</p></div>{children}</header>;
}
