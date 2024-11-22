import { expect, test } from '@playwright/test'
import { consoleMessages, pageLoads, requests, shouldBeDumpPage } from './support'

test.beforeEach(async ({ page }) => {})

test('visits a different page', async ({ page }) => {
  pageLoads.watch(page)

  await page.goto('/')
  await page.getByRole('link', { name: 'Basic Links' }).click()
  await expect(page).toHaveURL('/links/method')
  await expect(page.getByText('This is the links page that demonstrates inertia-link methods')).toBeVisible()
})

test('can make a location visit', async ({ page }) => {
  pageLoads.watch(page, 2)

  await page.goto('/links/location')
  await page.getByRole('link', { name: 'Location visit' }).click()
  const dump = await shouldBeDumpPage(page, 'get')
  await expect(dump['x-inertia']).toBeUndefined()
})

test('will automatically cancel a pending visits when a new request is made', async ({ page }) => {
  pageLoads.watch(page)

  consoleMessages.listen(page)

  await page.goto('/links/automatic-cancellation')

  await page.getByRole('link', { name: 'Link' }).click()
  await page.getByRole('link', { name: 'Link' }).click()

  await expect(consoleMessages.messages).toHaveLength(3)
  await expect(consoleMessages.messages[0]).toBe('started')
  await expect(consoleMessages.messages[1]).toBe('cancelled')
  await expect(consoleMessages.messages[2]).toBe('started')
})

test.describe('methods', () => {
  test.beforeEach(async ({ page }) => {
    pageLoads.watch(page)

    await page.goto('/links/method')
  })

  const data = [
    { method: 'get', label: 'GET', el: 'link' },
    { method: 'post', label: 'POST', el: 'button' },
    { method: 'put', label: 'PUT', el: 'button' },
    { method: 'patch', label: 'PATCH', el: 'button' },
    { method: 'delete', label: 'DELETE', el: 'button' },
  ] as const

  data.forEach(({ method, label, el }) => {
    test(`can use the ${label} method`, async ({ page }) => {
      await page.getByRole(el, { name: `${label} Link` }).click()

      const dump = await shouldBeDumpPage(page, method)

      await expect(dump.query).toEqual({})
      await expect(dump.method).toBe(method)
      await expect(dump.form).toEqual({})
    })
  })
})

test.describe('data', () => {
  test.describe('query string array formatter', () => {
    test.beforeEach(async ({ page }) => {
      pageLoads.watch(page)

      await page.goto('/links/data/object')
    })

    const data = [
      { label: 'QSAF Brackets', formatter: 'brackets', expected: '?a[]=b&a[]=c' },
      { label: 'QSAF Indices', formatter: 'indices', expected: '?a[0]=b&a[1]=c' },
      { label: 'QSAF Default', formatter: 'default', expected: '?a[]=b&a[]=c' },
    ]

    data.forEach(({ label, formatter, expected }) => {
      test(`can use the ${formatter} query string array formatter`, async ({ page }) => {
        await page.getByRole('link', { name: label }).click()

        const dump = await shouldBeDumpPage(page, 'get')

        // TODO: Should this be in the query string? It's not, but... should it be?

        await expect(dump.query).toEqual({ a: ['b', 'c'] })
        await expect(dump.method).toBe('get')
        await expect(dump.form).toEqual({})
        await expect(dump.headers['content-type']).toBe('application/json')
      })
    })
  })

  test.describe('plain objects', () => {
    test.beforeEach(async ({ page }) => {
      pageLoads.watch(page)

      await page.goto('/links/data/object')
    })

    test('passes data as query params', async ({ page }) => {
      await page.getByRole('link', { name: 'GET Link' }).click()

      const dump = await shouldBeDumpPage(page, 'get')

      // TODO: Should this be in the query string? It's not, but... should it be?
      // const params = await page.evaluate(() => window.location.search)
      // await expect(params).toBe('?foo=get')

      await expect(dump.query).toEqual({ foo: 'get' })
      await expect(dump.method).toBe('get')
      await expect(dump.form).toEqual({})
      await expect(dump.headers['content-type']).toBe('application/json')
    })

    const data = [
      { method: 'post', label: 'POST', form: { bar: 'post' } },
      { method: 'put', label: 'PUT', form: { baz: 'put' } },
      { method: 'patch', label: 'PATCH', form: { foo: 'patch' } },
      { method: 'delete', label: 'DELETE', form: { bar: 'delete' } },
    ] as const

    data.forEach(({ method, label, form }) => {
      test(`can pass data using the ${label} method`, async ({ page }) => {
        await page.getByRole('button', { name: `${label} Link` }).click()

        const dump = await shouldBeDumpPage(page, method)

        await expect(dump.method).toBe(method)
        await expect(dump.form).toEqual(form)
        await expect(dump.files).toEqual({})
        await expect(dump.headers['content-type']).toBe('application/json')
      })
    })
  })

  test.describe('form data objects', () => {
    test.beforeEach(async ({ page }) => {
      pageLoads.watch(page)

      await page.goto('/links/data/form-data')
    })

    const data = [
      { method: 'post', label: 'POST' },
      { method: 'put', label: 'PUT' },
      { method: 'patch', label: 'PATCH' },
      { method: 'delete', label: 'DELETE' },
    ] as const

    data.forEach(({ method, label }) => {
      test(`can pass data using the ${label} method`, async ({ page }) => {
        await page.getByRole('button', { name: `${label} Link` }).click()

        const dump = await shouldBeDumpPage(page, method)

        await expect(dump.method).toBe(method)
        await expect(dump.form).toEqual({ bar: 'baz' })
        await expect(dump.files).toEqual([])
        await expect(dump.headers['content-type']).toContain('multipart/form-data; boundary=')
      })
    })
  })

  test.describe('auto-converted objects to form-data when files are present', () => {
    test.beforeEach(async ({ page }) => {
      pageLoads.watch(page)

      await page.goto('/links/data/auto-converted')
    })

    const data = [
      { method: 'post', label: 'POST' },
      { method: 'put', label: 'PUT' },
      { method: 'patch', label: 'PATCH' },
      { method: 'delete', label: 'DELETE' },
    ] as const

    data.forEach(({ method, label }) => {
      test(`auto-converts objects using the ${label} method`, async ({ page }) => {
        await page.getByRole('button', { name: `${label} Link` }).click()

        const dump = await shouldBeDumpPage(page, method)

        await expect(dump.method).toBe(method)
        await expect(dump.form).toEqual({ foo: 'bar' })
        await expect(dump.files).not.toEqual([])
        await expect(dump.files[0].originalname).toBe('example.jpg')
        await expect(dump.headers['content-type']).toContain('multipart/form-data; boundary=')
      })
    })
  })
})

test.describe('headers', () => {
  test('has the default set of headers', async ({ page }) => {
    pageLoads.watch(page)
    await page.goto('/links/headers')

    await page.getByRole('link', { name: 'Standard visit Link' }).click()

    const dump = await shouldBeDumpPage(page, 'get')

    await expect(dump.headers['x-inertia']).toBe('true')
    await expect(dump.headers['x-inertia-version']).toBeUndefined()
    await expect(dump.headers['x-requested-with']).toBe('XMLHttpRequest')
    await expect(dump.headers['accept']).toBe('text/html, application/xhtml+xml')
  })

  test('starts using the x-inertia-version header when a version was given from the back-end', async ({ page }) => {
    pageLoads.watch(page)
    await page.goto('/links/headers/version')

    await page.getByRole('link', { name: 'Standard visit Link' }).click()

    const dump = await shouldBeDumpPage(page, 'get')

    await expect(dump.headers['x-inertia-version']).toBe('example-version-header')
  })

  test('allows to set custom headers', async ({ page }) => {
    pageLoads.watch(page)
    await page.goto('/links/headers')

    await page.getByRole('link', { name: 'GET Link' }).click()

    const dump = await shouldBeDumpPage(page, 'get')

    await expect(dump.headers['x-inertia']).toBe('true')
    await expect(dump.headers['x-requested-with']).toBe('XMLHttpRequest')
    await expect(dump.headers['accept']).toBe('text/html, application/xhtml+xml')
    await expect(dump.headers['foo']).toBe('bar')
  })

  test('cannot override built-in Inertia headers', async ({ page }) => {
    pageLoads.watch(page)
    await page.goto('/links/headers')

    await page.getByRole('button', { name: 'POST Link' }).click()

    const dump = await shouldBeDumpPage(page, 'post')

    await expect(dump.headers['x-inertia']).toBe('true')
    await expect(dump.headers['x-requested-with']).toBe('XMLHttpRequest')
    await expect(dump.headers['accept']).toBe('text/html, application/xhtml+xml')
    await expect(dump.headers['bar']).toBe('baz')
  })
})

test.describe('replace', () => {
  test.beforeEach(async ({ page }) => {
    pageLoads.watch(page)

    await page.goto('/')
    await page.getByRole('link', { name: "'Replace' Links" }).click()
    await expect(page).toHaveURL('/links/replace')
  })

  test('replaces the current history state', async ({ page }) => {
    await page.getByRole('link', { name: '[State] Replace: true' }).click()
    await shouldBeDumpPage(page, 'get')

    await page.goBack()
    await expect(page).toHaveURL('/')

    await page.goForward()
    await expect(page).toHaveURL('/dump/get')
  })

  test('does not replace the current history state when it is set to false', async ({ page }) => {
    await page.getByRole('link', { name: '[State] Replace: false' }).click()
    await shouldBeDumpPage(page, 'get')

    await page.goBack()
    await expect(page).toHaveURL('/links/replace')

    await page.goForward()
    await expect(page).toHaveURL('/dump/get')
  })
})

test.describe('preserve state', () => {
  test.beforeEach(async ({ page }) => {
    pageLoads.watch(page)
    await page.goto('/links/preserve-state')
  })

  const preserveData = [
    {
      testLabel: 'default',
      label: '[State] Preserve: true',
      expected: 'bar',
    },
    {
      testLabel: 'callback',
      label: '[State] Preserve Callback: true',
      expected: 'callback-bar',
    },
  ] as const

  preserveData.forEach(({ label, expected, testLabel }) => {
    test(`preserves the page's local state (${testLabel})`, async ({ page }) => {
      await expect(page.getByText('Foo is now default')).toBeVisible()
      await page.getByLabel('Example Field').fill('Example value')

      const componentKey = await page.evaluate(() => (window as any)._inertia_page_key)
      await expect(componentKey).not.toBeUndefined()

      await page.getByRole('link', { name: label }).click()
      await expect(page).toHaveURL('/links/preserve-state-page-two')

      const newComponentKey = await page.evaluate(() => (window as any)._inertia_page_key)
      await expect(newComponentKey).not.toBeUndefined()

      await expect(newComponentKey).toBe(componentKey)
      await expect(page.getByLabel('Example Field')).toHaveValue('Example value')
      await expect(page.getByText(`Foo is now ${expected}`)).toBeVisible()
    })
  })

  const dontPreserveData = [
    {
      testLabel: 'default',
      label: '[State] Preserve: false',
      expected: 'baz',
    },
    {
      testLabel: 'callback',
      label: '[State] Preserve Callback: false',
      expected: 'callback-baz',
    },
  ] as const

  dontPreserveData.forEach(({ label, testLabel, expected }) => {
    test(`does not preserve the page's local state (${testLabel})`, async ({ page }) => {
      await expect(page.getByText('Foo is now default')).toBeVisible()
      await page.getByLabel('Example Field').fill('Another value')

      // @ts-ignore
      const componentKey = await page.evaluate(() => window._inertia_page_key)
      await expect(componentKey).not.toBeUndefined()

      await page.getByRole('link', { name: label }).click()
      await expect(page).toHaveURL('/links/preserve-state-page-two')

      // @ts-ignore
      const newComponentKey = await page.evaluate(() => window._inertia_page_key)
      await expect(newComponentKey).not.toBeUndefined()

      await expect(newComponentKey).not.toBe(componentKey)
      await expect(page.getByLabel('Example Field')).toHaveValue('')
      await expect(page.getByText(`Foo is now ${expected}`)).toBeVisible()
    })
  })
})

test.describe('preserve scroll', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/links/preserve-scroll-false')
    await expect(page.getByText('Foo is now default')).toBeVisible()

    await page.evaluate(() => window.scrollTo(5, 7))
    // @ts-ignore
    await page.evaluate(() => document.querySelector('#slot').scrollTo(10, 15))

    await expect(page.getByText('Document scroll position is 5 & 7')).toBeVisible()
    await expect(page.getByText('Slot scroll position is 10 & 15')).toBeVisible()
  })

  test('does not reset untracked scroll regions in persistent layouts', async ({ page }) => {
    await page.getByRole('link', { exact: true, name: 'Reset Scroll' }).click()
    await expect(page).toHaveURL('/links/preserve-scroll-false-page-two')
    await expect(page.getByText('Foo is now bar')).toBeVisible()
    await expect(page.getByText('Document scroll position is 0 & 0')).toBeVisible()
    await expect(page.getByText('Slot scroll position is 10 & 15')).toBeVisible()
  })

  test('does not reset untracked scroll regions in persistent layouts when returning false from a preserveScroll callback', async ({
    page,
  }) => {
    consoleMessages.listen(page)

    await page.getByRole('link', { exact: true, name: 'Reset Scroll (Callback)' }).click({ position: { x: 0, y: 0 } })
    await expect(page).toHaveURL('/links/preserve-scroll-false-page-two')
    await expect(page.getByText('Foo is now foo')).toBeVisible()
    await expect(page.getByText('Document scroll position is 0 & 0')).toBeVisible()
    await expect(page.getByText('Slot scroll position is 10 & 15')).toBeVisible()

    await expect(consoleMessages.messages).toHaveLength(1)

    const message = JSON.parse(consoleMessages.messages[0])

    await expect(message.component).not.toBeUndefined()
    await expect(message.props).not.toBeUndefined()
    await expect(message.url).not.toBeUndefined()
    await expect(message.version).not.toBeUndefined()
  })

  test('does not restore untracked scroll regions when pressing the back button', async ({ page }) => {
    await page.getByRole('link', { exact: true, name: 'Reset Scroll' }).click()

    await expect(page).toHaveURL('/links/preserve-scroll-false-page-two')
    await expect(page.getByText('Foo is now bar')).toBeVisible()

    // @ts-ignore
    await page.evaluate(() => document.querySelector('#slot').scrollTo(0, 0))
    await expect(page.getByText('Slot scroll position is 0 & 0')).toBeVisible()

    await page.goBack()

    await expect(page).toHaveURL('/links/preserve-scroll-false')
    await expect(page.getByText('Foo is now default')).toBeVisible()
    await expect(page.getByText('Document scroll position is 5 & 7')).toBeVisible()
    await expect(page.getByText('Slot scroll position is 0 & 0')).toBeVisible()
  })

  test('does not restore untracked scroll regions when returning true from a preserveScroll callback', async ({
    page,
  }) => {
    consoleMessages.listen(page)
    await page
      .getByRole('link', { exact: true, name: 'Preserve Scroll (Callback)' })
      .click({ position: { x: 0, y: 0 } })

    await expect(page).toHaveURL('/links/preserve-scroll-false-page-two')
    await expect(page.getByText('Foo is now baz')).toBeVisible()

    // @ts-ignore
    await page.evaluate(() => document.querySelector('#slot').scrollTo(0, 0))
    await expect(page.getByText('Slot scroll position is 0 & 0')).toBeVisible()

    const message = JSON.parse(consoleMessages.messages[0])

    await expect(message.component).not.toBeUndefined()
    await expect(message.props).not.toBeUndefined()
    await expect(message.url).not.toBeUndefined()
    await expect(message.version).not.toBeUndefined()

    await page.goBack()

    await expect(page).toHaveURL('/links/preserve-scroll-false')
    await expect(page.getByText('Foo is now default')).toBeVisible()
    await expect(page.getByText('Document scroll position is 5 & 7')).toBeVisible()
    await expect(page.getByText('Slot scroll position is 0 & 0')).toBeVisible()
  })

  test.skip('does not restore untracked scroll regions when pressing the back button from another website', async ({
    page,
  }) => {
    await page.getByRole('link', { name: 'Off-site link' }).click()

    await expect(page).toHaveURL('non-inertia')

    await page.goBack()

    await expect(page).toHaveURL('/links/preserve-scroll-false')
    await expect(page.getByText('Foo is now default')).toBeVisible()
    await expect(page.getByText('Document scroll position is 5 & 7')).toBeVisible()
    await expect(page.getByText('Slot scroll position is 0 & 0')).toBeVisible()
  })
})

test.describe('enabled', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/links/preserve-scroll')
    await expect(page.getByText('Foo is now default')).toBeVisible()

    await page.evaluate(() => window.scrollTo(5, 7))
    // @ts-ignore
    await page.evaluate(() => document.querySelector('#slot').scrollTo(10, 15))

    await expect(page.getByText('Document scroll position is 5 & 7')).toBeVisible()
    await expect(page.getByText('Slot scroll position is 10 & 15')).toBeVisible()
  })

  test('resets scroll regions to the top when doing a regular visit', async ({ page }) => {
    await page.getByText('Reset Scroll', { exact: true }).click()
    await expect(page).toHaveURL('/links/preserve-scroll-page-two')
    await expect(page.getByText('Foo is now bar')).toBeVisible()
    await expect(page.getByText('Document scroll position is 0 & 0')).toBeVisible()
    await expect(page.getByText('Slot scroll position is 0 & 0')).toBeVisible()
  })

  test('resets scroll regions to the top when returning false from a preserveScroll callback', async ({ page }) => {
    consoleMessages.listen(page)
    await page.getByText('Reset Scroll (Callback)', { exact: true }).click({ position: { x: 0, y: 0 } })

    await expect(page).toHaveURL('/links/preserve-scroll-page-two')
    await expect(page.getByText('Foo is now foo')).toBeVisible()
    await expect(page.getByText('Document scroll position is 0 & 0')).toBeVisible()
    await expect(page.getByText('Slot scroll position is 0 & 0')).toBeVisible()

    await expect(consoleMessages.messages).toHaveLength(1)
    const message = JSON.parse(consoleMessages.messages[0])

    await expect(message.component).not.toBeUndefined()
    await expect(message.props).not.toBeUndefined()
    await expect(message.url).not.toBeUndefined()
    await expect(message.version).not.toBeUndefined()
  })

  test('preserves scroll regions when using the "preserve-scroll" feature', async ({ page }) => {
    await page.getByText('Preserve Scroll', { exact: true }).click()

    await expect(page).toHaveURL('/links/preserve-scroll-page-two')
    await expect(page.getByText('Foo is now baz')).toBeVisible()
    await expect(page.getByText('Document scroll position is 5 & 7')).toBeVisible()
    await expect(page.getByText('Slot scroll position is 10 & 15')).toBeVisible()
  })

  test('preserves scroll regions when using the "preserve-scroll" feature from a callback', async ({ page }) => {
    consoleMessages.listen(page)
    await page.getByText('Preserve Scroll (Callback)', { exact: true }).click({ position: { x: 0, y: 0 } })

    await expect(page).toHaveURL('/links/preserve-scroll-page-two')
    await expect(page.getByText('Foo is now baz')).toBeVisible()
    await expect(page.getByText('Document scroll position is 5 & 7')).toBeVisible()
    await expect(page.getByText('Slot scroll position is 10 & 15')).toBeVisible()

    const message = JSON.parse(consoleMessages.messages[0])

    await expect(message.component).not.toBeUndefined()
    await expect(message.props).not.toBeUndefined()
    await expect(message.url).not.toBeUndefined()
    await expect(message.version).not.toBeUndefined()
  })

  test('restores all tracked scroll regions when pressing the back button', async ({ page }) => {
    await page.getByTestId('preserve').click()

    await expect(page).toHaveURL('/links/preserve-scroll-page-two')

    await page.evaluate(() => (document as any).querySelector('#slot').scrollTo(0, 0))

    await expect(page.getByText('Slot scroll position is 0 & 0')).toBeVisible()

    await page.goBack()

    await expect(page).toHaveURL('/links/preserve-scroll')
    await expect(page.getByText('Foo is now default')).toBeVisible()
    await expect(page.getByText('Document scroll position is 5 & 7')).toBeVisible()
    await expect(page.getByText('Slot scroll position is 10 & 15')).toBeVisible()
  })

  test.skip('restores all tracked scroll regions when pressing the back button from another website', async ({
    page,
  }) => {
    await page.getByRole('link', { name: 'Off-site link' }).click()

    await expect(page).toHaveURL('non-inertia')

    await page.goBack()

    await expect(page).toHaveURL('/links/preserve-scroll')
    await expect(page.getByText('Document scroll position is 5 & 7')).toBeVisible()
    await expect(page.getByText('Slot scroll position is 10 & 15')).toBeVisible()
  })
})

test.describe('URL fragment navigation (& automatic scrolling)', () => {
  /** @see https://github.com/inertiajs/inertia/pull/257 */

  test.beforeEach(async ({ page }) => {
    pageLoads.watch(page)
    await page.goto('/links/url-fragments')
    await expect(page.getByText('Document scroll position is 0 & 0')).toBeVisible()
  })

  test('scrolls to the fragment element when making a visit to a different page', async ({ page }) => {
    await page.getByRole('link', { name: 'Basic link' }).click()
    await expect(page).toHaveURL('/links/url-fragments#target')
    await expect(page.getByText('Document scroll position is 0 & 0')).not.toBeVisible()
  })

  test('scrolls to the fragment element when making a visit to the same page', async ({ page }) => {
    await page.getByRole('link', { exact: true, name: 'Fragment link' }).click()
    await expect(page).toHaveURL('/links/url-fragments#target')
    await expect(page.getByText('Document scroll position is 0 & 0')).not.toBeVisible()
  })

  test('does not scroll to the fragment element when it does not exist on the page', async ({ page }) => {
    await page.getByRole('link', { exact: true, name: 'Non-existent fragment link' }).click()
    await expect(page).toHaveURL('/links/url-fragments#non-existent-fragment')
    await expect(page.getByText('Document scroll position is 0 & 0')).toBeVisible()
  })
})

test.describe('partial reloads', () => {
  test.beforeEach(async ({ page }) => {
    pageLoads.watch(page)
    await page.goto('/links/partial-reloads')
    await expect(page.getByText('Foo is now 1')).toBeVisible()
    await expect(page.getByText('Bar is now 2')).toBeVisible()
    await expect(page.getByText('Baz is now 3')).toBeVisible()
  })

  test('does not have headers specific to partial reloads when the feature is not being used', async ({ page }) => {
    requests.listen(page)

    await page.getByRole('link', { name: 'Update All' }).click()
    await expect(page).toHaveURL('/links/partial-reloads')

    await expect(requests.requests).toHaveLength(1)

    const request = requests.requests[0]

    await expect(request.headers()['x-inertia-partial-component']).toBeUndefined()
    await expect(request.headers()['x-inertia-partial-data']).toBeUndefined()
  })

  test('has headers specific to partial reloads', async ({ page }) => {
    requests.listen(page)

    await page.getByRole('link', { name: 'Only foo + bar' }).click()
    await expect(page).toHaveURL('/links/partial-reloads')

    await expect(requests.requests).toHaveLength(1)

    const request = requests.requests[0]

    await expect(request.headers()['x-inertia-partial-component']).toBe('Links/PartialReloads')
    await expect(request.headers()['x-inertia-partial-data']).toBe('headers,foo,bar')
    await expect(request.headers()['accept']).toBe('text/html, application/xhtml+xml')
    await expect(request.headers()['x-requested-with']).toBe('XMLHttpRequest')
    await expect(request.headers()['x-inertia']).toBe('true')
  })

  test('it updates all props when the feature is not being used', async ({ page }) => {
    await page.getByRole('link', { name: 'Update All' }).click()
    await expect(page).toHaveURL('/links/partial-reloads')

    await expect(page.getByText('Foo is now 2')).toBeVisible()
    await expect(page.getByText('Bar is now 3')).toBeVisible()
    await expect(page.getByText('Baz is now 4')).toBeVisible()
  })

  test('it only updates props that are passed through "only"', async ({ page }) => {
    await page.getByRole('link', { name: 'Only foo + bar' }).click()
    await expect(page).toHaveURL('/links/partial-reloads')

    await expect(page.getByText('Foo is now 2')).toBeVisible()
    await expect(page.getByText('Bar is now 3')).toBeVisible()
    await expect(page.getByText('Baz is now 3')).toBeVisible()

    await page.getByRole('link', { name: 'Only baz' }).click()
    await expect(page).toHaveURL('/links/partial-reloads')

    await expect(page.getByText('Foo is now 2')).toBeVisible()
    await expect(page.getByText('Bar is now 3')).toBeVisible()
    await expect(page.getByText('Baz is now 5')).toBeVisible()

    await page.getByRole('link', { name: 'Update All' }).click()
    await expect(page).toHaveURL('/links/partial-reloads')

    await expect(page.getByText('Foo is now 3')).toBeVisible()
    await expect(page.getByText('Bar is now 4')).toBeVisible()
    await expect(page.getByText('Baz is now 5')).toBeVisible()
  })

  test('it only updates props that are not passed through "except"', async ({ page }) => {
    await page.getByRole('link', { name: 'Except foo + bar' }).click()
    await expect(page).toHaveURL('/links/partial-reloads')

    await expect(page.getByText('Foo is now 1')).toBeVisible()
    await expect(page.getByText('Bar is now 2')).toBeVisible()
    await expect(page.getByText('Baz is now 4')).toBeVisible()

    await page.getByRole('link', { name: 'Except baz' }).click()
    await expect(page).toHaveURL('/links/partial-reloads')

    await expect(page.getByText('Foo is now 2')).toBeVisible()
    await expect(page.getByText('Bar is now 3')).toBeVisible()
    await expect(page.getByText('Baz is now 4')).toBeVisible()
  })
})

test.describe('redirects', () => {
  test('follows 303 redirects', async ({ page }) => {
    pageLoads.watch(page)
    await page.goto('/')

    await page.getByRole('button', { name: 'Internal Redirect Link' }).click()
    await shouldBeDumpPage(page, 'get')
  })

  test('follows external redirects', async ({ page }) => {
    pageLoads.watch(page, 2)
    await page.goto('/')

    await page.getByRole('button', { name: 'External Redirect Link' }).click()
    await expect(page).toHaveURL('/non-inertia')
    await expect(pageLoads.count).toBe(2)
  })
})

test.describe('"as" attribute', () => {
  test('GET defaults to link', async ({ page }) => {
    await page.goto('/links/as-warning/get')
    await expect(page.getByRole('link', { name: 'GET Link' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'GET Link' })).not.toBeVisible()
  })

  test('GET can display as button', async ({ page }) => {
    await page.goto('/links/as-warning-false/get')
    await expect(page.getByRole('link', { name: 'GET button Link' })).not.toBeVisible()
    await expect(page.getByRole('button', { name: 'GET button Link' })).toBeVisible()
  })

  const data = [
    { method: 'post', label: 'POST' },
    { method: 'put', label: 'PUT' },
    { method: 'patch', label: 'PATCH' },
    { method: 'delete', label: 'DELETE' },
  ] as const

  data.forEach(({ method, label }) => {
    test(`forces a button for non-GET ${label} links`, async ({ page }) => {
      await page.goto(`/links/as-warning/${method}`)
      await expect(page.getByRole('link', { name: `${label} Link` })).not.toBeVisible()
      await expect(page.getByRole('button', { name: `${label} Link` })).toBeVisible()

      await page.goto(`/links/as-warning-false/${method}`)
      await expect(page.getByRole('link', { name: `${label} button Link` })).not.toBeVisible()
      await expect(page.getByRole('button', { name: `${label} button Link` })).toBeVisible()
    })
  })
})

test.describe('data-loading attribute', () => {
  test('adds data-loading attribute to link component', async ({ page }) => {
    await page.goto('/links/data-loading')
    const link = await page.getByRole('link', { name: 'First' })
    await link.click()
    await expect(link).toHaveAttribute('data-loading', '')
    await page.waitForResponse('sleep')
    await expect(link).not.toHaveAttribute('data-loading')
  })

  test('handles data-loading attribute for cancelled requests', async ({ page }) => {
    await page.goto('/links/data-loading')
    const link1 = await page.getByRole('link', { name: 'First' })
    const link2 = await page.getByRole('link', { name: 'Second' })
    await link1.click()
    await expect(link1).toHaveAttribute('data-loading', '')
    await expect(link2).not.toHaveAttribute('data-loading', '')
    await link2.click()
    await expect(link1).not.toHaveAttribute('data-loading', '')
    await expect(link2).toHaveAttribute('data-loading', '')
    await page.waitForResponse('sleep')
    await expect(link2).not.toHaveAttribute('data-loading')
  })
})

test.describe('disabled attribute', () => {
  test('disables the link when the disabled attribute is set to true', async ({ page }) => {
    await page.goto('/links/disabled')
    const link = await page.getByRole('link', { name: 'Disabled', exact: true })
    await expect(link).not.toHaveAttribute('disabled')
    await link.click()
    await expect(page).toHaveURL('/links/disabled')
  })

  test('disables the link when the disabled attribute exists', async ({ page }) => {
    await page.goto('/links/disabled')
    const link = await page.getByRole('link', { name: 'Disabled Default', exact: true })
    await expect(link).not.toHaveAttribute('disabled')
    await link.click()
    await expect(page).toHaveURL('/links/disabled')
  })

  test('does not disable the link when the disabled attribute is set to false', async ({ page }) => {
    await page.goto('/links/disabled')
    const link = await page.getByRole('link', { name: 'Enabled', exact: true })
    await expect(link).not.toHaveAttribute('disabled')
    await link.click()
    await expect(page).toHaveURL('/links/disabled')
  })

  test('does not disable the link when the disabled attribute not exists', async ({ page }) => {
    await page.goto('/links/disabled')
    const link = await page.getByRole('link', { name: 'Enabled Default', exact: true })
    await expect(link).not.toHaveAttribute('disabled')
    await link.click()
    await expect(page).toHaveURL('/links/disabled')
  })

  test('disables the link (as=button) when the disabled attribute is set to true', async ({ page }) => {
    await page.goto('/links/disabled')
    const link = await page.getByRole('button', { name: 'Disabled Button', exact: true })
    await expect(link).toBeDisabled()
    await expect(link).toHaveAttribute('disabled')
  })

  test('disables the link (as=button) when the disabled attribute is set', async ({ page }) => {
    await page.goto('/links/disabled')
    const link = await page.getByRole('button', { name: 'Disabled Default Button', exact: true })
    await expect(link).toBeDisabled()
    await expect(link).toHaveAttribute('disabled')
  })

  test('does not disable the link (as=button) when the disabled attribute is set to false', async ({ page }) => {
    await page.goto('/links/disabled')
    const link = await page.getByRole('button', { name: 'Enabled Button', exact: true })
    await expect(link).not.toBeDisabled()
    await expect(link).not.toHaveAttribute('disabled')
    await link.click()
    await expect(page).toHaveURL('/links/disabled')
  })

  test('does not disable the link (as=button) when the disabled attribute is not set', async ({ page }) => {
    await page.goto('/links/disabled')
    const link = await page.getByRole('button', { name: 'Enabled Default Button', exact: true })
    await expect(link).not.toBeDisabled()
    await expect(link).not.toHaveAttribute('disabled')
    await link.click()
    await expect(page).toHaveURL('/links/disabled')
  })
})
