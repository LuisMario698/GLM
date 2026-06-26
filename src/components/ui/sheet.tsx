'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';

export function Sheet({ trigger, title, children }: { trigger: React.ReactNode; title: string; children: React.ReactNode }) {
  return <Dialog.Root><Dialog.Trigger asChild>{trigger}</Dialog.Trigger><Dialog.Portal><Dialog.Overlay className="fixed inset-0 z-50 bg-[#17201b]/45 backdrop-blur-[2px] data-[state=open]:animate-in"/><Dialog.Content className="safe-bottom fixed inset-x-0 bottom-0 z-50 max-h-[85dvh] overflow-y-auto rounded-t-[2rem] border bg-card p-5 shadow-2xl sm:inset-y-0 sm:right-0 sm:left-auto sm:w-[380px] sm:rounded-none sm:p-7"><div className="flex items-center justify-between gap-4"><Dialog.Title className="font-display text-2xl">{title}</Dialog.Title><Dialog.Close className="grid size-11 place-items-center rounded-full border bg-white" aria-label="Cerrar"><X size={19}/></Dialog.Close></div><div className="mt-6">{children}</div></Dialog.Content></Dialog.Portal></Dialog.Root>;
}

export function SheetClose({ children }: { children: React.ReactNode }) {
  return <Dialog.Close asChild>{children}</Dialog.Close>;
}
