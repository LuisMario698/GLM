'use server';

import { revalidatePath } from 'next/cache';
import { requireProfile, requireUser } from '@/lib/auth';
import { localISODate } from '@/lib/date';
import { recommendToday } from '@/lib/recommendations/daily';
import { coachSchema } from '@/lib/validations';
import type { ActionResult, DailyCheckin } from '@/types/domain';
import { asResult } from './state';

export async function askCoach(input: { conversationId?: string; message: string; contextType: 'general' | 'daily' | 'session' | 'exercise' | 'meal' }): Promise<ActionResult<{ conversationId: string; answer: string }>> {
  const parsed = coachSchema.safeParse({ conversation_id: input.conversationId, message: input.message, context_type: input.contextType });
  if (!parsed.success) return { ok: false, error: 'La pregunta no es válida.' };
  if (!process.env.OPENAI_API_KEY) return { ok: false, error: 'OPENAI_API_KEY no está configurada.' };
  try {
    const { supabase, userId, profile } = await requireProfile();
    const [{ data: checkin }, { data: audit }, { data: plan }] = await Promise.all([
      supabase.from('daily_checkins').select('*').eq('profile_id', userId).eq('recorded_on', localISODate()).maybeSingle(),
      supabase.from('recommendation_audits').select('status,rationale').eq('profile_id', userId).eq('recommendation_date', localISODate()).maybeSingle(),
      supabase.from('weekly_plans').select('adjustment,rationale').eq('profile_id', userId).order('week_start', { ascending: false }).limit(1).maybeSingle(),
    ]);
    const safeDaily = checkin ? recommendToday(checkin as DailyCheckin) : null;
    const moderation = await fetch('https://api.openai.com/v1/moderations', { method: 'POST', headers: headers(), body: JSON.stringify({ model: 'omni-moderation-latest', input: parsed.data.message }) });
    if (!moderation.ok) throw new Error('No fue posible validar el mensaje.');
    const moderationJson = await moderation.json();
    if (moderationJson.results?.[0]?.flagged) return { ok: false, error: 'No puedo responder ese mensaje de forma segura.' };

    const context = {
      goal: profile.goal,
      daily_status: audit?.status ?? safeDaily?.status ?? 'without_checkin',
      daily_rationale: audit?.rationale ?? safeDaily?.rationale ?? null,
      weekly_adjustment: plan?.adjustment ?? null,
      weekly_rationale: plan?.rationale ?? null,
    };
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST', headers: headers(),
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL ?? 'gpt-5.4-mini', store: false, reasoning: { effort: 'low' },
        instructions: 'Eres el guía explicativo de GLM para adultos sanos. Explica únicamente el contexto aprobado. No diagnostiques, no cambies ejercicios, series, calorías ni comidas, no prometas resultados. Si preguntan por dolor, enfermedad, lesión, embarazo o dieta clínica, indica que GLM no puede atenderlo y recomienda un profesional. Responde en español claro y breve.',
        input: JSON.stringify({ context, question: parsed.data.message, context_type: parsed.data.context_type }),
        text: { format: { type: 'json_schema', name: 'glm_coach_answer', strict: true, schema: { type: 'object', additionalProperties: false, properties: { answer: { type: 'string' }, safety_notice: { type: 'string' } }, required: ['answer', 'safety_notice'] } } },
        max_output_tokens: 500,
      }),
    });
    if (!response.ok) throw new Error('El guía no está disponible en este momento.');
    const json = await response.json();
    const raw = json.output?.flatMap((item: { content?: { type: string; text?: string }[] }) => item.content ?? []).find((item: { type: string }) => item.type === 'output_text')?.text;
    if (!raw) throw new Error('El guía devolvió una respuesta vacía.');
    const output = JSON.parse(raw) as { answer: string; safety_notice: string };
    const answer = output.safety_notice ? `${output.answer}\n\n${output.safety_notice}` : output.answer;

    let conversationId = parsed.data.conversation_id;
    if (conversationId) {
      const { data: owned } = await supabase.from('coach_conversations').select('id').eq('id', conversationId).eq('profile_id', userId).maybeSingle();
      if (!owned) conversationId = undefined;
    }
    if (!conversationId) {
      const { data: created, error } = await supabase.from('coach_conversations').insert({ profile_id: userId, title: parsed.data.message.slice(0, 70) }).select('id').single();
      if (error) throw error;
      conversationId = created.id;
    }
    if (!conversationId) throw new Error('No fue posible crear la conversación.');
    await supabase.from('coach_messages').insert([
      { conversation_id: conversationId, role: 'user', content: parsed.data.message, context_type: parsed.data.context_type },
      { conversation_id: conversationId, role: 'assistant', content: answer, context_type: parsed.data.context_type },
    ]);
    await supabase.from('coach_conversations').update({ expires_at: new Date(Date.now() + 30 * 86400_000).toISOString() }).eq('id', conversationId);
    revalidatePath('/guia');
    return { ok: true, data: { conversationId, answer } };
  } catch (error) { return asResult(error, 'No fue posible consultar al guía.'); }
}

export async function deleteConversation(id: string): Promise<ActionResult> {
  try {
    const { supabase, userId } = await requireUser();
    const { error } = await supabase.from('coach_conversations').delete().eq('id', id).eq('profile_id', userId);
    if (error) throw error;
    revalidatePath('/guia');
    return { ok: true, data: undefined };
  } catch (error) { return asResult(error, 'No fue posible eliminar la conversación.'); }
}

function headers() { return { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' }; }
