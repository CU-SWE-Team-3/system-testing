import { test, expect } from '@playwright/test';

// Use the URL from your screenshot
const PROFILE_URL = '/profile/omar-walid-2';

test.describe('Module 2: Profile Customization & Updates', () => {

  // =====================================================================
  // SETUP: Authenticate 
  // =====================================================================
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.goto('/login'); 
    await page.getByTestId('login-email-input').fill('omarzogmar868@gmail.com');
    await page.getByTestId('login-password-input').fill('OmarTest123!');
    await page.getByTestId('login-submit-button').click();
    await expect(page.getByTestId('navbar')).toBeVisible({ timeout: 15_000 });
  });

  // =====================================================================
  // TEST: Complete Profile Update Flow
  // =====================================================================
  test('User can successfully update avatar, location, bio, and social links', async ({ page }) => {
    
    // 1. Navigate to Profile
    await page.getByTestId('navbar-user-dropdown').click();
    await page.getByTestId('navbar-dropdown-profile').click();
    
    // 2. Open Edit Modal
    await page.getByTestId('profile-edit-button').click();
    
    // 3. Upload Image (Using the FileChooser Intercept)
    
    // Tell Playwright to watch for the OS file picker to open
    const fileChooserPromise = page.waitForEvent('filechooser');
    
    // Click the visual button
    await page.getByTestId('edit-profile-upload-image').click();
    
    // Grab the file picker and shove our image into it
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles('tests/fixtures/test-avatar.png');
    // 4. Update Location Data
    await page.getByTestId('edit-profile-city-input').fill('zamalek');
    await page.getByTestId('edit-profile-country-input').fill('egypt');
    
    // 5. Update Bio & Genres
    await page.getByTestId('edit-profile-bio-input').fill('cool_man');
    await page.getByTestId('edit-profile-genres-input').fill('hip hop');
    
    // 6. Add Social Link
    await page.getByRole('button', { name: 'Add link' }).click();
    const platformInput = page.getByRole('textbox', { name: 'Platform (twitter)' }).first();
    const urlInput = page.getByRole('textbox', { name: 'URL (https://...)' }).first();
    await platformInput.fill('Facebook');
    await urlInput.fill('https://www.facebook.com/omar.zogmar.5');
    
    // 7. Save the Profile
    await page.getByTestId('edit-profile-save-button').click();
    
    // =====================================================================
    // ASSERTIONS: Proving the test passed
    // =====================================================================
    await expect(page.getByTestId('profile-avatar')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId('profile-display-name')).toBeVisible();
    await expect(page.getByText('zamalek, egypt')).toBeVisible();
    await expect(page.getByText('cool_man')).toBeVisible();
    await expect(page.getByText('Facebook')).toBeVisible();
  });
});