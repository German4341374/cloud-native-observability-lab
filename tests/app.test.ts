import { afterEach, describe, expect, it } from 'vitest';

import { buildServer } from '../src/app.js';
import type { Config } from '../src/config.js';

const config: Config = {
  SERVICE_ROLE: 'dependency',
  PORT: 8081,
  DEPENDENCY_URL: 'http://127.0.0.1:8081',
  DEPENDENCY_TIMEOUT_MS: 100,
  OTEL_EXPORTER_OTLP_ENDPOINT: 'http://127.0.0.1:4318',
  LOG_LEVEL: 'error',
  SLO_AVAILABILITY_TARGET: 0.995,
  SLO_LATENCY_TARGET_MS: 500,
};

const servers: Awaited<ReturnType<typeof buildServer>>[] = [];

afterEach(async () => {
  await Promise.all(servers.splice(0).map(async (server) => server.close()));
});

describe('dependency service', () => {
  it('reports liveness', async () => {
    const server = await buildServer(config);
    servers.push(server);
    const response = await server.inject('/health/live');
    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ status: 'ok', service: 'dependency' });
  });

  it('processes the success scenario', async () => {
    const server = await buildServer(config);
    servers.push(server);
    const response = await server.inject('/api/process?mode=success');
    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ data: { accepted: true, mode: 'success' } });
  });

  it('returns a controlled failure', async () => {
    const server = await buildServer(config);
    servers.push(server);
    const response = await server.inject('/api/process?mode=error');
    expect(response.statusCode).toBe(503);
    expect(response.json()).toEqual({ error: { code: 'CONTROLLED_FAILURE' } });
  });

  it('exports Prometheus metrics', async () => {
    const server = await buildServer(config);
    servers.push(server);
    await server.inject('/health/live');
    const response = await server.inject('/metrics');
    expect(response.statusCode).toBe(200);
    expect(response.body).toContain('http_requests_total');
  });
});
