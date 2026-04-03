import { describe, expect, it } from 'vitest';
import { getRegistry } from '../../registry.js';
import './inbox-reply.js';

const { resolveInboxReplyTarget } = await import('./inbox-reply.js').then((m) => (m as any).__test__);

describe('linkedin inbox-reply adapter', () => {
  it('registers recruiter inbox reply with alias', () => {
    const command = getRegistry().get('linkedin/inbox-reply');
    expect(command).toBeDefined();
    expect(command!.browser).toBe(true);
    expect(command!.aliases).toContain('reply');
    expect(getRegistry().get('linkedin/reply')).toBe(command);
    expect(command!.columns).toEqual(
      expect.arrayContaining(['conversation_id', 'candidate_id', 'profile_url', 'status', 'detail', 'list_source']),
    );
  });

  it('resolves direct thread urls for replies', () => {
    expect(resolveInboxReplyTarget('conv-123', undefined, undefined)).toBe(
      'https://www.linkedin.com/talent/messages?conversationId=conv-123',
    );
  });

  it('falls back to inbox matching for replies', () => {
    expect(resolveInboxReplyTarget('', 'url:abc', undefined)).toBe(
      'https://www.linkedin.com/talent/messages',
    );
  });
});
