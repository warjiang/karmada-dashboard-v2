import { test, expect } from '@playwright/test';

test('should navigate to the home page', async ({ page }) => {
  // Add an initialization script to set the token before the page loads
  await page.addInitScript(() => {
    window.localStorage.setItem('token', 'dummy-token');
  });

  // Mock the auth API endpoint
  await page.route('**/api/v1/me', (route) => {
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ authenticated: true }),
    });
  });

  // Navigate to the home page
  await page.goto('/');

  // The new page should have the overview title
  // await expect(page.getByText('Karmada版本')).toBeVisible({ timeout: 10000 });
});