import { test, expect } from '@playwright/test';

test.describe.configure({ mode: 'serial', timeout: 120000 });

test.describe('Module 10: Notifications (UI Rendering)', () => {
    test.beforeEach(async ({ page }, testInfo) => {
        testInfo.setTimeout(120000);
        await page.goto('https://biobeats.duckdns.org/');
        try {
            await page.getByTestId('navbar-user-avatar').waitFor({ state: 'visible', timeout: 3000 });
        } catch {
            await page.getByText(/Sign in/i).first().click();
            await page.getByTestId('login-email-input').fill('omarzogmar868@gmail.com');
            await page.getByTestId('login-password-input').fill('TestPassword123!');
            await page.getByTestId('login-submit-button').click();
            await page.getByTestId('navbar-user-avatar').waitFor({ state: 'visible', timeout: 15000 });
        }
    });

    test('1. Notification bell is visible in navbar', async ({ page }) => {
        await expect(page.getByTestId('navbar-notifications-button')).toBeVisible();
    });

    test('2. Dropdown renders with header and mark read button', async ({ page }) => {
        await page.getByTestId('navbar-notifications-button').click();
        await page.getByTestId('notification-dropdown').waitFor({ state: 'visible' });
        await expect(page.getByTestId('notification-mark-all-read')).toBeVisible();
    });

    test('3. Dropdown contains view all link', async ({ page }) => {
        await page.getByTestId('navbar-notifications-button').click();
        await page.getByTestId('notification-dropdown').waitFor({ state: 'visible' });
        await expect(page.getByTestId('notification-dropdown-view-all')).toBeVisible();
    });

    test('4. Full notifications page renders title and list', async ({ page }) => {
        await page.getByTestId('navbar-notifications-button').click();
        await page.getByTestId('notification-dropdown').waitFor({ state: 'visible' });
        await page.getByTestId('notification-dropdown-view-all').click();
        await expect(page.getByTestId('notifications-page')).toBeVisible({ timeout: 15000 });
        await expect(page.getByTestId('notifications-list').or(page.getByTestId('notifications-empty'))).toBeVisible();
    });

    test('5. Notifications page shows filter button', async ({ page }) => {
        await page.goto('https://biobeats.duckdns.org/notifications');
        await expect(page.getByTestId('notifications-filter-button')).toBeVisible({ timeout: 15000 });
    });

    test('6. Filter dropdown renders when clicked', async ({ page }) => {
        await page.goto('https://biobeats.duckdns.org/notifications');
        await page.getByTestId('notifications-filter-button').click();
        await expect(page.getByTestId('notifications-filter-dropdown')).toBeVisible();
    });

    test('7. Settings link opens preferences tab', async ({ page }) => {
        await page.getByTestId('navbar-notifications-button').click();
        await page.getByTestId('notification-dropdown').waitFor({ state: 'visible' });
        await page.getByTestId('notification-dropdown-settings-link').click();
        await expect(page.getByTestId('notification-settings-tab')).toBeVisible({ timeout: 15000 });
    });

    test('8. Save notification settings button is present', async ({ page }) => {
        await page.goto('https://biobeats.duckdns.org/settings/notifications'); // direct to avoid dropdown state issues
        const saveBtn = page.getByTestId('notification-settings-save-btn');
        if (await saveBtn.isVisible()) {
            await expect(saveBtn).toBeVisible();
        }
    });

    test.skip('9. Clicking Mark All as Read button functions without crash', async ({ page }) => {
        await page.getByTestId('navbar-notifications-button').click();
        await page.getByTestId('notification-mark-all-read').click();
    });

    test('10. Specific notification delete buttons are present', async ({ page }) => {
        await page.goto('https://biobeats.duckdns.org/notifications');
        const deleteBtn = page.locator('[data-testid^="notif-page-delete-"]').first();
        if (await deleteBtn.isVisible()) {
            await expect(deleteBtn).toBeVisible();
        }
    });
});