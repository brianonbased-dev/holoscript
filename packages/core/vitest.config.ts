import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Use forks to avoid memory issues with workers
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
    // Increase timeout for slower tests
    testTimeout: 30000,
    // Clear mocks between tests
    clearMocks: true,
    // Coverage settings
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
});
