import { test, expect } from '@playwright/test';

test.describe('Module 1: Authentication — Social Logins', () => {

  test('Google Sign-In button correctly initiates the Google OAuth flow', async ({ page }) => {
    // 1. Go to your app
    await page.goto('/');
    
    // Click to open the register/login area
    await page.getByTestId('hero-create-account-btn').click();

    // 2. Prepare to catch the redirect
    // We tell Playwright: "Watch the browser, it is about to leave our app and go to Google."
    const navigationPromise = page.waitForNavigation({ url: /accounts\.google\.com/ });

    // 3. Click your Google login button
    await page.getByTestId('register-google-btn').click();

    // 4. Wait for the redirect to happen
    await navigationPromise;

    // =====================================================================
    // ASSERTIONS: Proving the integration works without actually logging in
    // =====================================================================
    
    // A. Verify the browser actually made it to Google's secure servers
    await expect(page).toHaveURL(/accounts\.google\.com/);

    // B. Security Check: Verify your app sent its specific Client ID to Google.
    // I pulled this client_id directly from that massive URL you recorded!
    const currentUrl = page.url();
    expect(currentUrl).toContain('client_id=718123581836');
  });

});