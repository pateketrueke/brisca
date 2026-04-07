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

test('keeps persistent controls reachable while a card dialog is open', async ({ page }) => {
  await page.getByRole('button', { name: 'START' }).click();
  await page.getByRole('button', { name: 'p1' }).click();
  await expect(page.getByText("p1's turn:")).toBeVisible();

  await page.getByRole('button', { name: 'Exit game' }).click();

  await expect(page.getByText('Do you want to end this game?')).toBeVisible();
});

test('keeps player layout stable after choosing a card', async ({ page }) => {
  await page
    .locator('.seat-control')
    .filter({ hasText: 'p2' })
    .locator('select')
    .selectOption('human');
  await page.getByRole('button', { name: 'START' }).click();

  const before = await page.locator('[data-players]').boundingBox();
  await page.getByRole('button', { name: 'p1' }).click();
  await page.locator('.overlay button.card').first().click();
  const after = await page.locator('[data-players]').boundingBox();

  if (!before || !after) throw new Error('Missing player layout bounds');
  expect(after.height).toBeLessThanOrEqual(before.height + 1);
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

test('inspects the selected timeline payload', async ({ page }) => {
  await page.getByRole('button', { name: 'START' }).click();

  await expect(page.getByLabel('Inspect timeline payload')).toBeEnabled();
  await page.getByLabel('Inspect timeline payload').check();

  const payload = page.getByLabel('Timeline payload', { exact: true });
  await expect(payload).toBeVisible();
  await expect(payload).toContainText('"status": "started"');
  await expect(payload).toContainText('"turn": "p1"');
});

test('auto-commits the hand and continue dialog when Auto OK is enabled', async ({ page }) => {
  await page
    .locator('.seat-control')
    .filter({ hasText: 'p2' })
    .locator('select')
    .selectOption('human');
  await page.getByRole('button', { name: 'START' }).click();
  await page.getByLabel('Auto OK').check();
  await expect(page.getByRole('button', { name: 'OK' })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'p1' })).toBeDisabled();

  await expect(page.getByText("p1's turn:")).toBeVisible();
  await page.locator('.overlay button.card').first().click();
  await expect(page.getByText("p2's turn:")).toBeVisible();
  await page.locator('.overlay button.card').first().click();

  await expect(page.getByText(/won this hand!/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'CONTINUE' })).toBeDisabled();
  await expect(page.getByText(/won this hand!/)).not.toBeVisible({ timeout: 3000 });
});
