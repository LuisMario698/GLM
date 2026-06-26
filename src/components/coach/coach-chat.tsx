"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Bot,
  Loader2,
  MessageCircleQuestion,
  Send,
  Trash2,
  UserRound,
} from "lucide-react";
import { askCoach, deleteConversation } from "@/lib/actions/coach";
import { guideConversationHref } from "@/lib/coach-routing";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
};

const suggestions = [
  "¿Por qué esta sesión es adecuada para hoy?",
  "Explícame cómo medir qué tan difícil fue el ejercicio.",
  "¿Qué sustitución puedo usar con mi equipo?",
];

export function CoachChat({
  conversationId,
  initialMessages,
  initialPrompt = "",
  isConfigured = true,
}: {
  conversationId?: string;
  initialMessages: Message[];
  initialPrompt?: string;
  isConfigured?: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [prompt, setPrompt] = useState(initialPrompt);
  const [activeId, setActiveId] = useState(conversationId);
  const [error, setError] = useState("");
  const [activeOperation, setActiveOperation] = useState<
    "send" | "delete" | null
  >(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scrollArea = scrollAreaRef.current;
    if (!scrollArea) return;
    scrollArea.scrollTo({
      top: scrollArea.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, activeOperation, error]);

  function send() {
    if (!prompt.trim() || pending) return;
    if (!isConfigured) {
      setError(
        "El guía con IA no está configurado. Agrega OPENAI_API_KEY en .env.local y reinicia el servidor de desarrollo.",
      );
      return;
    }

    const question = prompt.trim();
    const localId = `local-${Date.now()}`;
    setError("");
    setPrompt("");
    setMessages((current) => [
      ...current,
      {
        id: localId,
        role: "user",
        content: question,
        created_at: new Date().toISOString(),
      },
    ]);
    setActiveOperation("send");

    start(async () => {
      try {
        const previousId = activeId;
        const result = await askCoach({
          conversationId: previousId,
          message: question,
          contextType: "general",
        });

        if (result.ok) {
          setActiveId(result.data.conversationId);
          setMessages((current) => [
            ...current,
            {
              id: `answer-${Date.now()}`,
              role: "assistant",
              content: result.data.answer,
              created_at: new Date().toISOString(),
            },
          ]);
          if (previousId) {
            router.refresh();
          } else {
            router.replace(guideConversationHref(result.data.conversationId));
          }
        } else {
          setMessages((current) =>
            current.filter((message) => message.id !== localId),
          );
          setPrompt(question);
          setError(result.error);
        }
      } catch {
        setMessages((current) =>
          current.filter((message) => message.id !== localId),
        );
        setPrompt(question);
        setError("No fue posible conectar con el guía. Intenta de nuevo.");
      } finally {
        setActiveOperation(null);
      }
    });
  }

  function remove() {
    if (!activeId || pending) return;
    setError("");
    setActiveOperation("delete");

    start(async () => {
      try {
        const result = await deleteConversation(activeId);
        if (result.ok) {
          setMessages([]);
          setActiveId(undefined);
          router.replace("/guia");
        } else {
          setError(result.error);
        }
      } catch {
        setError("No fue posible borrar la conversación.");
      } finally {
        setActiveOperation(null);
      }
    });
  }

  function useSuggestion(suggestion: string) {
    setPrompt(suggestion);
  }

  const statusMessage = !isConfigured
    ? "El guía con IA no está configurado. Falta OPENAI_API_KEY en .env.local."
    : error;
  const isSending = pending && activeOperation === "send";
  const isDeleting = pending && activeOperation === "delete";

  return (
    <section className="flex min-h-[calc(100dvh-13.5rem)] min-w-0 flex-col gap-3 lg:min-h-[calc(100dvh-8rem)]">
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[1.8rem] border bg-card shadow-[0_22px_70px_rgba(23,32,27,.08)]">
        <div className="flex items-center justify-between gap-3 border-b bg-gradient-to-r from-[#fff7ef] via-card to-[#edf5ef] px-4 py-3 sm:px-5">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-secondary text-white">
              <Bot size={19} />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">Guía activo</p>
              <p className="truncate text-xs text-muted-foreground">
                Explica tu plan sin cambiar reglas aprobadas.
              </p>
            </div>
          </div>
          {activeId ? (
            <Button
              type="button"
              variant="ghost"
              onClick={remove}
              disabled={pending}
              className="min-h-10 px-3 text-xs"
            >
              <Trash2 size={15} />
              <span className="hidden sm:inline">
                {isDeleting ? "Borrando…" : "Borrar"}
              </span>
            </Button>
          ) : null}
        </div>

        <div
          ref={scrollAreaRef}
          aria-live="polite"
          className="scrollbar-none flex h-[min(58dvh,560px)] min-h-[360px] flex-col gap-3 overflow-y-auto overscroll-contain p-4 sm:h-[560px] sm:p-5 lg:h-[calc(100dvh-17rem)]"
        >
          {messages.length ? (
            messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))
          ) : (
            <EmptyChat onSuggestion={useSuggestion} />
          )}

          {isSending ? <TypingBubble /> : null}

          {statusMessage ? <StatusBubble message={statusMessage} /> : null}
        </div>
      </div>

      <form
        className="coach-composer rounded-[1.45rem] border bg-card/95 p-3 shadow-[0_18px_55px_rgba(23,32,27,.13)] backdrop-blur"
        onSubmit={(event) => {
          event.preventDefault();
          send();
        }}
      >
        <label className="sr-only" htmlFor="coach-prompt">
          Pregunta para la guía
        </label>
        <Textarea
          id="coach-prompt"
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          placeholder={
            isConfigured
              ? "Escribe una pregunta sobre tu plan..."
              : "Configura OPENAI_API_KEY para usar el guía..."
          }
          className="min-h-20 resize-none rounded-[1.15rem] border-muted bg-white/90"
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              send();
            }
          }}
        />
        <div className="mt-2 flex items-center justify-between gap-2">
          <p className="hidden text-xs text-muted-foreground sm:block">
            Enter envía. Shift + Enter agrega una línea.
          </p>
          <Button
            type="submit"
            disabled={pending || !prompt.trim() || !isConfigured}
            className="ml-auto px-5"
          >
            {isSending ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Send size={16} />
            )}
            {isSending ? "Consultando..." : "Enviar"}
          </Button>
        </div>
      </form>

      <p className="px-1 text-xs leading-5 text-muted-foreground">
        El historial se elimina automáticamente después de 30 días. OpenAI
        recibe contexto mínimo y usa <code>store: false</code>.
      </p>
    </section>
  );
}

function EmptyChat({
  onSuggestion,
}: {
  onSuggestion: (suggestion: string) => void;
}) {
  return (
    <div className="grid flex-1 content-center justify-items-center py-10 text-center">
      <span className="grid size-12 place-items-center rounded-full bg-primary/10 text-primary">
        <MessageCircleQuestion size={24} />
      </span>
      <p className="font-display mt-4 text-3xl">Pregunta por tu plan</p>
      <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
        El guía explica decisiones ya aprobadas. No diagnostica ni modifica tus
        reglas de seguridad.
      </p>
      <div className="mt-5 flex max-w-xl flex-wrap justify-center gap-2">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            onClick={() => onSuggestion(suggestion)}
            className="min-h-11 rounded-full border bg-white px-4 text-left text-xs font-semibold transition hover:bg-muted"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const fromUser = message.role === "user";
  return (
    <div className={cn("flex gap-2", fromUser && "justify-end")}>
      {!fromUser ? (
        <span className="mt-1 grid size-8 shrink-0 place-items-center rounded-full bg-secondary text-white">
          <Bot size={16} />
        </span>
      ) : null}
      <div
        className={cn(
          "max-w-[86%] whitespace-pre-line rounded-2xl p-4 text-sm leading-6 shadow-sm",
          fromUser
            ? "rounded-br-sm bg-secondary text-white"
            : "rounded-bl-sm bg-muted text-foreground",
        )}
      >
        {message.content}
      </div>
      {fromUser ? (
        <span className="mt-1 grid size-8 shrink-0 place-items-center rounded-full bg-primary text-white">
          <UserRound size={15} />
        </span>
      ) : null}
    </div>
  );
}

function TypingBubble() {
  return (
    <div className="flex gap-2">
      <span className="mt-1 grid size-8 shrink-0 place-items-center rounded-full bg-secondary text-white">
        <Bot size={16} />
      </span>
      <div className="inline-flex max-w-[92%] items-center gap-2 rounded-2xl rounded-bl-sm bg-muted p-4 text-sm leading-6 text-muted-foreground">
        <Loader2 size={16} className="animate-spin" />
        Consultando al guía...
      </div>
    </div>
  );
}

function StatusBubble({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="max-w-[92%] rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900"
    >
      <div className="flex gap-3">
        <AlertTriangle size={18} className="mt-0.5 shrink-0" />
        <div>
          <p className="font-semibold">No pude responder todavía.</p>
          <p className="mt-1">{message}</p>
        </div>
      </div>
    </div>
  );
}
