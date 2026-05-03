require('dotenv').config();
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  fullyParallel: false,
  reporter: 'html',
  workers: 1,

  // Runs global-setup.js once before all tests — logs in and saves storageState.json
  globalSetup: require.resolve('./global-setup'),

  use: {
    baseURL: process.env.BASE_URL,
    trace: 'on-first-retry',

    // All tests load the saved session — no login needed per test
    storageState: 'storageState.json',

    launchOptions: {
      slowMo: 500,
    },
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
