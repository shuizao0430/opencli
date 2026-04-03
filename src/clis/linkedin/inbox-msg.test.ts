import { describe, expect, it } from 'vitest';
import { getRegistry } from '../../registry.js';
import './inbox-msg.js';

const { resolveInboxTarget } = await import('./inbox-msg.js').then((m) => (m as any).__test__);

describe('linkedin inbox-msg adapter', () => {
  it('registers recruiter inbox message reader', () => {
    const command = getRegistry().get('linkedin/inbox-msg');
    expect(command).toBeDefined();
    expect(command!.browser).toBe(true);
    expect(command!.args.find((arg) => arg.name === 'limit')?.default).toBe(20);
    expect(command!.columns).toEqual(
      expect.arrayContaining([
        'conversation_id',
        'candidate_id',
        'from',
        'direction',
        'type',
        'text',
        'time',
        'profile_url',
        'list_source',
      ]),
    );
  });

  it('resolves a direct recruiter thread url from conversation id', () => {
    expect(resolveInboxTarget('conv-123', undefined, undefined)).toBe(
      'https://www.linkedin.com/talent/messages?conversationId=conv-123',
    );
  });

  it('falls back to recruiter inbox when matching by candidate or profile', () => {
    expect(resolveInboxTarget('', 'url:abc', undefined)).toBe(
      'https://www.linkedin.com/talent/messages',
    );
    expect(resolveInboxTarget('', '', 'https://www.linkedin.com/in/jane-doe/')).toBe(
      'https://www.linkedin.com/talent/messages',
    );
  });
});
