import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CoachChat } from '@/components/coach/coach-chat';

const routerMock = vi.hoisted(() => ({
  refresh: vi.fn(),
  replace: vi.fn(),
}));

const actionsMock = vi.hoisted(() => ({
  askCoach: vi.fn(),
  deleteConversation: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => routerMock,
}));

vi.mock('@/lib/actions/coach', () => actionsMock);

const conversationId = '11111111-1111-4111-8111-111111111111';

describe('CoachChat', () => {
  beforeEach(() => {
    routerMock.refresh.mockReset();
    routerMock.replace.mockReset();
    actionsMock.askCoach.mockReset();
    actionsMock.deleteConversation.mockReset();
  });

  it('keeps the first exchange visible after navigating to the created conversation', async () => {
    actionsMock.askCoach.mockResolvedValue({
      ok: true,
      data: { conversationId, answer: 'Respuesta del guía.' },
    });

    const { rerender } = render(<CoachChat initialMessages={[]} isConfigured />);

    fireEvent.change(screen.getByLabelText('Pregunta para la guía'), {
      target: { value: 'Hola guía' },
    });
    fireEvent.click(screen.getByRole('button', { name: /enviar/i }));

    expect(await screen.findByText('Respuesta del guía.')).toBeVisible();
    expect(screen.getByText('Hola guía')).toBeVisible();
    expect(routerMock.replace).toHaveBeenCalledWith(`/guia?conversation=${conversationId}`);

    rerender(<CoachChat conversationId={conversationId} initialMessages={[]} isConfigured />);

    expect(screen.getByText('Respuesta del guía.')).toBeVisible();
    expect(screen.getByText('Hola guía')).toBeVisible();
  });

  it('loads a different conversation when the selected id changes', async () => {
    const { rerender } = render(
      <CoachChat
        conversationId="conversation-a"
        initialMessages={[
          { id: 'a', role: 'assistant', content: 'Mensaje anterior', created_at: '2026-06-26T00:00:00Z' },
        ]}
        isConfigured
      />,
    );

    expect(screen.getByText('Mensaje anterior')).toBeVisible();

    rerender(
      <CoachChat
        conversationId="conversation-b"
        initialMessages={[
          { id: 'b', role: 'assistant', content: 'Mensaje nuevo', created_at: '2026-06-26T00:01:00Z' },
        ]}
        isConfigured
      />,
    );

    await waitFor(() => expect(screen.queryByText('Mensaje anterior')).not.toBeInTheDocument());
    expect(screen.getByText('Mensaje nuevo')).toBeVisible();
  });
});
