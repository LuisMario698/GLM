import { describe, expect, it } from 'vitest';
import { parseCoachAnswer } from '@/lib/coach-response';

describe('coach response parsing', () => {
  it('reads structured output from Responses content blocks', () => {
    const answer = parseCoachAnswer({
      output: [
        {
          content: [
            {
              type: 'output_text',
              text: JSON.stringify({ answer: 'Hazlo con calma.', safety_notice: 'Si hay dolor, detente.' }),
            },
          ],
        },
      ],
    });

    expect(answer).toBe('Hazlo con calma.\n\nSi hay dolor, detente.');
  });

  it('supports output_text when the API returns it at top level', () => {
    expect(parseCoachAnswer({ output_text: JSON.stringify({ answer: 'Respuesta directa.' }) })).toBe('Respuesta directa.');
  });

  it('rejects empty responses', () => {
    expect(() => parseCoachAnswer({ output: [] })).toThrow(/vacía/);
  });
});
