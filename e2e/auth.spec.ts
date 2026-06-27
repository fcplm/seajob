import { test, expect } from '@playwright/test'

test('signup page loads', async ({ page }) => {
  await page.goto('/en/signup')
  await expect(page.getByRole('heading')).toBeVisible()
  await expect(page.getByLabel('Email')).toBeVisible()
  await expect(page.getByLabel('Password')).toBeVisible()
})

test('login page loads', async ({ page }) => {
  await page.goto('/en/login')
  await expect(page.getByRole('heading')).toBeVisible()
})

test('dashboard redirects to login when unauthenticated', async ({ page }) => {
  await page.goto('/en/dashboard')
  await expect(page).toHaveURL(/\/en\/login/)
})
