const emailPattern = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/giu;
const bearerPattern = /\bBearer\s+[A-Za-z0-9._~+/=-]+/giu;
const sensitiveQueryPattern = /([?&](?:token|key|password|secret)=)[^&\s]+/giu;

export function redactText(value: string): string {
  return value
    .replace(emailPattern, '[EMAIL]')
    .replace(bearerPattern, 'Bearer [REDACTED]')
    .replace(sensitiveQueryPattern, '$1[REDACTED]');
}

export function safeError(error: unknown): { name: string; message: string } {
  if (error instanceof Error) {
    return { name: error.name, message: redactText(error.message) };
  }
  return { name: 'UnknownError', message: 'An unknown error occurred' };
}
