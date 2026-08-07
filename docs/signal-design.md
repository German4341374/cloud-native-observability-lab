# Signal Design

## Metrics

Request counters and duration histograms use bounded labels: service, route template, method, and
status class. Request IDs, customer IDs, raw URLs, and trace IDs are intentionally excluded because
they would create unbounded series cardinality.

## Traces

The gateway and dependency export OTLP spans through one collector. HTTP instrumentation propagates
W3C Trace Context, while manual spans identify the dependency operation and controlled failure
mode. The trace ID is injected into structured application logs so Grafana can navigate from Loki
to Tempo.

## Logs

Pino writes structured JSON. Authorization and cookie headers are redacted at the logger boundary.
Alloy reads only containers carrying `observability.logs=true` and sends those streams to Loki.

## SLO model

The example availability target is 99.5%, leaving a 0.5% error budget. Burn rate divides observed
error rate by that budget. A fast burn alone is noisy, so paging requires both a fast and slow
window. The included TypeScript functions make the calculation independently testable.

## Retention and cost

Local trace retention is 24 hours. Metrics and logs use local volumes and are removed by
`make clean`. A production design must size retention from query needs, ingestion rate, legal
requirements, and budget rather than copying these demo values.
