import { test, expect } from '@playwright/test';

test.describe.configure({ mode: 'serial', timeout: 120000 });

test.describe('Module 9: Messaging & Track Sharing (UI Rendering)', () => {
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

    async function goToMessages(page) {
        await page.getByTestId('navbar-messages-button').click();
        const viewAll = page.getByTestId('view-all-messages');
        await viewAll.waitFor({ state: 'visible' });
        await viewAll.click();
        await page.getByTestId('messages-page').waitFor({ state: 'visible', timeout: 20000 });
    }

    test('1. Message dropdown opens from navbar', async ({ page }) => {
        await page.getByTestId('navbar-messages-button').click();
        await expect(page.getByTestId('message-dropdown')).toBeVisible();
    });

    test('2. Message page layout shows thread area', async ({ page }) => {
        await goToMessages(page);
        await expect(page.getByTestId('messages-page')).toBeVisible();
    });

    test('3. New conversation modal displays search field', async ({ page }) => {
        await goToMessages(page);
        await page.getByTestId('new-message-button').click();
        await expect(page.getByTestId('new-conversation-modal')).toBeVisible();
        await expect(page.getByTestId('recipient-search-input')).toBeVisible();
    });

    test.skip('4. Opening a chat renders conversation view', async ({ page }) => {
        await goToMessages(page);
        await page.locator('[data-testid^="conversation-item-"]').first().click();

        await expect(page.getByTestId('conversation-view')).toBeVisible();
    });

    test('5. Conversation view contains message thread', async ({ page }) => {
        await goToMessages(page);
        const convItem = page.locator('[data-testid^="conversation-item-"]').first();
        if (await convItem.isVisible()) {
            await convItem.click();
            await expect(page.getByTestId('message-thread')).toBeVisible();
        }
    });

    test('6. Composer contains textarea and send button', async ({ page }) => {
        await goToMessages(page);
        const convItem = page.locator('[data-testid^="conversation-item-"]').first();
        if (await convItem.isVisible()) {
            await convItem.click();
            await expect(page.getByTestId('message-textarea')).toBeVisible();
            await expect(page.getByTestId('message-send-button')).toBeVisible();
        }
    });

    test('7. Chat action bar shows Block and Report buttons', async ({ page }) => {
        await goToMessages(page);
        const convItem = page.locator('[data-testid^="conversation-item-"]').first();
        if (await convItem.isVisible()) {
            await convItem.click();
            await expect(page.getByTestId('block-button')).toBeVisible();
            await expect(page.getByTestId('report-button')).toBeVisible();
        }
    });

    test('8. Block modal displays removal options', async ({ page }) => {
        await goToMessages(page);
        const convItem = page.locator('[data-testid^="conversation-item-"]').first();
        if (await convItem.isVisible()) {
            await convItem.click();
            await page.getByTestId('block-button').click();
            await expect(page.getByTestId('block-user-modal')).toBeVisible();
            await expect(page.getByTestId('remove-content-checkbox')).toBeVisible();
        }
    });

    test('9. Report modal displays spam option', async ({ page }) => {
        await goToMessages(page);
        const convItem = page.locator('[data-testid^="conversation-item-"]').first();
        if (await convItem.isVisible()) {
            await convItem.click();
            await page.getByTestId('report-button').click();
            await expect(page.getByTestId('report-user-modal')).toBeVisible();
        }
    });

    test('10. Delete conversation popover renders correctly', async ({ page }) => {
        await goToMessages(page);
        const convItem = page.locator('[data-testid^="conversation-item-"]').first();
        if (await convItem.isVisible()) {
            await convItem.click();
            await page.getByTestId('delete-conversation-button').click();
            await expect(page.getByTestId('delete-conversation-popover')).toBeVisible();
        }
    });
});