import { z } from 'zod';

const schema = z.object({
  SERVICE_ROLE: z.enum(['gateway', 'dependency']).default('gateway'),
  PORT: z.coerce.number().int().min(1).max(65_535).default(8080),
  DEPENDENCY_URL: z.url().default('http://127.0.0.1:8081'),
  DEPENDENCY_TIMEOUT_MS: z.coerce.number().int().min(100).max(30_000).default(1500),
  OTEL_EXPORTER_OTLP_ENDPOINT: z.url().default('http://127.0.0.1:4318'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  SLO_AVAILABILITY_TARGET: z.coerce.number().min(0.9).max(0.99999).default(0.995),
  SLO_LATENCY_TARGET_MS: z.coerce.number().int().min(10).max(30_000).default(500),
});

export type Config = z.infer<typeof schema>;

export function loadConfig(environment: NodeJS.ProcessEnv = process.env): Config {
  return schema.parse(environment);
}
