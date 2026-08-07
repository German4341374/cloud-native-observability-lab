import { loadConfig } from './config.js';
import { createTelemetry } from './telemetry.js';

const config = loadConfig();
const telemetry = createTelemetry(config);
telemetry.start();

const { buildServer } = await import('./app.js');
const server = await buildServer(config);
const controller = new AbortController();

for (const signal of ['SIGTERM', 'SIGINT'] as const) {
  process.once(signal, () => {
    controller.abort();
  });
}

await server.listen({ host: '0.0.0.0', port: config.PORT });
await new Promise<void>((resolve) => {
  controller.signal.addEventListener(
    'abort',
    () => {
      resolve();
    },
    { once: true },
  );
});
await server.close();
await telemetry.shutdown();
