# Repository Guidance

- Keep all project text in English.
- Never add an unbounded value such as user ID, URL, or trace ID as a metric label.
- Redact credentials and personal data before logging or adding span attributes.
- Keep controlled failures deterministic and disabled outside the local demo.
- Run `npm run check` and validate the telemetry configuration before committing.
