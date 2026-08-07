import { describe, expect, it } from 'vitest';

import { loadConfig } from '../src/config.js';

describe('configuration', () => {
  it('loads deterministic defaults', () => {
    expect(loadConfig({})).toMatchObject({ SERVICE_ROLE: 'gateway', PORT: 8080 });
  });

  it('validates availability targets', () => {
    expect(() => loadConfig({ SLO_AVAILABILITY_TARGET: '0.5' })).toThrow();
  });

  it('rejects unsupported roles', () => {
    expect(() => loadConfig({ SERVICE_ROLE: 'database' })).toThrow();
  });
});
