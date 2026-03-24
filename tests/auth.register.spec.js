// =============================================================================
// auth.register.spec.js — Category 1 Tests Only
// Tests real app logic: duplicate email rejection, success flow, navigation
// Removed: field structure checks (Cat 2), CAPTCHA flows (Cat 3),
//          client-side validation (Cat 2 - app-input-error testid missing)
// =============================================================================

import { test, expect } from '@playwright/test';

test.use({ storageState: { cookies: [], origins: [] } });

async function goToRegister(page) {
  await page.goto('/register');
  await expect(page.getByTestId('register-form')).toBeVisible();
}

function uniqueEmail() {
  return `test_${Date.now()}@biobeats-playwright.com`;
}

async function fillRegisterForm(page, {
  displayName = 'Test User',
  email       = uniqueEmail(),
  password    = 'ValidPass123!',
  confirm     = 'ValidPass123!',
} = {}) {
  await page.getByTestId('register-displayname-input').fill(displayName);
  await page.getByTestId('register-email-input').fill(email);
  await page.getByTestId('register-password-input').fill(password);
  await page.getByTestId('register-confirm-input').fill(confirm);
}

async function captchaIsPresent(page) {
  const recaptcha = await page.locator('iframe[src*="recaptcha"]').count();
  const hcaptcha  = await page.locator('iframe[src*="hcaptcha"]').count();
  return recaptcha > 0 || hcaptcha > 0;
}

async function submitWithCaptcha(page) {
  if (await captchaIsPresent(page)) {
    console.log('⏸  CAPTCHA detected — solve it manually then click Resume in the Playwright inspector.');
    await page.pause(); // freezes test — you solve CAPTCHA — then click Resume
  }
  await page.getByTestId('register-submit-button').click();
}

// ---------------------------------------------------------------------------
// Duplicate Email — backend must reject it (real DB logic)
// ---------------------------------------------------------------------------
test.describe('Register — Duplicate Email', () => {

  test('rejects registration with an already-registered email', async ({ page }) => {
    await goToRegister(page);
    await fillRegisterForm(page, { email: process.env.TEST_USER_EMAIL });
    await submitWithCaptcha(page);

    // Error renders as a banner — no data-testid on it, so we match by text
    await expect(page.getByText(/already be in use/i)).toBeVisible({ timeout: 10_000 });
  });
});

// ---------------------------------------------------------------------------
// Happy Path — real registration flow end-to-end
// Requires CAPTCHA disabled in test environment
// ---------------------------------------------------------------------------
test.describe('Register — Happy Path', () => {

  test('shows success message after valid registration', async ({ page }) => {
    await goToRegister(page);
    await fillRegisterForm(page);
    await submitWithCaptcha(page);
    await expect(page.getByTestId('register-success')).toBeVisible({ timeout: 15_000 });
  });

  test('form is replaced by success state after registration', async ({ page }) => {
    await goToRegister(page);
    await fillRegisterForm(page);
    await submitWithCaptcha(page);
    await expect(page.getByTestId('register-success')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId('register-form')).not.toBeVisible();
  });

  test('back-to-signin button navigates to /login after registration', async ({ page }) => {
    await goToRegister(page);
    await fillRegisterForm(page);
    await submitWithCaptcha(page);
    await expect(page.getByTestId('register-back-to-signin-btn')).toBeVisible({ timeout: 15_000 });
    await page.getByTestId('register-back-to-signin-btn').click();
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });
  });
});
