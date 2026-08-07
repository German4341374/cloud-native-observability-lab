const endpoints = [
  ['gateway', 'http://127.0.0.1:8080/health/ready'],
  ['prometheus', 'http://127.0.0.1:9090/-/ready'],
  ['loki', 'http://127.0.0.1:3100/ready'],
  ['tempo', 'http://127.0.0.1:3200/ready'],
  ['grafana', 'http://127.0.0.1:3000/api/health'],
];

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

console.log(JSON.stringify({ status: 'passed', grafana: 'http://127.0.0.1:3000' }));
