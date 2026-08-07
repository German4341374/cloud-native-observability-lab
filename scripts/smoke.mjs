const endpoints = [
  ['gateway', 'http://127.0.0.1:8080/health/ready'],
  ['prometheus', 'http://127.0.0.1:9090/-/ready'],
  ['loki', 'http://127.0.0.1:3100/ready'],
  ['tempo', 'http://127.0.0.1:3200/ready'],
  ['grafana', 'http://127.0.0.1:3000/api/health'],
];

async function waitForJson(name, url, predicate, attempts = 60) {
  let lastError;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`${response.status} ${await response.text()}`);
      const body = await response.json();
      if (predicate(body)) return body;
      lastError = new Error('response did not contain expected data');
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error(`${name} verification failed: ${String(lastError)}`);
}

for (const [name, url] of endpoints) {
  let ready = false;
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        ready = true;
        break;
      }
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  if (!ready) throw new Error(`${name} did not become ready`);
}

const success = await fetch('http://127.0.0.1:8080/api/checkout?mode=success');
if (!success.ok) throw new Error(`success request failed: ${success.status}`);
const failure = await fetch('http://127.0.0.1:8080/api/checkout?mode=error');
if (failure.status !== 502) throw new Error(`controlled failure returned ${failure.status}`);
const metrics = await fetch('http://127.0.0.1:8080/metrics').then((response) => response.text());
if (!metrics.includes('http_requests_total')) throw new Error('application metrics are missing');

const prometheusUrl = new URL('/api/v1/query', 'http://127.0.0.1:9090');
prometheusUrl.searchParams.set('query', 'http_requests_total{service="gateway"}');
await waitForJson(
  'Prometheus application metric',
  prometheusUrl,
  (body) => body.status === 'success' && body.data?.result?.length > 0,
);

const lokiUrl = new URL('/loki/api/v1/query_range', 'http://127.0.0.1:3100');
lokiUrl.searchParams.set('query', '{container=~".*gateway.*"}');
lokiUrl.searchParams.set('start', String(BigInt(Date.now() - 120_000) * 1_000_000n));
lokiUrl.searchParams.set('limit', '20');
await waitForJson(
  'Loki gateway logs',
  lokiUrl,
  (body) => body.status === 'success' && body.data?.result?.length > 0,
);

const tempoUrl = new URL('/api/search', 'http://127.0.0.1:3200');
tempoUrl.searchParams.set('tags', 'service.name=observability-gateway');
tempoUrl.searchParams.set('limit', '20');
await waitForJson(
  'Tempo gateway traces',
  tempoUrl,
  (body) => Array.isArray(body.traces) && body.traces.length > 0,
);

await waitForJson(
  'Grafana provisioned dashboard',
  'http://127.0.0.1:3000/api/dashboards/uid/cloud-native-service-overview',
  (body) => body.dashboard?.uid === 'cloud-native-service-overview',
);

console.log(
  JSON.stringify({
    status: 'passed',
    verified: ['health', 'metrics', 'logs', 'traces', 'dashboard', 'controlled-failure'],
    grafana: 'http://127.0.0.1:3000',
  }),
);
