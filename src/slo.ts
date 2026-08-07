export interface SloWindow {
  total: number;
  failed: number;
  slow: number;
}

export interface SloEvaluation {
  availability: number;
  latencyCompliance: number;
  errorBudgetRemaining: number;
  availabilityBurnRate: number;
  alert: 'none' | 'ticket' | 'page';
}

function ratio(good: number, total: number): number {
  return total === 0 ? 1 : good / total;
}

export function burnRate(observedAvailability: number, target: number): number {
  const budget = 1 - target;
  if (budget <= 0) return Number.POSITIVE_INFINITY;
  return Math.max(0, 1 - observedAvailability) / budget;
}

export function evaluateSlo(window: SloWindow, availabilityTarget: number): SloEvaluation {
  const availability = ratio(window.total - window.failed, window.total);
  const latencyCompliance = ratio(window.total - window.slow, window.total);
  const availabilityBurnRate = burnRate(availability, availabilityTarget);
  const consumedBudget = Math.max(0, 1 - availability);
  const errorBudgetRemaining = Math.max(0, 1 - consumedBudget / (1 - availabilityTarget));

  return {
    availability,
    latencyCompliance,
    errorBudgetRemaining,
    availabilityBurnRate,
    alert: availabilityBurnRate >= 14 ? 'page' : availabilityBurnRate >= 2 ? 'ticket' : 'none',
  };
}

export function shouldPage(fastWindowBurn: number, slowWindowBurn: number): boolean {
  return fastWindowBurn >= 14 && slowWindowBurn >= 6;
}
