import { AUTH_SELECTORS as S } from '../selectors/auth.js';

export async function loginAs(page, email, password) {
  await page.goto('/login');
  await page.fill(S.emailInput, email);
  await page.fill(S.passwordInput, password);
  await page.click(S.submitBtn);
  await page.waitForSelector(S.userAvatar);  // confirms login succeeded
}

export async function registerUser(page, { username, email, password }) {
  await page.goto('/register');
  await page.fill(S.usernameInput, username);
  await page.fill(S.emailInput, email);
  await page.fill(S.passwordInput, password);
  await page.fill(S.confirmPasswordInput, password);
  await page.click(S.submitBtn);
}