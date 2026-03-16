import { test, expect } from '@playwright/test';
import { AUTH_SELECTORS as S } from '../selectors/auth.js';
import { loginAs, registerUser } from '../helpers/auth-helper.js';
import { VALID_USER, INVALID_EMAILS, WEAK_PASSWORDS } from '../helpers/test-data.js';
