module.exports = {
  globals: {
    'ts-jest': {
      diagnostics: false
    }
  },
  preset: 'ts-jest',
  transform: {
    "^.+\\.tsx?$": "ts-jest",
  },
  testEnvironment: 'node',
  "testPathIgnorePatterns": [
    "/node_modules/",
    "/__utils",
    "<rootDir>/tests/helpers",
  ],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  testMatch: ["**/functional/**/*.ts", "**/units/**/*.ts"],
  // "setupTestFrameworkScriptFile": "<rootDir>/setupTests.js"
};