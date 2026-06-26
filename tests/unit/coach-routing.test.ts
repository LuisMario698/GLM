import { describe, expect, it } from 'vitest';
import { guideConversationHref } from '@/lib/coach-routing';

describe('coach routing', () => {
  it('builds the URL for a created conversation', () => {
    expect(guideConversationHref('abc-123')).toBe('/guia?conversation=abc-123');
    expect(guideConversationHref('id with space')).toBe('/guia?conversation=id%20with%20space');
  });
});
