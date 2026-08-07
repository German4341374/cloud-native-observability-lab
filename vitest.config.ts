import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary'],
      include: ['src/{slo,redaction}.ts'],
      thresholds: { lines: 90, functions: 90, statements: 90, branches: 85 },
    },
  },
});
