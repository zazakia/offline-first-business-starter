import { test, expect } from '@playwright/test'

test.describe('Customer CRUD', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should display dashboard', async ({ page }) => {
    await expect(page.locator('text=Dashboard')).toBeVisible()
    await expect(page.locator('text=Customers')).toBeVisible()
  })

  test('should navigate to customers list', async ({ page }) => {
    await page.click('text=Customers')
    await expect(page).toHaveURL(/\/customers/)
  })

  test('should create a new customer', async ({ page }) => {
    await page.click('text=Customers')
    await page.click('text=Add Customer')

    await page.fill('input[name="name"]', 'Test User')
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="company"]', 'Test Corp')
    await page.click('text=Save Customer')

    // Should navigate to the detail page
    await expect(page.locator('text=Test User')).toBeVisible()
  })

  test('should create and then edit a customer', async ({ page }) => {
    // Create
    await page.click('text=Customers')
    await page.click('text=Add Customer')
    await page.fill('input[name="name"]', 'Edit Test')
    await page.fill('input[name="email"]', 'edit@test.com')
    await page.click('text=Save Customer')

    // Edit
    await page.click('text=Edit')
    await page.fill('input[name="name"]', '')
    await page.fill('input[name="name"]', 'Edited Name')
    await page.click('text=Save')

    await expect(page.locator('text=Edited Name')).toBeVisible()
  })
})
