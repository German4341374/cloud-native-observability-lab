import { context, SpanStatusCode, trace } from '@opentelemetry/api';
import Fastify, { type FastifyInstance } from 'fastify';
import { Counter, Histogram, Registry, collectDefaultMetrics } from 'prom-client';
import { request as httpRequest } from 'undici';
import { z } from 'zod';

import type { Config } from './config.js';
import { safeError } from './redaction.js';

const modeSchema = z.enum(['success', 'slow', 'error', 'timeout']);
const tracer = trace.getTracer('observability-lab');

const sleep = async (milliseconds: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

export async function buildServer(config: Config): Promise<FastifyInstance> {
  const app = Fastify({
    logger: {
      level: config.LOG_LEVEL,
      redact: ['req.headers.authorization', 'req.headers.cookie'],
      mixin: () => {
        const span = trace.getSpan(context.active());
        const spanContext = span?.spanContext();
        return spanContext === undefined
          ? {}
          : { traceId: spanContext.traceId, spanId: spanContext.spanId };
      },
    },
    requestIdHeader: 'x-request-id',
    bodyLimit: 32 * 1024,
  });
  const registry = new Registry();
  collectDefaultMetrics({ register: registry, prefix: `${config.SERVICE_ROLE}_` });
  const requests = new Counter({
    name: 'http_requests_total',
    help: 'HTTP requests by service, route, method, and status class.',
    labelNames: ['service', 'route', 'method', 'status_class'] as const,
    registers: [registry],
  });
  const latency = new Histogram({
    name: 'http_request_duration_seconds',
    help: 'HTTP request duration by service and route.',
    labelNames: ['service', 'route', 'method'] as const,
    buckets: [0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2, 5],
    registers: [registry],
  });
  const dependencyFailures = new Counter({
    name: 'dependency_failures_total',
    help: 'Gateway dependency failures by bounded failure type.',
    labelNames: ['type'] as const,
    registers: [registry],
  });

  app.addHook('onResponse', (request, reply, done) => {
    const route = request.routeOptions.url ?? 'unknown';
    const labels = {
      service: config.SERVICE_ROLE,
      route,
      method: request.method,
      status_class: `${Math.floor(reply.statusCode / 100)}xx`,
    };
    requests.inc(labels);
    latency.observe(
      { service: labels.service, route: labels.route, method: labels.method },
      reply.elapsedTime / 1000,
    );
    done();
  });

  app.get('/health/live', () => ({ status: 'ok', service: config.SERVICE_ROLE }));
  app.get('/health/ready', () => ({ status: 'ready', service: config.SERVICE_ROLE }));
  app.get('/metrics', async (_request, reply) => {
    reply.header('content-type', registry.contentType);
    return registry.metrics();
  });

  if (config.SERVICE_ROLE === 'dependency') {
    app.get('/api/process', async (request, reply) => {
      const mode = modeSchema.catch('success').parse((request.query as { mode?: string }).mode);
      return tracer.startActiveSpan('dependency.process', async (span) => {
        span.setAttribute('demo.failure.mode', mode);
        try {
          if (mode === 'slow') await sleep(800);
          if (mode === 'timeout') await sleep(5_000);
          if (mode === 'error') {
            span.setStatus({ code: SpanStatusCode.ERROR, message: 'controlled dependency error' });
            return await reply.code(503).send({ error: { code: 'CONTROLLED_FAILURE' } });
          }
          return { data: { accepted: true, mode } };
        } finally {
          span.end();
        }
      });
    });
  } else {
    app.get('/api/checkout', async (request, reply) => {
      const mode = modeSchema.catch('success').parse((request.query as { mode?: string }).mode);
      try {
        const response = await httpRequest(`${config.DEPENDENCY_URL}/api/process?mode=${mode}`, {
          method: 'GET',
          headers: { 'x-request-id': request.id },
          headersTimeout: config.DEPENDENCY_TIMEOUT_MS,
          bodyTimeout: config.DEPENDENCY_TIMEOUT_MS,
        });
        const body = await response.body.json();
        if (response.statusCode >= 500) {
          dependencyFailures.inc({ type: 'upstream_error' });
          return await reply
            .code(502)
            .send({ error: { code: 'DEPENDENCY_ERROR' }, upstream: body });
        }
        return { data: { checkout: 'accepted', dependency: body } };
      } catch (error) {
        const safe = safeError(error);
        dependencyFailures.inc({
          type: safe.name === 'HeadersTimeoutError' ? 'timeout' : 'network',
        });
        request.log.error({ error: safe, mode }, 'dependency request failed');
        return reply
          .code(502)
          .send({ error: { code: 'DEPENDENCY_UNAVAILABLE', message: safe.message } });
      }
    });
  }

  return app;
}
