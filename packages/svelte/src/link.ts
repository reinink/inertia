import {
  mergeDataIntoQueryString,
  router,
  shouldIntercept,
  type CacheForOption,
  type FormDataConvertible,
  type GlobalEventsMap,
  type LinkPrefetchOption,
  type Method,
  type VisitOptions,
} from '@inertiajs/core'
import type { CancelTokenSource } from 'axios'
import type { ActionReturn } from 'svelte/action'

type ActionEventHandlers = {
  [K in keyof HTMLElementEventMap]?: (event: HTMLElementEventMap[K]) => void
}

interface ActionElement extends HTMLElement {
  href?: string
}

type ActionParameters = Omit<VisitOptions, 'data' | 'prefetch'> & {
  href?: string
  data?: Record<string, FormDataConvertible>
  prefetch?: boolean | LinkPrefetchOption | LinkPrefetchOption[]
  cacheFor?: CacheForOption | CacheForOption[]
}

type SelectedEventKeys = 'start' | 'progress' | 'finish' | 'before' | 'cancel' | 'success' | 'error'
type SelectedGlobalEventsMap = Pick<GlobalEventsMap, SelectedEventKeys>
type ActionAttributes = {
  [K in keyof SelectedGlobalEventsMap as `on:${K}` | `on${K}`]?: (
    event: CustomEvent<SelectedGlobalEventsMap[K]['details']>,
  ) => void
} & {
  'on:cancel-token'?: (event: CustomEvent<CancelTokenSource>) => void
  oncanceltoken?: (event: CustomEvent<CancelTokenSource>) => void
}

function link(
  node: ActionElement,
  initialParams: ActionParameters = {},
): ActionReturn<ActionParameters, ActionAttributes> {
  let inFlightCount = 0
  let hoverTimeout: NodeJS.Timeout

  // Variables initialized and controlled by the "update" function
  let prefetchModes: LinkPrefetchOption[] = []
  let cacheForValue: CacheForOption | CacheForOption[]
  let method: Method
  let href: string
  let data
  let baseParams: VisitOptions
  let visitParams: VisitOptions

  const regularEvents = {
    click: (event) => {
      if (shouldIntercept(event)) {
        event.preventDefault()
        router.visit(href, visitParams)
      }
    },
    mouseenter: () => {
      hoverTimeout = setTimeout(() => prefetch(), 75)
    },
    mouseleave: () => {
      clearTimeout(hoverTimeout)
    },
  } satisfies ActionEventHandlers

  const prefetchHoverEvents = {
    mouseenter: regularEvents.mouseenter,
    mouseleave: regularEvents.mouseleave,
    touchstart: regularEvents.mouseenter,
    focus: regularEvents.mouseenter,
    blur: regularEvents.mouseleave,
    click: regularEvents.click,
  } satisfies ActionEventHandlers

  const prefetchClickEvents = {
    mousedown: (event) => {
      if (shouldIntercept(event)) {
        event.preventDefault()
        prefetch()
      }
    },
    mouseup: (event) => {
      event.preventDefault()
      router.visit(href, visitParams)
    },
    click: (event) => {
      if (shouldIntercept(event)) {
        // Let the mouseup event handle the visit
        event.preventDefault()
      }
    },
  } satisfies ActionEventHandlers

  function update({ cacheFor = 0, prefetch = false, ...params }: ActionParameters) {
    prefetchModes = (() => {
      if (prefetch === true) {
        return ['hover']
      }

      if (prefetch === false) {
        return []
      }

      return Array.isArray(prefetch) ? prefetch : [prefetch]
    })()

    cacheForValue = (() => {
      if (cacheFor !== 0) {
        // If they've provided a value, respect it
        return cacheFor
      }

      if (prefetchModes.length === 1 && prefetchModes[0] === 'click') {
        // If they've only provided a prefetch mode of 'click',
        // we should only prefetch for the next request but not keep it around
        return 0
      }

      // Otherwise, default to 30 seconds
      return 30_000
    })()

    method = (params.method?.toLowerCase() || 'get') as Method
    ;[href, data] = hrefAndData(method, params)

    if (node.tagName === 'A') {
      node.href = href
    }

    baseParams = {
      data,
      method,
      replace: params.replace || false,
      preserveScroll: params.preserveScroll || false,
      preserveState: params.preserveState ?? method !== 'get',
      only: params.only || [],
      except: params.except || [],
      headers: params.headers || {},
      async: params.async || false,
    }

    visitParams = {
      ...baseParams,
      onStart: (visit) => {
        inFlightCount++
        updateNodeAttributes()
        return dispatchEvent('start', { detail: { visit } })
      },
      onProgress: (progress) => dispatchEvent('progress', { detail: { progress } }),
      onFinish: (visit) => {
        inFlightCount--
        updateNodeAttributes()
        return dispatchEvent('finish', { detail: { visit } })
      },
      onBefore: (visit) => dispatchEvent('before', { cancelable: true, detail: { visit } }),
      onCancel: () => dispatchEvent('cancel'),
      onSuccess: (page) => dispatchEvent('success', { detail: { page } }),
      onError: (errors) => dispatchEvent('error', { detail: { errors } }),
      onCancelToken: (token) => dispatchEvent('cancel-token', { detail: { token } }),
    }

    updateEventListeners()
  }

  function dispatchEvent(type: string, detail = {}) {
    return node.dispatchEvent(new CustomEvent(type, detail))
  }

  function hrefAndData(method: Method, params: ActionParameters) {
    return mergeDataIntoQueryString(
      method,
      node.href || params.href || '',
      params.data || {},
      params.queryStringArrayFormat || 'brackets',
    )
  }

  function prefetch() {
    router.prefetch(href, baseParams, { cacheFor: cacheForValue })
  }

  function updateNodeAttributes() {
    if (inFlightCount > 0) {
      node.setAttribute('data-loading', '')
      return
    }

    node.removeAttribute('data-loading')
  }

  function updateEventListeners() {
    removeEventListeners()

    if (prefetchModes.includes('hover')) {
      addEventListeners(prefetchHoverEvents)
      return
    }

    if (prefetchModes.includes('click')) {
      addEventListeners(prefetchClickEvents)
      return
    }

    addEventListeners(regularEvents)
  }

  function addEventListeners(eventHandlers: ActionEventHandlers) {
    Object.entries(eventHandlers).forEach(([event, handler]) => {
      node.addEventListener(event as keyof HTMLElementEventMap, handler as EventListener)
    })
  }

  function removeEventListeners() {
    ;[prefetchHoverEvents, prefetchClickEvents, regularEvents].forEach((eventHandlers) => {
      Object.entries(eventHandlers).forEach(([event, handler]) => {
        node.removeEventListener(event as keyof HTMLElementEventMap, handler as EventListener)
      })
    })
  }

  function destroy() {
    clearTimeout(hoverTimeout)
    removeEventListeners()
  }

  update(initialParams)

  // TODO: Confirm is this needs to rerun when "prefetchModes" changes
  if (prefetchModes.includes('mount')) {
    prefetch()
  }

  return { update, destroy }
}

export default link
