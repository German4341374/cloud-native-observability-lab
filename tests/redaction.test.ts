import { describe, expect, it } from 'vitest';

import { redactText, safeError } from '../src/redaction.js';

describe('log redaction', () => {
  it('masks email addresses', () => {
    expect(redactText('contact demo.user@example.invalid')).toBe('contact [EMAIL]');
  });

  it('masks bearer tokens', () => {
    expect(redactText('Authorization: Bearer demo.token.value')).toBe(
      'Authorization: Bearer [REDACTED]',
    );
  });

  it('masks sensitive query parameters', () => {
    expect(redactText('https://example.invalid/path?token=demo-secret&safe=1')).toContain(
      'token=[REDACTED]&safe=1',
    );
  });

  it('returns a safe error projection', () => {
    expect(safeError(new Error('failed for test@example.invalid'))).toEqual({
      name: 'Error',
      message: 'failed for [EMAIL]',
    });
  });

  it('does not stringify unknown error objects', () => {
    expect(safeError({ accessToken: 'do-not-log' })).toEqual({
      name: 'UnknownError',
      message: 'An unknown error occurred',
    });
  });
});
