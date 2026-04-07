import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test('starts and exits a game', async ({ page }) => {
  await expect(page.getByRole('heading', { name: /Brisca/ })).toBeVisible();
  await expect(page.getByText('Players:')).toBeVisible();

  await page.getByRole('button', { name: 'START' }).click();

  await expect(page.getByRole('button', { name: 'Exit game' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'OK' })).toBeDisabled();

  await page.getByRole('button', { name: 'Exit game' }).click();
  await expect(page.getByText('Do you want to end this game?')).toBeVisible();

  await page.getByRole('button', { name: 'EXIT GAME', exact: true }).click();

  await expect(page.getByText('Players:')).toBeVisible();
  await expect(page.getByRole('button', { name: 'START' })).toBeVisible();
});

test('opens the first player hand', async ({ page }) => {
  await page.getByRole('button', { name: 'START' }).click();
  await page.getByRole('button', { name: 'p1' }).click();

  await expect(page.getByText("p1's turn:")).toBeVisible();
});
