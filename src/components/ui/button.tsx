import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export function Button({ className, variant = 'primary', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' | 'danger' }) {
  return <button className={cn('inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50',
    variant === 'primary' && 'bg-primary text-white shadow-[0_8px_24px_rgba(232,93,53,.22)] hover:bg-[#cf4d29]',
    variant === 'secondary' && 'bg-secondary text-white hover:bg-[#18543f]',
    variant === 'ghost' && 'border bg-card hover:bg-muted',
    variant === 'danger' && 'bg-red-700 text-white hover:bg-red-800', className)} {...props} />;
}
