const { chromium } = require('@playwright/test');
require('dotenv').config();

module.exports = async () => {
  const browser = await chromium.launch({ headless: false }); // Temporarily set to false so you can watch it
  const page = await browser.newPage();

  await page.goto(process.env.BASE_URL + '/login');
  await page.waitForLoadState('networkidle');

  await page.getByTestId('login-email-input').fill(process.env.TEST_USER_EMAIL);
  await page.getByTestId('login-password-input').fill(process.env.TEST_USER_PASSWORD);
  await page.getByTestId('login-submit-button').click();

  // We removed the flaky waitForResponse. 
  // Now we strictly wait for the main navigation bar to render, proving we are in.
  await page.waitForSelector('[data-testid="navbar"]', { timeout: 20000 });
  
  await page.context().storageState({ path: 'storageState.json' });
  await browser.close();
  console.log('Session saved.');
};