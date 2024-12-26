module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  testEnvironmentOptions: {
    html: '<!DOCTYPE html><html><head></head><body></body></html>'
  },
  moduleNameMapper: {
    '^src/(.*)$': '<rootDir>/src/$1',
    '^tests/(.*)$': '<rootDir>/tests/$1',
  },
};
