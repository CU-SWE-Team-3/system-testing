export const AUTH_SELECTORS = {
  // Registration
  registerLink:       '[data-testid="register-link"]',
  emailInput:         '[data-testid="email-input"]',
  passwordInput:      '[data-testid="password-input"]',
  confirmPasswordInput: '[data-testid="confirm-password-input"]',
  usernameInput:      '[data-testid="username-input"]',
  submitBtn:          '[data-testid="submit-btn"]',
  captchaCheckbox:    '[data-testid="captcha-checkbox"]',
  verificationBanner: '[data-testid="verify-email-banner"]',
  errorMessage:       '[data-testid="error-message"]',
  successMessage:     '[data-testid="success-message"]',

  // Login
  loginLink:          '[data-testid="login-link"]',
  forgotPasswordLink: '[data-testid="forgot-password-link"]',
  googleLoginBtn:     '[data-testid="google-login-btn"]',
  logoutBtn:          '[data-testid="logout-btn"]',
  userAvatar:         '[data-testid="user-avatar"]',  // proves login worked

  // Password reset
  resetEmailInput:    '[data-testid="reset-email-input"]',
  resetSubmitBtn:     '[data-testid="reset-submit-btn"]',
  resetConfirmBanner: '[data-testid="reset-confirm-banner"]',
};