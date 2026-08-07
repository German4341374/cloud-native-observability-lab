import { describe, expect, it } from 'vitest';

import { burnRate, evaluateSlo, shouldPage } from '../src/slo.js';

describe('SLO calculations', () => {
  it('returns a zero burn rate for perfect availability', () => {
    expect(burnRate(1, 0.995)).toBe(0);
  });

  it('calculates burn relative to the configured budget', () => {
    expect(burnRate(0.99, 0.995)).toBeCloseTo(2);
  });

  it('handles a mathematically impossible zero budget', () => {
    expect(burnRate(1, 1)).toBe(Number.POSITIVE_INFINITY);
  });

  it('treats an empty window as healthy', () => {
    expect(evaluateSlo({ total: 0, failed: 0, slow: 0 }, 0.995)).toMatchObject({
      availability: 1,
      latencyCompliance: 1,
      alert: 'none',
    });
  });

  it('creates a ticket for a moderate burn', () => {
    expect(evaluateSlo({ total: 1000, failed: 10, slow: 20 }, 0.995).alert).toBe('ticket');
  });

  it('pages for a severe burn', () => {
    expect(evaluateSlo({ total: 100, failed: 10, slow: 10 }, 0.995).alert).toBe('page');
  });

  it('never reports a negative remaining budget', () => {
    expect(evaluateSlo({ total: 100, failed: 50, slow: 0 }, 0.995).errorBudgetRemaining).toBe(0);
  });

  it('requires both fast and slow windows before paging', () => {
    expect(shouldPage(20, 7)).toBe(true);
    expect(shouldPage(20, 2)).toBe(false);
    expect(shouldPage(5, 7)).toBe(false);
  });
});
