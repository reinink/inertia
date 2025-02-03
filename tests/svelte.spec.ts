import { expect, test } from '@playwright/test'
import { consoleMessages } from './support'

test.beforeEach(async ({ page }) => {
  test.skip(process.env.PACKAGE !== 'svelte', 'Svelte-only test')
})

test('props and page store are in sync', async ({ page }) => {
  consoleMessages.listen(page)

  await page.goto('/svelte/props-and-page-store')

  await expect(page.getByText('foo prop is default')).toBeVisible()
  await expect(page.getByText('$page.props.foo is default')).toBeVisible()
  await expect(consoleMessages.messages).toHaveLength(7)
  await expect(consoleMessages.messages[0]).toBe('[script] foo prop is default')
  await expect(consoleMessages.messages[1]).toBe('[script] $page.props.foo is default')
  await expect(consoleMessages.messages[2]).toBe('[reactive expression] foo prop is default')
  await expect(consoleMessages.messages[3]).toBe('[reactive expression] $page.props.foo is default')
  await expect(consoleMessages.messages[4]).toBe('[onMount] foo prop is default')
  await expect(consoleMessages.messages[5]).toBe('[onMount] $page.props.foo is default')
  await expect(consoleMessages.messages[6]).toBe('[reactive expression] $page.props.foo is default')
  await expect(await page.locator('#input').inputValue()).toEqual('default')

  consoleMessages.messages = []
  await page.getByRole('link', { name: 'Bar' }).click()

  await expect(page.getByText('foo prop is bar')).toBeVisible()
  await expect(page.getByText('$page.props.foo is bar')).toBeVisible()
  await expect(consoleMessages.messages).toHaveLength(7)
  await expect(consoleMessages.messages[0]).toBe('[reactive expression] $page.props.foo is bar')
  await expect(consoleMessages.messages[1]).toBe('[script] foo prop is bar')
  await expect(consoleMessages.messages[2]).toBe('[script] $page.props.foo is bar')
  await expect(consoleMessages.messages[3]).toBe('[reactive expression] foo prop is bar')
  await expect(consoleMessages.messages[4]).toBe('[reactive expression] $page.props.foo is bar')
  await expect(consoleMessages.messages[5]).toBe('[onMount] foo prop is bar')
  await expect(consoleMessages.messages[6]).toBe('[onMount] $page.props.foo is bar')
  await expect(await page.locator('#input').inputValue()).toEqual('bar')

  consoleMessages.messages = []
  await page.getByRole('link', { name: 'Baz' }).click()

  await expect(page.getByText('foo prop is baz')).toBeVisible()
  await expect(page.getByText('$page.props.foo is baz')).toBeVisible()
  await expect(consoleMessages.messages).toHaveLength(7)
  await expect(consoleMessages.messages[0]).toBe('[reactive expression] $page.props.foo is baz')
  await expect(consoleMessages.messages[1]).toBe('[script] foo prop is baz')
  await expect(consoleMessages.messages[2]).toBe('[script] $page.props.foo is baz')
  await expect(consoleMessages.messages[3]).toBe('[reactive expression] foo prop is baz')
  await expect(consoleMessages.messages[4]).toBe('[reactive expression] $page.props.foo is baz')
  await expect(consoleMessages.messages[5]).toBe('[onMount] foo prop is baz')
  await expect(consoleMessages.messages[6]).toBe('[onMount] $page.props.foo is baz')
  await expect(await page.locator('#input').inputValue()).toEqual('baz')

  await page.getByRole('link', { name: 'Home' }).click()
  consoleMessages.messages = []
  await page.goBack()

  await expect(page.getByText('foo prop is baz')).toBeVisible()
  await expect(page.getByText('$page.props.foo is baz')).toBeVisible()
  await expect(consoleMessages.messages).toHaveLength(6)
  await expect(consoleMessages.messages[0]).toBe('[script] foo prop is baz')
  await expect(consoleMessages.messages[1]).toBe('[script] $page.props.foo is baz')
  await expect(consoleMessages.messages[2]).toBe('[reactive expression] foo prop is baz')
  await expect(consoleMessages.messages[3]).toBe('[reactive expression] $page.props.foo is baz')
  await expect(consoleMessages.messages[4]).toBe('[onMount] foo prop is baz')
  await expect(consoleMessages.messages[5]).toBe('[onMount] $page.props.foo is baz')
})
