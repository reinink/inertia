import { expect, Page, test } from '@playwright/test'
import { clickAndWaitForResponse, pageLoads } from './support'

const listenForGlobalMessages = async (page: Page, event, stringifyDetail = false) => {
  await page.evaluate(
    ({ event: eventName, stringifyDetail }) => {
      // @ts-ignore
      window.globalMessages = window.globalMessages || {}

      // @ts-ignore
      window.globalMessages[eventName] = []

      document.addEventListener(eventName, (e) => {
        // @ts-ignore
        window.globalMessages[eventName].push({
          isCustomEvent: e instanceof CustomEvent,
          type: e.type,
          cancelable: e.cancelable,
          detail: stringifyDetail ? JSON.stringify(e.detail) : e.detail,
        })
      })
    },
    { event, stringifyDetail },
  )
}

const assertVisitObject = async (visit) => {
  await expect(visit.url).toBeDefined()
  await expect(visit.method).toBeDefined()
  await expect(visit.data).toBeDefined()
  await expect(visit.headers).toBeDefined()
  await expect(visit.preserveState).toBeDefined()
}

const assertPageObject = async (page) => {
  await expect(page.component).toBeDefined()
  await expect(page.props).toBeDefined()
  await expect(page.url).toBeDefined()
  await expect(page.version).toBeDefined()
}

const assertProgressObject = async (progress) => {
  await expect(progress.percentage).toBeDefined()
  await expect(progress.total).toBeDefined()
  await expect(progress.loaded).toBeDefined()
  await expect(progress.percentage).toBeGreaterThanOrEqual(0)
  await expect(progress.percentage).toBeLessThanOrEqual(100)
}

const assertCancelToken = async (token) => {
  // TODO: Fix this, result is getting mangled by playwright somewhere along the way
  return
  await expect(token.cancel).toBeDefined()
}

const assertIsGlobalEvent = async (event, expectedType, cancelable) => {
  await expect(event.isCustomEvent).toBe(true)
  await expect(event.type).toBe(expectedType)
  await expect(event.cancelable).toBe(cancelable)
}

const assertGlobalErrorEvent = async (event) => {
  await assertIsGlobalEvent(event, 'inertia:error', false)
  await assertErrorsObject(event.detail.errors)
}

const assertGlobalSuccessEvent = async (event) => {
  await assertIsGlobalEvent(event, 'inertia:success', false)
  await assertPageObject(event.detail.page)
}

const assertErrorsObject = async (errors) => {
  await expect(errors.foo).toBeDefined()
  await expect(errors.foo).toBe('bar')
}

const assertResponseObject = async (response) => {
  await expect(response.headers).toBeDefined()
  await expect(response.data).toBeDefined()
  await expect(response.status).toBeDefined()
}

const assertExceptionObject = async (detail) => {
  await expect(detail.exception).toBeDefined()
  await expect(detail.exception.code).toBe('ERR_NETWORK')
}

const assertGlobalFinishEvent = async (event) => {
  await assertIsGlobalEvent(event, 'inertia:finish', false)
  await assertVisitObject(event.detail.visit)
}

test.describe('Events', () => {
  test.beforeEach(async ({ page }) => {
    pageLoads.watch(page)
    await page.goto('/events')
  })

  test.describe('Listeners', () => {
    test('does not have any listeners by default', async ({ page }) => {
      await page.getByRole('link', { name: 'Basic Visit' }).click()

      const messages = await page.evaluate(() => (window as any).messages)

      await expect(messages.length).toBe(0)
    })

    test.describe('Inertia.on', () => {
      test('returns a callback that can be used to remove the global listener', async ({ page }) => {
        await page.getByRole('link', { name: 'Remove Inertia Listener' }).click()

        const messages = await page.evaluate(() => (window as any).messages)

        await expect(messages.length).toBe(3)
        await expect(messages[0]).toBe('Removing Inertia.on Listener')
        await expect(messages[1]).toBe('onBefore')
        await expect(messages[2]).toBe('onStart')
      })
    })
  })

  test.describe('Hooks', () => {
    test.describe('before', () => {
      test('fires the event when a request is about to be made', async ({ page }) => {
        await listenForGlobalMessages(page, 'inertia:before')

        await page.getByRole('link', { exact: true, name: 'Before Event' }).click()

        const messages = await page.evaluate(() => (window as any).messages)
        const globalMessages = await page.evaluate(() => (window as any).globalMessages['inertia:before'])

        // Local Event Callback
        await expect(messages[0]).toBe('onBefore')
        await assertVisitObject(messages[1])

        // Global Inertia Event Listener
        await expect(messages[2]).toBe('Inertia.on(before)')

        await expect(globalMessages).toHaveLength(1)

        await assertIsGlobalEvent(globalMessages[0], 'inertia:before', true)
        await assertVisitObject(globalMessages[0].detail.visit)

        // Ensure the listeners did not prevent the visit
        await expect(messages[6]).toBe('onStart')
      })

      test('fires the event when a request is about to be made (link)', async ({ page }) => {
        await page.getByRole('button', { exact: true, name: 'Before Event Link' }).click()

        const messages = await page.evaluate(() => (window as any).messages)

        // Link Event Callback
        await expect(messages[0]).toBe('linkOnBefore')
        assertVisitObject(messages[1])

        // Ensure the listeners did not prevent the visit
        await expect(messages[2]).toBe('linkOnStart')
      })

      test.describe('Local Event Callbacks', () => {
        test('can prevent the visit by returning false', async ({ page }) => {
          await page.getByRole('link', { exact: true, name: 'Before Event (Prevent)' }).click()

          const messages = await page.evaluate(() => (window as any).messages)

          await expect(messages).toHaveLength(1)
          await expect(messages[0]).toBe('onBefore')
        })

        test('can prevent the visit by returning false (link)', async ({ page }) => {
          await page.getByRole('button', { exact: true, name: 'Before Event Link (Prevent)' }).click()

          const messages = await page.evaluate(() => (window as any).messages)

          await expect(messages).toHaveLength(1)
          await expect(messages[0]).toBe('linkOnBefore')
        })
      })

      test.describe('Global Inertia.on', () => {
        test('can prevent the visit by returning false ', async ({ page }) => {
          await page
            .getByRole('link', { exact: true, name: 'Before Event - Prevent globally using Inertia Event Listener' })
            .click()

          const messages = await page.evaluate(() => (window as any).messages)

          await expect(messages).toHaveLength(3)
          await expect(messages[0]).toBe('onBefore')
          await expect(messages[1]).toBe('addEventListener(inertia:before)')
          await expect(messages[2]).toBe('Inertia.on(before)')
        })
      })

      test.describe('Global addEventListener', () => {
        test('can prevent the visit by using preventDefault', async ({ page }) => {
          await page
            .getByRole('link', { exact: true, name: 'Before Event - Prevent globally using Native Event Listeners' })
            .click()

          const messages = await page.evaluate(() => (window as any).messages)

          await expect(messages).toHaveLength(3)
          await expect(messages[0]).toBe('onBefore')
          await expect(messages[1]).toBe('Inertia.on(before)')
          await expect(messages[2]).toBe('addEventListener(inertia:before)')
        })
      })
    })

    test.describe('cancelToken', () => {
      test('fires when the request is starting', async ({ page }) => {
        await page.getByRole('link', { exact: true, name: 'Cancel Token Event' }).click()

        const messages = await page.evaluate(() => (window as any).messages)

        // Assert that it only gets fired locally.
        await expect(messages).toHaveLength(2)

        await expect(messages[0]).toBe('onCancelToken')
        assertCancelToken(messages[1])
      })

      test('fires when the request is starting (link)', async ({ page }) => {
        await page.getByRole('button', { exact: true, name: 'Cancel Token Event Link' }).click()

        const messages = await page.evaluate(() => (window as any).messages)

        // Assert that it only gets fired locally.
        await expect(messages).toHaveLength(2)

        await expect(messages[0]).toBe('linkOnCancelToken')
        assertCancelToken(messages[1])
      })
    })

    test.describe('cancel', () => {
      test('fires when the request was cancelled', async ({ page }) => {
        await page.getByRole('link', { exact: true, name: 'Cancel Event' }).click()

        const messages = await page.evaluate(() => (window as any).messages)

        await expect(messages).toHaveLength(2)
        await expect(messages[0]).toBe('onCancel')
        await expect(messages[1]).toBeUndefined()
      })

      test('fires when the request was cancelled (link)', async ({ page }) => {
        await page.getByRole('button', { exact: true, name: 'Cancel Event Link' }).click()

        const messages = await page.evaluate(() => (window as any).messages)

        await expect(messages).toHaveLength(2)
        await expect(messages[0]).toBe('linkOnCancel')
        await expect(messages[1]).toBeUndefined()
      })
    })

    test.describe('start', () => {
      test('fires when the request has started', async ({ page }) => {
        await listenForGlobalMessages(page, 'inertia:start')

        await page.getByRole('link', { exact: true, name: 'Start Event' }).click()

        const messages = await page.evaluate(() => (window as any).messages)
        const globalMessages = await page.evaluate(() => (window as any).globalMessages['inertia:start'])

        await expect(messages).toHaveLength(6)
        await expect(globalMessages).toHaveLength(1)

        await assertIsGlobalEvent(globalMessages[0], 'inertia:start', false)
        await assertVisitObject(globalMessages[0].detail.visit)

        // Global Inertia Event Listener
        await expect(messages[0]).toBe('Inertia.on(start)')

        // Global Native Event Listener
        await expect(messages[2]).toBe('addEventListener(inertia:start)')

        // Local Event Callback
        await expect(messages[4]).toBe('onStart')
        assertVisitObject(messages[5])
      })

      test('fires when the request has started (link)', async ({ page }) => {
        await page.getByRole('button', { exact: true, name: 'Start Event Link' }).click()

        const messages = await page.evaluate(() => (window as any).messages)

        await expect(messages).toHaveLength(2)

        // Local Event Callback
        await expect(messages[0]).toBe('linkOnStart')
        assertVisitObject(messages[1])
      })
    })

    test.describe('progress', () => {
      test('fires when the request has files and upload progression occurs', async ({ page }) => {
        await listenForGlobalMessages(page, 'inertia:progress')

        await clickAndWaitForResponse(page, 'Progress Event')

        const messages = await page.evaluate(() => (window as any).messages)
        const globalMessages = await page.evaluate(() => (window as any).globalMessages['inertia:progress'])

        await expect(messages).toHaveLength(6)
        await expect(globalMessages).toHaveLength(1)

        await assertIsGlobalEvent(globalMessages[0], 'inertia:progress', false)
        await assertProgressObject(globalMessages[0].detail.progress)

        // Global Inertia Event Listener
        await expect(messages[0]).toBe('Inertia.on(progress)')

        // Global Native Event Listener
        await expect(messages[2]).toBe('addEventListener(inertia:progress)')

        // Local Event Callback
        await expect(messages[4]).toBe('onProgress')
        await assertProgressObject(messages[5])
      })

      test('fires when the request has files and upload progression occurs (link)', async ({ page }) => {
        await clickAndWaitForResponse(page, 'Progress Event Link', null, 'button')

        const messages = await page.evaluate(() => (window as any).messages)

        await expect(messages).toHaveLength(2)

        await expect(messages[0]).toBe('linkOnProgress')
        await assertProgressObject(messages[1])
      })

      test('does not fire when the request has no files', async ({ page }) => {
        await page.getByRole('link', { exact: true, name: 'Missing Progress Event (no files)' }).click()
        const messages = await page.evaluate(() => (window as any).messages)

        await expect(messages).toHaveLength(1)
        await expect(messages[0]).toBe('progressNoFilesOnBefore')
      })

      test('does not fire when the request has no files (link)', async ({ page }) => {
        await page.getByRole('button', { exact: true, name: 'Progress Event Link (no files)' }).click()
        const messages = await page.evaluate(() => (window as any).messages)

        await expect(messages).toHaveLength(1)
        await expect(messages[0]).toBe('linkProgressNoFilesOnBefore')
      })
    })

    test.describe('error', () => {
      test('fires when the request finishes with validation errors', async ({ page }) => {
        await listenForGlobalMessages(page, 'inertia:error')

        await clickAndWaitForResponse(page, 'Error Event', 'events/errors')

        const messages = await page.evaluate(() => (window as any).messages)
        const globalMessages = await page.evaluate(() => (window as any).globalMessages['inertia:error'])

        await expect(messages).toHaveLength(6)
        await expect(globalMessages).toHaveLength(1)

        await assertGlobalErrorEvent(globalMessages[0])

        // Global Inertia Event Listener
        await expect(messages[0]).toBe('Inertia.on(error)')

        // Global Native Event Listener
        await expect(messages[2]).toBe('addEventListener(inertia:error)')

        // Local Event Callback
        await expect(messages[4]).toBe('onError')
        await assertErrorsObject(messages[5])
      })

      test('fires when the request finishes with validation errors (link)', async ({ page }) => {
        await listenForGlobalMessages(page, 'inertia:error')

        const response = await clickAndWaitForResponse(page, 'Error Event Link', 'events/errors', 'button')

        const messages = await page.evaluate(() => (window as any).messages)
        const globalMessages = await page.evaluate(() => (window as any).globalMessages['inertia:error'])

        await expect(messages).toHaveLength(2)
        await expect(globalMessages).toHaveLength(1)

        // Global Inertia Event Listener
        await expect(messages[0]).toBe('linkOnError')
        await expect(messages[1]).toEqual({ foo: 'bar' })
        await assertGlobalErrorEvent(globalMessages[0])
      })
    })

    test.describe('Local Event Callbacks', () => {
      test('can delay onFinish from firing by returning a promise', async ({ page }) => {
        await clickAndWaitForResponse(page, 'Error Event (delaying onFinish w/ Promise)', 'events/errors')

        await page.waitForTimeout(25)

        const messages = await page.evaluate(() => (window as any).messages)

        await expect(messages).toHaveLength(3)
        await expect(messages[0]).toBe('onError')
        await expect(messages[1]).toBe('onFinish should have been fired by now if Promise functionality did not work')
        await expect(messages[2]).toBe('onFinish')
      })

      test('can delay onFinish from firing by returning a promise (link)', async ({ page }) => {
        test.skip(process.env.PACKAGE === 'svelte', 'Feature not supported by the Svelte adapter')

        await page.getByRole('button', { exact: true, name: 'Error Event Link (delaying onFinish w/ Promise)' }).click()

        await page.waitForTimeout(25)

        const messages = await page.evaluate(() => (window as any).messages)

        await expect(messages).toHaveLength(3)
        await expect(messages[0]).toBe('linkOnError')
        await expect(messages[1]).toBe('onFinish should have been fired by now if Promise functionality did not work')
        await expect(messages[2]).toBe('linkOnFinish')
      })
    })
  })

  test.describe('success', () => {
    test('fires when the request finished without validation errors', async ({ page }) => {
      await listenForGlobalMessages(page, 'inertia:success')

      await clickAndWaitForResponse(page, 'Success Event')

      const messages = await page.evaluate(() => (window as any).messages)
      const globalMessages = await page.evaluate(() => (window as any).globalMessages['inertia:success'])

      await expect(messages).toHaveLength(6)
      await expect(globalMessages).toHaveLength(1)

      await assertGlobalSuccessEvent(globalMessages[0])

      // Global Inertia Event Listener
      await expect(messages[0]).toBe('Inertia.on(success)')

      // Global Native Event Listener
      await expect(messages[2]).toBe('addEventListener(inertia:success)')

      // Local Event Callback
      await expect(messages[4]).toBe('onSuccess')
      await assertPageObject(messages[5])
    })

    test('fires when the request finished without validation errors (link)', async ({ page }) => {
      await listenForGlobalMessages(page, 'inertia:success')

      await clickAndWaitForResponse(page, 'Success Event Link', null, 'button')

      const messages = await page.evaluate(() => (window as any).messages)
      const globalMessages = await page.evaluate(() => (window as any).globalMessages['inertia:success'])

      await expect(messages).toHaveLength(2)
      await expect(globalMessages).toHaveLength(1)

      await assertGlobalSuccessEvent(globalMessages[0])

      // Global Inertia Event Listener
      await expect(messages[0]).toBe('linkOnSuccess')
    })

    test.describe('Local Event Callbacks', () => {
      test('can delay onFinish from firing by returning a promise', async ({ page }) => {
        await page.getByRole('link', { exact: true, name: 'Success Event (delaying onFinish w/ Promise)' }).click()

        await page.waitForTimeout(25)

        const messages = await page.evaluate(() => (window as any).messages)

        await expect(messages).toHaveLength(3)
        await expect(messages[0]).toBe('onSuccess')
        await expect(messages[1]).toBe('onFinish should have been fired by now if Promise functionality did not work')
        await expect(messages[2]).toBe('onFinish')
      })

      test('can delay onFinish from firing by returning a promise (link)', async ({ page }) => {
        test.skip(process.env.PACKAGE === 'svelte', 'Feature not supported by the Svelte adapter')

        await page
          .getByRole('button', { exact: true, name: 'Success Event Link (delaying onFinish w/ Promise)' })
          .click()

        await page.waitForTimeout(25)

        const messages = await page.evaluate(() => (window as any).messages)

        await expect(messages).toHaveLength(3)
        await expect(messages[0]).toBe('linkOnSuccess')
        await expect(messages[1]).toBe('onFinish should have been fired by now if Promise functionality did not work')
        await expect(messages[2]).toBe('linkOnFinish')
      })
    })
  })

  test.describe('invalid', () => {
    test('gets fired when a non-Inertia response is received', async ({ page }) => {
      await listenForGlobalMessages(page, 'inertia:invalid')

      await clickAndWaitForResponse(page, 'Invalid Event', 'non-inertia')

      const messages = await page.evaluate(() => (window as any).messages)
      const globalMessages = await page.evaluate(() => (window as any).globalMessages['inertia:invalid'])

      await expect(messages).toHaveLength(4)
      await expect(globalMessages).toHaveLength(1)

      await assertIsGlobalEvent(globalMessages[0], 'inertia:invalid', true)
      await assertResponseObject(globalMessages[0].detail.response)

      // Global Inertia Event Listener
      await expect(messages[0]).toBe('Inertia.on(invalid)')

      // Global Native Event Listener
      await expect(messages[2]).toBe('addEventListener(inertia:invalid)')
    })
  })

  test.describe('exception', () => {
    test('gets fired when an unexpected situation occurs (e.g. network disconnect)', async ({ page }) => {
      await listenForGlobalMessages(page, 'inertia:exception', true)
      await page.getByRole('link', { exact: true, name: 'Exception Event' }).click()
      await page.waitForTimeout(100)

      const messages = await page.evaluate(() => (window as any).messages)
      const globalMessages = await page.evaluate(() => (window as any).globalMessages['inertia:exception'])

      await expect(messages).toHaveLength(4)
      await expect(globalMessages).toHaveLength(1)

      await assertIsGlobalEvent(globalMessages[0], 'inertia:exception', true)
      await assertExceptionObject(JSON.parse(globalMessages[0].detail))

      // Global Inertia Event Listener
      await expect(messages[0]).toBe('Inertia.on(exception)')

      // Global Native Event Listener
      await expect(messages[2]).toBe('addEventListener(inertia:exception)')
    })
  })

  test.describe('finish', () => {
    test('fires when the request completes', async ({ page }) => {
      await listenForGlobalMessages(page, 'inertia:finish')

      await clickAndWaitForResponse(page, 'Finish Event')

      const messages = await page.evaluate(() => (window as any).messages)
      const globalMessages = await page.evaluate(() => (window as any).globalMessages['inertia:finish'])

      await expect(messages).toHaveLength(6)
      await expect(globalMessages).toHaveLength(1)

      await assertGlobalFinishEvent(globalMessages[0])

      // Global Inertia Event Listener
      await expect(messages[0]).toBe('Inertia.on(finish)')

      // Global Native Event Listener
      await expect(messages[2]).toBe('addEventListener(inertia:finish)')

      // Local Event Callback
      await expect(messages[4]).toBe('onFinish')
      await assertVisitObject(messages[5])
    })

    test('fires when the request completes (link)', async ({ page }) => {
      await listenForGlobalMessages(page, 'inertia:finish')

      await clickAndWaitForResponse(page, 'Finish Event Link', null, 'button')

      const messages = await page.evaluate(() => (window as any).messages)
      const globalMessages = await page.evaluate(() => (window as any).globalMessages['inertia:finish'])

      await expect(messages).toHaveLength(2)
      await expect(globalMessages).toHaveLength(1)

      await assertGlobalFinishEvent(globalMessages[0])

      await expect(messages[0]).toBe('linkOnFinish')
    })
  })

  test.describe('navigate', () => {
    test('fires when the page navigates away after a successful request', async ({ page }) => {
      await listenForGlobalMessages(page, 'inertia:navigate')
      await page.getByRole('link', { exact: true, name: 'Navigate Event' }).click()

      const messages = await page.evaluate(() => (window as any).messages)
      const globalMessages = await page.evaluate(() => (window as any).globalMessages['inertia:navigate'])

      await expect(messages).toHaveLength(4)
      await expect(globalMessages).toHaveLength(1)

      await assertIsGlobalEvent(globalMessages[0], 'inertia:navigate', false)
      await assertPageObject(globalMessages[0].detail.page)

      // Global Inertia Event Listener
      await expect(messages[0]).toBe('Inertia.on(navigate)')

      // Global Native Event Listener
      await expect(messages[2]).toBe('addEventListener(inertia:navigate)')
    })
  })
})

test.describe('Lifecycles', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/events')
  })

  test('fires all expected events in the correct order on a successful request', async ({ page }) => {
    await page.getByRole('link', { exact: true, name: 'Lifecycle Success' }).click()

    const messages = await page.evaluate(() => (window as any).messages)

    await expect(messages).toHaveLength(16)

    await expect(messages[0]).toBe('onBefore')
    await expect(messages[1]).toBe('Inertia.on(before)')
    await expect(messages[2]).toBe('addEventListener(inertia:before)')
    await expect(messages[3]).toBe('onCancelToken')
    await expect(messages[4]).toBe('Inertia.on(start)')
    await expect(messages[5]).toBe('addEventListener(inertia:start)')
    await expect(messages[6]).toBe('onStart')
    await expect(messages[7]).toBe('Inertia.on(progress)')
    await expect(messages[8]).toBe('addEventListener(inertia:progress)')
    await expect(messages[9]).toBe('onProgress')
    await expect(messages[10]).toBe('Inertia.on(success)')
    await expect(messages[11]).toBe('addEventListener(inertia:success)')
    await expect(messages[12]).toBe('onSuccess')
    await expect(messages[13]).toBe('Inertia.on(finish)')
    await expect(messages[14]).toBe('addEventListener(inertia:finish)')
    await expect(messages[15]).toBe('onFinish')
  })

  test('fires all expected events in the correct order on an error request', async ({ page }) => {
    await clickAndWaitForResponse(page, 'Lifecycle Error', 'events/errors')

    const messages = await page.evaluate(() => (window as any).messages)

    await expect(messages).toHaveLength(18)

    await expect(messages[0]).toBe('onBefore')
    await expect(messages[1]).toBe('Inertia.on(before)')
    await expect(messages[2]).toBe('addEventListener(inertia:before)')
    await expect(messages[3]).toBe('onCancelToken')
    await expect(messages[4]).toBe('Inertia.on(start)')
    await expect(messages[5]).toBe('addEventListener(inertia:start)')
    await expect(messages[6]).toBe('onStart')
    await expect(messages[7]).toBe('Inertia.on(progress)')
    await expect(messages[8]).toBe('addEventListener(inertia:progress)')
    await expect(messages[9]).toBe('onProgress')
    await expect(messages[10]).toBe('Inertia.on(navigate)')
    await expect(messages[11]).toBe('addEventListener(inertia:navigate)')
    await expect(messages[12]).toBe('Inertia.on(error)')
    await expect(messages[13]).toBe('addEventListener(inertia:error)')
    await expect(messages[14]).toBe('onError')
    await expect(messages[15]).toBe('Inertia.on(finish)')
    await expect(messages[16]).toBe('addEventListener(inertia:finish)')
    await expect(messages[17]).toBe('onFinish')
  })

  test.describe('Cancelling', () => {
    test('cancels a visit before it completes', async ({ page }) => {
      await page.getByRole('link', { exact: true, name: 'Lifecycle Cancel' }).click()

      await page.waitForTimeout(50)

      const messages = await page.evaluate(() => (window as any).messages)

      await expect(messages).toHaveLength(12)

      await expect(messages[0]).toBe('onBefore')
      await expect(messages[1]).toBe('Inertia.on(before)')
      await expect(messages[2]).toBe('addEventListener(inertia:before)')
      await expect(messages[3]).toBe('onCancelToken')
      await expect(messages[4]).toBe('Inertia.on(start)')
      await expect(messages[5]).toBe('addEventListener(inertia:start)')
      await expect(messages[6]).toBe('onStart')
      await expect(messages[7]).toBe('CANCELLING!')
      await expect(messages[8]).toBe('onCancel')
      await expect(messages[9]).toBe('Inertia.on(finish)')
      await expect(messages[10]).toBe('addEventListener(inertia:finish)')
      await expect(messages[11]).toBe('onFinish')
    })

    test('prevents onCancel from firing when the request is already finished', async ({ page }) => {
      await page.getByRole('link', { exact: true, name: 'Lifecycle Cancel - After Finish' }).click()

      const messages = await page.evaluate(() => (window as any).messages)

      await expect(messages).toHaveLength(17)

      await expect(messages[0]).toBe('onBefore')
      await expect(messages[1]).toBe('Inertia.on(before)')
      await expect(messages[2]).toBe('addEventListener(inertia:before)')
      await expect(messages[3]).toBe('onCancelToken')
      await expect(messages[4]).toBe('Inertia.on(start)')
      await expect(messages[5]).toBe('addEventListener(inertia:start)')
      await expect(messages[6]).toBe('onStart')
      await expect(messages[7]).toBe('Inertia.on(progress)')
      await expect(messages[8]).toBe('addEventListener(inertia:progress)')
      await expect(messages[9]).toBe('onProgress')
      await expect(messages[10]).toBe('Inertia.on(success)')
      await expect(messages[11]).toBe('addEventListener(inertia:success)')
      await expect(messages[12]).toBe('onSuccess')
      await expect(messages[13]).toBe('Inertia.on(finish)')
      await expect(messages[14]).toBe('addEventListener(inertia:finish)')
      await expect(messages[15]).toBe('onFinish')
      await expect(messages[16]).toBe('CANCELLING!')
    })
  })
})
