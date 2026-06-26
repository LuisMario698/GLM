import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

const base = 'min-h-11 w-full rounded-xl border bg-white px-3 text-sm outline-none transition placeholder:text-muted-foreground/65 focus:border-secondary focus:ring-2 focus:ring-secondary/15';
export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) { return <input className={cn(base, className)} {...props} />; }
export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) { return <select className={cn(base, className)} {...props} />; }
export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) { return <textarea className={cn(base, 'min-h-24 py-3', className)} {...props} />; }
