# Five-Minute Demonstration

1. Run `docker compose up --build --detach` and `node scripts/smoke.mjs`.
2. Open Grafana at `http://127.0.0.1:3000`; no login is required in the isolated demo.
3. Run `node scripts/failure-demo.mjs` to create normal, slow, error, and timeout requests.
4. Show request rate, P95 latency, error rate, and bounded failure labels.
5. Open a structured gateway log and follow its trace ID into Tempo.
6. Explain why request ID is useful in logs but dangerous as a Prometheus label.
7. Finish with `docker compose down --volumes --remove-orphans`.
