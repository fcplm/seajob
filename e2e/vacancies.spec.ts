import { test, expect } from '@playwright/test'

test('unauthenticated access to vacancies page redirects to login', async ({ page }) => {
  await page.goto('/en/dashboard/vacancies')
  await expect(page).toHaveURL(/\/en\/login/)
})

test('vacancies redirect does not land on error page', async ({ page }) => {
  await page.goto('/en/dashboard/vacancies')
  // Should redirect to login, not crash
  await expect(page).not.toHaveURL(/error/)
  await expect(page).not.toHaveURL(/500/)
})

test('vacancies page at /ru locale redirects unauthenticated users to login', async ({ page }) => {
  await page.goto('/ru/dashboard/vacancies')
  await expect(page).toHaveURL(/\/ru\/login/)
})

test('vacancies page loads for authenticated user', async ({ page }) => {
  // Skip if TEST_USER_EMAIL / TEST_USER_PASSWORD env vars not set
  const email = process.env.TEST_USER_EMAIL
  const password = process.env.TEST_USER_PASSWORD
  if (!email || !password) {
    test.skip()
    return
  }

  await page.goto('/en/login')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill(password)
  await page.getByRole('button', { name: 'Log In' }).click()
  await page.waitForURL(/\/en\/dashboard/)

  await page.goto('/en/dashboard/vacancies')
  await expect(page).toHaveURL(/\/en\/dashboard\/vacancies/)
})
