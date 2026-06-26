import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: { environment: 'jsdom', setupFiles: ['./tests/setup.ts'], include: ['tests/unit/**/*.test.{ts,tsx}'] },
});
