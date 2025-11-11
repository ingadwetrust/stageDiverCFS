module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.test.ts',
    '!src/__tests__/**',
    '!src/seed.ts',
    '!src/index.ts'
  ],
  coveragePathIgnorePatterns: ['/node_modules/', '/dist/'],
  setupFiles: ['<rootDir>/src/__tests__/jest.setup.js'],
  testEnvironmentOptions: {
    NODE_ENV: 'test'
  },
  maxWorkers: 1,
  testTimeout: 30000
};

