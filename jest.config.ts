export default {
  preset: "ts-jest",
  testEnvironment: "node",
  setupFilesAfterEnv: ["<rootDir>/src/tests/setup.ts"],
  testMatch: ["<rootDir>/src/**/*.test.ts"],
  maxWorkers: 1,
  testTimeout: 120000
};