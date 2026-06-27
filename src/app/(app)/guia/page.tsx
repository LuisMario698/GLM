import Link from 'next/link';
import { MessagesSquare, Plus } from 'lucide-react';
import { requireProfile } from '@/lib/auth';
import { CoachChat } from '@/components/coach/coach-chat';
import { Button } from '@/components/ui/button';
import { Sheet, SheetClose } from '@/components/ui/sheet';

type Conversation = { id: string; title: string };

export default async function GuidePage({ searchParams }: { searchParams: Promise<{ conversation?: string; prompt?: string }> }) {
  const params = await searchParams;
  const { supabase, userId } = await requireProfile();
  const { data: conversations } = await supabase.from('coach_conversations').select('*').eq('profile_id', userId).gt('expires_at', new Date().toISOString()).order('updated_at', { ascending: false }).limit(10);
  const activeId = params.conversation ?? conversations?.[0]?.id;
  const { data: messages } = activeId && activeId !== 'new'
    ? await supabase.from('coach_messages').select('*').eq('conversation_id', activeId).order('created_at')
    : { data: [] };

  return <section className="space-y-4 lg:space-y-6">
    <div className="flex items-center justify-between gap-4 rounded-[1.75rem] border bg-card/75 p-4 shadow-[0_18px_45px_rgba(23,32,27,.06)] backdrop-blur sm:p-5">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[.22em] text-primary">Explicaciones con IA</p>
        <h1 className="font-display mt-1 text-3xl leading-none sm:text-4xl">Guía personal</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Pregunta sobre decisiones ya aprobadas para tu actividad y alimentación.</p>
      </div>
      <div className="lg:hidden">
        <Sheet title="Conversaciones" trigger={<Button variant="ghost" className="px-4"><MessagesSquare size={18}/><span className="hidden sm:inline">Conversaciones</span></Button>}>
          <ConversationLinks conversations={conversations ?? []} activeId={activeId} closeOnSelect/>
        </Sheet>
      </div>
    </div>
    <div className="grid gap-6 lg:grid-cols-[250px_minmax(0,1fr)]">
      <aside className="hidden space-y-2 lg:block"><ConversationLinks conversations={conversations ?? []} activeId={activeId}/></aside>
      <CoachChat
        conversationId={activeId === 'new' ? undefined : activeId}
        initialMessages={messages ?? []}
        initialPrompt={params.prompt}
        isConfigured={Boolean(process.env.OPENAI_API_KEY)}
      />
    </div>
  </section>;
}

function ConversationLinks({ conversations, activeId, closeOnSelect = false }: { conversations: Conversation[]; activeId?: string; closeOnSelect?: boolean }) {
  const links = [
    <Link key="new" href="/guia?conversation=new" className="flex min-h-11 items-center gap-2 rounded-xl border bg-card px-4 text-sm font-semibold"><Plus size={17}/>Nueva conversación</Link>,
    ...conversations.map((conversation) => <Link key={conversation.id} href={`/guia?conversation=${conversation.id}`} className={`flex min-h-11 items-center truncate rounded-xl px-4 text-sm ${activeId === conversation.id ? 'bg-secondary font-semibold text-white' : 'bg-muted'}`}>{conversation.title}</Link>),
  ];
  return <div className="grid gap-2">{closeOnSelect ? links.map((link) => <SheetClose key={link.key}>{link}</SheetClose>) : links}</div>;
}
