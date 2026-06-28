import { test, expect } from '@playwright/test'

test('unauthenticated access to resume page redirects to login', async ({ page }) => {
  await page.goto('/en/dashboard/resume')
  await expect(page).toHaveURL(/\/en\/login/)
})

test('PDF endpoint returns 401 for unauthenticated request', async ({ request }) => {
  const response = await request.get('/api/resume/pdf?template=classic')
  expect(response.status()).toBe(401)
})

test('resume page loads for authenticated user', async ({ page }) => {
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

  await page.goto('/en/dashboard/resume')
  await expect(page.getByRole('heading', { name: 'My Resume' })).toBeVisible()
  await expect(page.getByText('Personal Info')).toBeVisible()
  await expect(page.getByText('Sea Experience')).toBeVisible()
})
