import { AUTH_SELECTORS as S } from '../selectors/auth.js';

/**
 * Reusable helper: logs in a user through the UI.
 * Use at the start of any test that requires an authenticated session.
 */
export async function loginAs(page, email, password) {
  // Arrange
  await page.goto('/login');

  // Act
  await page.fill(S.emailInput, email);
  await page.fill(S.passwordInput, password);
  await page.click(S.submitBtn);

  // Assert — wait for avatar to confirm login succeeded
  await page.waitForSelector(S.userAvatar);
}

export async function registerUser(page, { username, email, password }) {
  // Arrange
  await page.goto('/register');

  // Act
  await page.fill(S.usernameInput, username);
  await page.fill(S.emailInput, email);
  await page.fill(S.passwordInput, password);
  await page.fill(S.confirmPasswordInput, password);
  await page.click(S.submitBtn);
}