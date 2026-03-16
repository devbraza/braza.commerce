import type { Config } from 'jest';

const config: Config = {
  testEnvironment: 'jsdom',
  testRegex: '.*\\.test\\.tsx?$',
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@brazachat/shared$': '<rootDir>/../shared/src',
  },
};

export default config;
