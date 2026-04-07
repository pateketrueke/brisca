import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test('starts and exits a game', async ({ page }) => {
  await expect(page.getByRole('heading', { name: /Brisca/ })).toBeVisible();
  await expect(page.getByText('Players:')).toBeVisible();
  await expect(page.getByText('Empty 0/0')).toBeVisible();
  await expect(page.getByLabel('Gameplay timeline')).toBeDisabled();

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

test('lets a bot-controlled seat auto-play after the human turn', async ({ page }) => {
  await page.getByRole('button', { name: 'START' }).click();
  await page.getByRole('button', { name: 'p1' }).click();
  await page.locator('.overlay button.card').first().click();

  await expect(page.getByText(/won this hand!/)).toBeVisible();
});

test('time-travels gameplay history in read-only replay mode', async ({ page }) => {
  await page.getByRole('button', { name: 'START' }).click();
  await page.getByRole('button', { name: 'p1' }).click();
  await page.locator('.overlay button.card').first().click();
  await expect(page.getByText(/won this hand!/)).toBeVisible();

  const timeline = page.getByLabel('Gameplay timeline');
  await expect(timeline).toBeVisible();
  await timeline.fill('0');

  await expect(page.getByText(/Replay 1\//)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Exit game' })).toBeDisabled();
});

test('auto-commits the hand and continue dialog when Auto OK is enabled', async ({ page }) => {
  await page
    .locator('.seat-control')
    .filter({ hasText: 'p2' })
    .locator('select')
    .selectOption('human');
  await page.getByRole('button', { name: 'START' }).click();
  await page.getByLabel('Auto OK').check();

  await expect(page.getByText("p1's turn:")).toBeVisible();
  await page.locator('.overlay button.card').first().click();
  await expect(page.getByText("p2's turn:")).toBeVisible();
  await page.locator('.overlay button.card').first().click();

  await expect(page.getByText(/won this hand!/)).toBeVisible();
  await expect(page.getByText(/won this hand!/)).not.toBeVisible({ timeout: 3000 });
});
