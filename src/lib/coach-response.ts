type OpenAIResponseContent = { type?: string; text?: string };
type OpenAIResponseOutput = { content?: OpenAIResponseContent[] };

type CoachAnswerPayload = {
  answer: string;
  safety_notice?: string;
};

export function parseCoachAnswer(response: {
  output?: OpenAIResponseOutput[];
  output_text?: string;
}) {
  const raw =
    response.output_text ??
    response.output
      ?.flatMap((item) => item.content ?? [])
      .find((item) => item.type === "output_text")?.text;

  if (!raw) throw new Error("El guía devolvió una respuesta vacía.");

  const output = JSON.parse(raw) as CoachAnswerPayload;
  if (!output.answer?.trim()) {
    throw new Error("El guía devolvió una respuesta incompleta.");
  }

  return output.safety_notice?.trim()
    ? `${output.answer}\n\n${output.safety_notice}`
    : output.answer;
}
