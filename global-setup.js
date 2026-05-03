const { chromium } = require('@playwright/test');
require('dotenv').config();

module.exports = async () => {
  const browser = await chromium.launch({ headless: true }); // Use headless mode for CI
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('--- Starting Pro Login Sequence ---');
  await page.goto('https://biobeats.duckdns.org/login');

  // Use your Pro credentials
  await page.getByTestId('login-email-input').fill('omarzogmar868@gmail.com');
  await page.getByTestId('login-password-input').fill('TestPassword123!');
  await page.getByTestId('login-submit-button').click();

  // 1. Wait for the avatar to appear initially
  await page.getByTestId('navbar-user-avatar').waitFor({ state: 'visible', timeout: 15000 });

  // 2. FORCE REFRESH to make sure the session is actually saved in the browser cookies
  await page.reload();
  await page.waitForLoadState('load');

  await page.getByTestId('navbar-user-avatar').waitFor({ state: 'visible', timeout: 10000 }).catch(() => { });

  // 3. Final Check: If we are still logged in after a refresh, save the state
  if (await page.getByTestId('navbar-user-avatar').isVisible()) {
    await context.storageState({ path: 'storageState.json' });
    console.log('✅ PRO SESSION VERIFIED AND SAVED.');
  } else {
    throw new Error('❌ Login failed to persist after refresh!');
  }

  await browser.close();
};