import { defineConfig } from 'vitest/config';
import { WxtVitest } from 'wxt/testing/vitest-plugin';

export default defineConfig({
  // Resolves ~/, ~~/ and #imports like the extension build, with an in-memory fake `browser`.
  plugins: [WxtVitest()],
  test: {
    include: ['tests/unit/**/*.test.ts'],
  },
});
