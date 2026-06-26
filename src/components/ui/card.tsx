import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('rounded-[1.6rem] border bg-card p-5 shadow-[0_18px_55px_rgba(23,32,27,.055)] sm:p-6', className)} {...props} />;
}
