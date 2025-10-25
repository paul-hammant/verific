module.exports = {
  testEnvironment: 'node',
  testMatch: [
    '**/ocr-hash.test.js',
    '**/cv-geometry.test.js',
    '**/detectSquares.node.test.js',
    '**/app-logic.test.js'
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/e2e/',
    '/_site/',
    '/test-results/'
  ],
  collectCoverageFrom: [
    '*.js',
    '!jest.config.js',
    '!webpack.config.js'
  ]
};
