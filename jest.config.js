module.exports = {
  "roots": [
    "<rootDir>/src"
  ],
  "testMatch": [
    "**/?(*.)+(spec|test).+(ts|tsx|js)"
  ],
  "transform": {
    "^.+\\.(ts|tsx)$": [
      "ts-jest"
    ]
  },
  "reporters": [
    "default",
    ["jest-junit", { outputDirectory: "test-reports" }]
  ],
  "runner": "groups"
}