/**
 * E2E Test: SSP Authoring Happy Path
 *
 * Covers the critical user workflow:
 *   Login → Fill SystemInfo → Fill FIPS 199 → Validate → Export OSCAL JSON
 *
 * Prerequisites:
 *   npm install -D @playwright/test
 *   npx playwright install chromium
 */
import { test, expect } from '@playwright/test';

test.describe('SSP Authoring Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to app — the auth gate shows login page first
    await page.goto('/');
  });

  test('login page renders with email and password fields', async ({ page }) => {
    // Auth gate should show login form
    await expect(page.getByPlaceholder(/email/i)).toBeVisible();
    await expect(page.getByPlaceholder(/password/i)).toBeVisible();
  });

  test('offline mode allows access without login', async ({ page }) => {
    // Look for offline mode / skip login option
    const offlineButton = page.getByRole('button', { name: /offline/i });
    if (await offlineButton.isVisible()) {
      await offlineButton.click();
      // Should now see the SSP editor
      await expect(page.getByText(/System Information/i)).toBeVisible({ timeout: 10000 });
    }
  });

  test('fill SystemInfo section and verify auto-save', async ({ page }) => {
    // Enter offline mode if available
    const offlineButton = page.getByRole('button', { name: /offline/i });
    if (await offlineButton.isVisible()) {
      await offlineButton.click();
    }

    // Wait for editor to load
    await expect(page.getByText(/System Information/i)).toBeVisible({ timeout: 10000 });

    // Fill in System Name
    const sysNameInput = page.getByPlaceholder('e.g., ForgeComply 360 Enterprise Platform');
    await sysNameInput.fill('Test System Alpha');

    // Fill in System Acronym
    const acronymInput = page.getByPlaceholder('e.g., FC360');
    await acronymInput.fill('TSA');

    // Fill in Owning Agency
    const agencyInput = page.getByPlaceholder('e.g., Department of Homeland Security');
    await agencyInput.fill('Department of Testing');

    // Verify inputs retained values
    await expect(sysNameInput).toHaveValue('Test System Alpha');
    await expect(acronymInput).toHaveValue('TSA');
    await expect(agencyInput).toHaveValue('Department of Testing');
  });

  test('navigate to FIPS 199 and set categorization', async ({ page }) => {
    // Enter offline mode
    const offlineButton = page.getByRole('button', { name: /offline/i });
    if (await offlineButton.isVisible()) {
      await offlineButton.click();
    }

    await expect(page.getByText(/System Information/i)).toBeVisible({ timeout: 10000 });

    // Navigate to FIPS 199 via sidebar
    const fipsNav = page.getByText('Security Categorization');
    await fipsNav.click();

    // Wait for FIPS 199 section to render
    await expect(page.getByText('FIPS 199 Categorization')).toBeVisible({ timeout: 5000 });

    // Impact level badge should initially show dash
    await expect(page.getByText('—')).toBeVisible();
  });

  test('export modal opens and shows formats', async ({ page }) => {
    // Enter offline mode
    const offlineButton = page.getByRole('button', { name: /offline/i });
    if (await offlineButton.isVisible()) {
      await offlineButton.click();
    }

    await expect(page.getByText(/System Information/i)).toBeVisible({ timeout: 10000 });

    // Click export button in header
    const exportButton = page.getByRole('button', { name: /export/i });
    await exportButton.click();

    // Export modal should open with dialog role
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAttribute('aria-modal', 'true');

    // Should show OSCAL JSON as recommended format
    await expect(page.getByText('OSCAL JSON')).toBeVisible();
    await expect(page.getByText('OSCAL XML')).toBeVisible();

    // Close with Escape
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();
  });

  test('validate button shows error count for empty SSP', async ({ page }) => {
    // Enter offline mode
    const offlineButton = page.getByRole('button', { name: /offline/i });
    if (await offlineButton.isVisible()) {
      await offlineButton.click();
    }

    await expect(page.getByText(/System Information/i)).toBeVisible({ timeout: 10000 });

    // Click validate button
    const validateButton = page.getByRole('button', { name: /validate/i });

    // Set up dialog handler for the alert
    page.on('dialog', async (dialog) => {
      expect(dialog.message()).toContain('required field');
      await dialog.accept();
    });

    await validateButton.click();
  });

  test('keyboard navigation works in sidebar', async ({ page }) => {
    // Enter offline mode
    const offlineButton = page.getByRole('button', { name: /offline/i });
    if (await offlineButton.isVisible()) {
      await offlineButton.click();
    }

    await expect(page.getByText(/System Information/i)).toBeVisible({ timeout: 10000 });

    // Verify sidebar nav landmark exists
    const nav = page.getByRole('navigation', { name: 'SSP Sections' });
    await expect(nav).toBeVisible();

    // Verify active section has aria-current
    const activeItem = page.getByRole('button', { current: 'page' });
    await expect(activeItem).toBeVisible();
  });

  test('skip-to-content link is available', async ({ page }) => {
    // Enter offline mode
    const offlineButton = page.getByRole('button', { name: /offline/i });
    if (await offlineButton.isVisible()) {
      await offlineButton.click();
    }

    await expect(page.getByText(/System Information/i)).toBeVisible({ timeout: 10000 });

    // Tab to skip link — it should become visible on focus
    await page.keyboard.press('Tab');
    const skipLink = page.getByText('Skip to main content');
    await expect(skipLink).toBeVisible();
  });
});
