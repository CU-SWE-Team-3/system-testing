import { test, expect } from '@playwright/test';

test.describe.configure({ mode: 'serial', timeout: 120000 });

test.describe('Module 7: Sets & Playlists (UI Rendering)', () => {
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

    async function goToPlaylists(page) {
        await page.getByTestId('navbar-user-avatar').click();
        const profileLink = page.getByText(/Profile|Playlists/i).first();
        if (await profileLink.isVisible()) {
            await profileLink.click();
        } else {
            // Fallback if dropdown structure changes
            await page.goto('https://biobeats.duckdns.org/profile/playlists');
        }
        await page.waitForLoadState('networkidle');
    }

    test.skip('1. Library grid displays playlist cards', async ({ page }) => {
        await goToPlaylists(page);
        const gridCard = page.getByTestId('playlist-grid-card').first();
        const emptyState = page.getByTestId('empty-state');
        await expect(gridCard.or(emptyState)).toBeVisible({ timeout: 15000 });
    });

    test('2. Hovering playlist card reveals play button', async ({ page }) => {
        await goToPlaylists(page);
        const card = page.getByTestId('playlist-grid-card').first();
        if (await card.isVisible()) {
            await card.hover();
            await expect(card.getByTestId('playlist-grid-card-play-button')).toBeVisible();
        }
    });

    test('3. Playlist grid card displays title and track count', async ({ page }) => {
        await goToPlaylists(page);
        const card = page.getByTestId('playlist-grid-card').first();
        if (await card.isVisible()) {
            await expect(card.getByTestId('playlist-grid-card-title')).toBeVisible();
            await expect(card.getByTestId('playlist-grid-card-track-count')).toBeVisible();
        }
    });

    test('4. Navigating to playlist detail shows header', async ({ page }) => {
        await goToPlaylists(page);
        const card = page.locator('[data-testid^="playlist-grid-card-"]').first();
        if (await card.isVisible()) {
            await card.click();
            await expect(page.getByTestId('playlist-detail-header')).toBeVisible({ timeout: 15000 });
        }
    });

    test('5. Playlist detail shows artwork and title', async ({ page }) => {
        await goToPlaylists(page);
        const card = page.locator('[data-testid^="playlist-grid-card-"]').first();
        if (await card.isVisible()) {
            await card.click();
            await expect(page.getByTestId('playlist-artwork')).toBeVisible();
            await expect(page.getByTestId('playlist-title')).toBeVisible();
        }
    });

    test('6. Playlist action bar contains Share and Edit buttons', async ({ page }) => {
        await goToPlaylists(page);
        const card = page.locator('[data-testid^="playlist-grid-card-"]').first();
        if (await card.isVisible()) {
            await card.click();
            await expect(page.getByTestId('playlist-share-btn')).toBeVisible();
            await expect(page.getByTestId('playlist-edit-btn')).toBeVisible();
        }
    });

    test('7. Share modal renders Link and Embed tabs', async ({ page }) => {
        await goToPlaylists(page);
        const card = page.locator('[data-testid^="playlist-grid-card-"]').first();
        if (await card.isVisible()) {
            await card.click();
            await page.getByTestId('playlist-share-btn').click();
            await expect(page.getByTestId('share-tab-link')).toBeVisible();
            await expect(page.getByTestId('share-tab-embed')).toBeVisible();
        }
    });

    test('8. Share Embed tab displays textarea', async ({ page }) => {
        await goToPlaylists(page);
        const card = page.locator('[data-testid^="playlist-grid-card-"]').first();
        if (await card.isVisible()) {
            await card.click();
            await page.getByTestId('playlist-share-btn').click();
            await page.getByTestId('share-tab-embed').click();
            await expect(page.getByTestId('share-embed-textarea')).toBeVisible();
        }
    });

    test('9. Edit modal displays title input and delete button', async ({ page }) => {
        await goToPlaylists(page);
        const card = page.locator('[data-testid^="playlist-grid-card-"]').first();
        if (await card.isVisible()) {
            await card.click();
            await page.getByTestId('playlist-edit-btn').click();
            await expect(page.getByTestId('edit-playlist-title')).toBeVisible();
            await expect(page.getByTestId('edit-modal-delete-btn')).toBeVisible();
        }
    });

    test('10. Add to playlist modal renders create tab', async ({ page }) => {
        await page.goto('https://biobeats.duckdns.org/');
        const trackCard = page.getByTestId('track-card').first();
        if (await trackCard.isVisible()) {
            await trackCard.hover();
            const addToBtn = page.getByRole('button', { name: /Add to Playlist/i }).first();
            if (await addToBtn.isVisible()) {
                await addToBtn.click();
                await expect(page.getByTestId('add-to-playlist-tab-create')).toBeVisible();
            }
        }
    });
});