require('dotenv').config();
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  fullyParallel: true,
  reporter: 'html',
   workers: 1,
  
  // ---> NEW: This line tells Playwright to run your login script BEFORE any tests start
  globalSetup: require.resolve('./global-setup'),

  use: {
    baseURL: process.env.BASE_URL,
    trace: 'on-first-retry',
    
    // ---> NEW: This line tells all tests to use the VIP wristband (tokens) saved by the setup script
    storageState: 'storageState.json',
    launchOptions: {
    slowMo: 4000,
  },
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});