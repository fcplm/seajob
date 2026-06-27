import { test, expect } from '@playwright/test'

test('landing page loads at /en', async ({ page }) => {
  await page.goto('/en')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await expect(page.getByText('SeaJob').first()).toBeVisible()
})

test('landing page loads at /ru', async ({ page }) => {
  await page.goto('/ru')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
})

test('login page is accessible', async ({ page }) => {
  await page.goto('/en/login')
  await expect(page).toHaveURL('/en/login')
})
