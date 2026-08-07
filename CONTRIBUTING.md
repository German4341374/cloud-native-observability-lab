# Contributing

Use Node.js 24 and Conventional Commits. Run `npm ci` and `npm run check` before opening a pull
request. Validate dashboard JSON, Prometheus rules, and the full Compose stack when changing signal
pipelines. New metric labels must have bounded cardinality and a documented operational purpose.
