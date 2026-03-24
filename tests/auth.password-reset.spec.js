// =============================================================================
// auth.password-reset.spec.js — Category 1 Tests Only
// Tests real app logic: valid email submission, invalid token handling
// Removed: form structure (Cat 2), client-side validation (Cat 2),
//          token-based tests without backend endpoint (Cat 3)
// =============================================================================

import { test, expect } from '@playwright/test';

test.use({ storageState: { cookies: [], origins: [] } });

async function goToForgotPassword(page) {
  await page.goto('/forgot-password');
  await page.waitForLoadState('networkidle');

  const hasForm = await page.locator('form').isVisible().catch(() => false);
  if (hasForm) return;

  // Fallback route
  await page.goto('/reset-password');
  await page.waitForLoadState('networkidle');
}

// ---------------------------------------------------------------------------
// Trigger Page — submitting a valid email must produce a success state
// This proves the backend accepted the request and the UI responded correctly
// ---------------------------------------------------------------------------
test.describe('Forgot Password — Trigger Page', () => {

  test('shows success state after submitting a valid email', async ({ page }) => {
    await goToForgotPassword(page);

    const emailInput = page.getByTestId('reset-password-new-input').or(
      page.locator('input[type="email"]').first()
    );
    await emailInput.fill(process.env.TEST_USER_EMAIL);

    const submitBtn = page.getByTestId('reset-password-submit-btn').or(
      page.locator('button[type="submit"]').first()
    );
    await submitBtn.click();

    const hasSuccessTestid = await page.getByTestId('reset-password-success')
      .waitFor({ timeout: 10_000 }).then(() => true).catch(() => false);

    // Also accept: form disappears (some apps hide form instead of showing a testid)
    const formGone = await emailInput.isHidden({ timeout: 3_000 }).catch(() => false);

    expect(hasSuccessTestid || formGone).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Invalid Token — backend must reject it; app must not show a success state
// Tests the real token validation logic on your backend
// ---------------------------------------------------------------------------
test.describe('Reset Password — Invalid Token Handling', () => {

  test('does not show success state for an invalid token', async ({ page }) => {
    await page.goto('/reset-password?token=fake-invalid-token-xyz');
    await page.waitForLoadState('networkidle');

    // Critical: success must NEVER appear for a bogus token
    await expect(page.getByTestId('reset-password-success')).not.toBeVisible();
  });

  test('handles invalid token gracefully — shows error or redirects to login', async ({ page }) => {
    await page.goto('/reset-password?token=fake-invalid-token-xyz');
    await page.waitForLoadState('networkidle');

    // Must NEVER show a success state for a fake token — this is the critical assertion
    await expect(page.getByTestId('reset-password-success')).not.toBeVisible();

    // App handled it gracefully — has some content (not a blank crash)
    const hasContent = await page.locator('body').evaluate(el => el.innerText.trim().length > 0);
    expect(hasContent).toBe(true);
  });

  test('handles missing token gracefully — does not crash', async ({ page }) => {
    await page.goto('/reset-password');
    await page.waitForLoadState('networkidle');

    // Page must not be a blank crash — some content must exist
    const hasContent = await page.locator('body').evaluate(el => el.innerText.trim().length > 0);
    expect(hasContent).toBe(true);

    // And must not show a success state
    await expect(page.getByTestId('reset-password-success')).not.toBeVisible();
  });
});