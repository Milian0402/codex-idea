import { expect, test } from '@playwright/test';

test('guided scenario happy path reaches artifact output', async ({ page }) => {
  await page.goto('/');

  await page.getByLabel('Scenario switcher').selectOption('workflow-ui');
  await page.getByRole('button', { name: 'Mark Plan Complete' }).click();
  await page.getByRole('button', { name: 'Generate Preview' }).click();

  await expect(page.getByRole('heading', { name: 'Preview Explanation' })).toBeVisible();

  await page.getByRole('button', { name: 'Approve Build' }).click();

  await expect(page.getByText(/simulation complete/i)).toBeVisible({ timeout: 15000 });
  await expect(page.locator('.completion')).toContainText(/ready to execute for real/i);
  await expect(page.getByRole('heading', { name: 'Approval Artifact' })).toBeVisible();

  const deepLink = page.locator('#share-url');
  await expect(deepLink).toHaveValue(/\?state=/);
  await expect(page.getByRole('button', { name: 'Export Artifact JSON' })).toBeEnabled();
});
