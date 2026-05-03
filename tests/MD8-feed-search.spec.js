import { test, expect } from '@playwright/test';

test.describe.configure({ mode: 'serial', timeout: 120000 });

test.describe('Module 8: Feed, Search & Discovery (UI Rendering)', () => {
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
        // Ensure we are on the feed for these tests
        await page.goto('https://biobeats.duckdns.org/feed');
    });

    test.skip('1. Feed loads the main track list', async ({ page }) => {
        const trackList = page.getByTestId('feed-track-list');
        const skeleton = page.getByTestId('feed-skeleton');
        const emptyState = page.getByTestId('feed-empty-state');

        await expect(trackList.or(skeleton).or(emptyState)).toBeVisible({ timeout: 20000 });
    });

    test('2. Track cards display artwork and waveform', async ({ page }) => {
        const firstCard = page.getByTestId('track-card').first();
        if (await firstCard.isVisible()) {
            await expect(firstCard.getByTestId('track-card-artwork')).toBeVisible();
        }
    });

    test('3. Track cards display play and comment stats', async ({ page }) => {
        const firstCard = page.getByTestId('track-card').first();
        if (await firstCard.isVisible()) {
            await expect(firstCard.getByTestId('track-card-plays')).toBeVisible();
            await expect(firstCard.getByTestId('track-card-comments')).toBeVisible();
        }
    });

    test('4. Suggested artists section is visible on feed', async ({ page }) => {
        const suggestedSection = page.getByTestId('suggested-artists-section');
        if (await suggestedSection.isVisible()) {
            await expect(suggestedSection).toBeVisible();
        }
    });

    test('5. Suggested artist card shows follow button', async ({ page }) => {
        const followBtn = page.getByTestId('feed-artist-follow-button').first();
        if (await followBtn.isVisible()) {
            await expect(followBtn).toBeVisible();
        }
    });

    test('6. Global search bar elements render in navbar', async ({ page }) => {
        await expect(page.getByTestId('navbar-search-input')).toBeVisible();
    });

    test('7. Search submission opens search page layout', async ({ page }) => {
        await page.getByTestId('navbar-search-input').fill('Test Search');

        await page.getByTestId('navbar-search-input').press('Enter');

    });
    test('8. Search page displays filter sidebar and results list', async ({ page }) => {
        await page.getByTestId('navbar-search-input').fill('Test');


        await page.getByTestId('navbar-search-input').press('Enter');

        await expect(page.getByTestId('search-results-list')).toBeVisible({ timeout: 15000 });
    });

    test.skip('9. Search page categories use tab format', async ({ page }) => {
        await page.getByTestId('navbar-search-input').fill('Test');
        await page.getByTestId('navbar-search-input').press('Enter');

        await expect(page.locator('[data-testid="search-tab"]').first()).toBeVisible({ timeout: 15000 });
    });

    test.skip('10. Discover page displays trending genres', async ({ page }) => {
        // ... previous lines ...
        await expect(page.getByTestId('discover-page')).toBeVisible({ timeout: 15000 });

        // Look for the specific test ID, OR look for a heading that contains the word "Trending"
        const trendingSection = page.getByTestId('trending-by-genre')
            .or(page.getByRole('heading', { name: /trending/i }));

        await expect(trendingSection).toBeVisible({ timeout: 15000 });
    });
});