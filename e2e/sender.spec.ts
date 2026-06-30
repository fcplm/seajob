import { test, expect } from '@playwright/test'

test.describe('Sender page', () => {
  test('unauthenticated user is redirected to login', async ({ page }) => {
    await page.goto('/en/dashboard/sender')
    await expect(page).toHaveURL(/\/en\/login/)
  })

  test('unauthenticated user redirected from employers page', async ({ page }) => {
    await page.goto('/en/dashboard/sender/employers')
    await expect(page).toHaveURL(/\/en\/login/)
  })
})
