export function guideConversationHref(conversationId: string) {
  return `/guia?conversation=${encodeURIComponent(conversationId)}`;
}
