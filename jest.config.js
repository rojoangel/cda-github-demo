module.exports = {
  testEnvironment: "node",
  testMatch: ["**/test/**/*.test.ts"],
  transform: {
    "^.+\\.ts$": ["<rootDir>/node_modules/ts-jest", { isolatedModules: true }],
  },
};
