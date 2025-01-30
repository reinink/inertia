import { expect, test } from '@playwright/test'
import { clickAndWaitForResponse } from './support'

test('can deep merge props', async ({ page }) => {
  await page.goto('/deep-merge-props')

  await expect(page.getByText('bar count is 5')).toBeVisible()
  await expect(page.getByText('foo count is 5')).toBeVisible()

  await clickAndWaitForResponse(page, 'Reload', null, 'button')

  await expect(page.getByText('bar count is 5')).toBeVisible()
  await expect(page.getByText('foo count is 10')).toBeVisible()

  await clickAndWaitForResponse(page, 'Reload', null, 'button')

  await expect(page.getByText('bar count is 5')).toBeVisible()
  await expect(page.getByText('foo count is 15')).toBeVisible()

  await clickAndWaitForResponse(page, 'Get Fresh', null, 'button')

  await expect(page.getByText('bar count is 5')).toBeVisible()
  await expect(page.getByText('foo count is 5')).toBeVisible()

  await clickAndWaitForResponse(page, 'Reload', null, 'button')

  await expect(page.getByText('bar count is 5')).toBeVisible()
  await expect(page.getByText('foo count is 10')).toBeVisible()
})
