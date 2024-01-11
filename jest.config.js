module.exports = {
  roots: ['<rootDir>'],
  testMatch: ['**/test/**.test.ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  verbose: true,
  globals: {
    'ts-jest': {
      diagnostics: false,
    },
  },
  testTimeout: 60000,
}
