'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';

export function Modal({ trigger, title, description, children }: { trigger: React.ReactNode; title: string; description?: string; children: React.ReactNode }) {
  return <Dialog.Root><Dialog.Trigger asChild>{trigger}</Dialog.Trigger><Dialog.Portal><Dialog.Overlay className="fixed inset-0 z-50 bg-[#17201b]/50 backdrop-blur-[2px]"/><Dialog.Content className="fixed top-1/2 left-1/2 z-50 max-h-[88dvh] w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-[1.75rem] border bg-card p-6 shadow-2xl"><Dialog.Title className="font-display pr-12 text-3xl">{title}</Dialog.Title>{description && <Dialog.Description className="mt-2 text-sm leading-6 text-muted-foreground">{description}</Dialog.Description>}<Dialog.Close className="absolute top-5 right-5 grid size-11 place-items-center rounded-full border bg-white" aria-label="Cerrar"><X size={18}/></Dialog.Close><div className="mt-6">{children}</div></Dialog.Content></Dialog.Portal></Dialog.Root>;
}
