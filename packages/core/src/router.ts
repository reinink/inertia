import { default as Axios, AxiosResponse } from 'axios'
import debounce from './debounce'
import {
  fireBeforeEvent,
  fireErrorEvent,
  fireExceptionEvent,
  fireFinishEvent,
  fireInvalidEvent,
  fireNavigateEvent,
  fireProgressEvent,
  fireStartEvent,
  fireSuccessEvent,
} from './events'
import { hasFiles } from './files'
import { objectToFormData } from './formData'
import modal from './modal'
import {
  ActiveVisit,
  GlobalEvent,
  GlobalEventNames,
  GlobalEventResult,
  LocationVisit,
  Page,
  PageHandler,
  PageResolver,
  PendingVisit,
  PreserveStateOption,
  RequestPayload,
  VisitId,
  VisitOptions,
} from './types'
import { hrefToUrl, mergeDataIntoQueryString, urlWithoutHash } from './url'

const isServer = typeof window === 'undefined'
const isChromeIOS = !isServer && /CriOS/.test(window.navigator.userAgent)
const isEdgeIOS = !isServer && /EdgiOS/.test(window.navigator.userAgent)
const cloneSerializable = <T>(obj: T): T => JSON.parse(JSON.stringify(obj))
const nextFrame = (callback: () => void) => {
  requestAnimationFrame(() => {
    requestAnimationFrame(callback)
  })
}

export class Router {
  protected page!: Page
  protected resolveComponent!: PageResolver
  protected swapComponent!: PageHandler
  protected navigationType?: string
  protected activeVisit?: ActiveVisit
  protected visitId: VisitId = null

  public init({
    initialPage,
    resolveComponent,
    swapComponent,
  }: {
    initialPage: Page
    resolveComponent: PageResolver
    swapComponent: PageHandler
  }): void {
    this.page = initialPage
    this.resolveComponent = resolveComponent
    this.swapComponent = swapComponent

    this.setNavigationType()
    this.clearRememberedStateOnReload()

    if (this.isBackForwardVisit()) {
      this.handleBackForwardVisit(this.page)
    } else if (this.isLocationVisit()) {
      this.handleLocationVisit(this.page)
    } else {
      this.handleInitialPageVisit(this.page)
    }

    this.setupEventListeners()
  }

  protected setNavigationType(): void {
    this.navigationType =
      window.performance &&
      window.performance.getEntriesByType &&
      window.performance.getEntriesByType('navigation').length > 0
        ? (window.performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming).type
        : 'navigate'
  }

  protected clearRememberedStateOnReload(): void {
    if (this.navigationType === 'reload' && window.history.state?.rememberedState) {
      delete window.history.state.rememberedState
    }
  }

  protected handleInitialPageVisit(page: Page): void {
    const hash = window.location.hash
    if (!this.page.url.includes(hash)) {
      this.page.url += hash
    }
    this.setPage(page, { preserveScroll: true, preserveState: true }).then(() => fireNavigateEvent(page))
  }

  protected setupEventListeners(): void {
    window.addEventListener('popstate', this.handlePopstateEvent.bind(this))
    document.addEventListener('scroll', debounce(this.handleScrollEvent.bind(this), 100), true)
  }

  protected scrollRegions(): NodeListOf<Element> {
    return document.querySelectorAll('[scroll-region]')
  }

  protected handleScrollEvent(event: Event): void {
    if (
      typeof (event.target as Element).hasAttribute === 'function' &&
      (event.target as Element).hasAttribute('scroll-region')
    ) {
      this.saveScrollPositions()
    }
  }

  protected saveScrollPositions(): void {
    this.replaceState({
      ...this.page,
      scrollRegions: Array.from(this.scrollRegions()).map((region) => {
        return {
          top: region.scrollTop,
          left: region.scrollLeft,
        }
      }),
    })
  }

  protected resetScrollPositions(): void {
    nextFrame(() => {
      window.scrollTo(0, 0)
      this.scrollRegions().forEach((region) => {
        if (typeof region.scrollTo === 'function') {
          region.scrollTo(0, 0)
        } else {
          region.scrollTop = 0
          region.scrollLeft = 0
        }
      })
      this.saveScrollPositions()
      if (window.location.hash) {
        document.getElementById(window.location.hash.slice(1))?.scrollIntoView()
      }
    })
  }

  protected restoreScrollPositions(): void {
    nextFrame(() => {
      if (!this.page.scrollRegions) return

      this.scrollRegions().forEach((region: Element, index: number) => {
        const scrollPosition = this.page.scrollRegions[index]
        if (!scrollPosition) {
          return
        } else if (typeof region.scrollTo === 'function') {
          region.scrollTo(scrollPosition.left, scrollPosition.top)
        } else {
          region.scrollTop = scrollPosition.top
          region.scrollLeft = scrollPosition.left
        }
      })
    })
  }

  protected isBackForwardVisit(): boolean {
    return window.history.state && this.navigationType === 'back_forward'
  }

  protected handleBackForwardVisit(page: Page): void {
    window.history.state.version = page.version
    this.setPage(window.history.state, { preserveScroll: true, preserveState: true }).then(() => {
      this.restoreScrollPositions()
      fireNavigateEvent(page)
    })
  }

  protected locationVisit(url: URL, preserveScroll: LocationVisit['preserveScroll']): boolean | void {
    try {
      const locationVisit: LocationVisit = { preserveScroll }
      window.sessionStorage.setItem('inertiaLocationVisit', JSON.stringify(locationVisit))
      window.location.href = url.href
      if (urlWithoutHash(window.location).href === urlWithoutHash(url).href) {
        window.location.reload()
      }
    } catch (error) {
      return false
    }
  }

  protected isLocationVisit(): boolean {
    try {
      return window.sessionStorage.getItem('inertiaLocationVisit') !== null
    } catch (error) {
      return false
    }
  }

  protected handleLocationVisit(page: Page): void {
    const locationVisit: LocationVisit = JSON.parse(window.sessionStorage.getItem('inertiaLocationVisit') || '')
    window.sessionStorage.removeItem('inertiaLocationVisit')
    page.url += window.location.hash
    page.rememberedState = window.history.state?.rememberedState ?? {}
    page.scrollRegions = window.history.state?.scrollRegions ?? []
    this.setPage(page, { preserveScroll: locationVisit.preserveScroll, preserveState: true }).then(() => {
      if (locationVisit.preserveScroll) {
        this.restoreScrollPositions()
      }
      fireNavigateEvent(page)
    })
  }

  protected isLocationVisitResponse(response: AxiosResponse): boolean {
    return !!(response && response.status === 409 && response.headers['x-inertia-location'])
  }

  protected isInertiaResponse(response: AxiosResponse): boolean {
    return !!response?.headers['x-inertia']
  }

  protected createVisitId(): VisitId {
    this.visitId = {}
    return this.visitId
  }

  protected cancelVisit(
    activeVisit: ActiveVisit,
    { cancelled = false, interrupted = false }: { cancelled?: boolean; interrupted?: boolean },
  ): void {
    if (activeVisit && !activeVisit.completed && !activeVisit.cancelled && !activeVisit.interrupted) {
      activeVisit.cancelToken.abort()
      activeVisit.onCancel()
      activeVisit.completed = false
      activeVisit.cancelled = cancelled
      activeVisit.interrupted = interrupted
      fireFinishEvent(activeVisit)
      activeVisit.onFinish(activeVisit)
    }
  }

  protected finishVisit(visit: ActiveVisit): void {
    if (!visit.cancelled && !visit.interrupted) {
      visit.completed = true
      visit.cancelled = false
      visit.interrupted = false
      fireFinishEvent(visit)
      visit.onFinish(visit)
    }
  }

  protected resolvePreserveOption(value: PreserveStateOption, page: Page): boolean {
    if (typeof value === 'function') {
      return value(page)
    } else if (value === 'errors') {
      return Object.keys(page.props.errors || {}).length > 0
    } else {
      return value
    }
  }

  public cancel(): void {
    if (this.activeVisit) {
      this.cancelVisit(this.activeVisit, { cancelled: true })
    }
  }

  public visit(
    href: string | URL,
    {
      method = 'get',
      data = {},
      replace = false,
      preserveScroll = false,
      preserveState = false,
      only = [],
      except = [],
      headers = {},
      errorBag = '',
      forceFormData = false,
      onCancelToken = () => {},
      onBefore = () => {},
      onStart = () => {},
      onProgress = () => {},
      onFinish = () => {},
      onCancel = () => {},
      onSuccess = () => {},
      onError = () => {},
      queryStringArrayFormat = 'brackets',
    }: VisitOptions = {},
  ): void {
    let url = typeof href === 'string' ? hrefToUrl(href) : href

    if ((hasFiles(data) || forceFormData) && !(data instanceof FormData)) {
      data = objectToFormData(data)
    }

    if (!(data instanceof FormData)) {
      const [_href, _data] = mergeDataIntoQueryString(method, url, data, queryStringArrayFormat)
      url = hrefToUrl(_href)
      data = _data
    }

    const visit: PendingVisit = {
      url,
      method,
      data,
      replace,
      preserveScroll,
      preserveState,
      only,
      except,
      headers,
      errorBag,
      forceFormData,
      queryStringArrayFormat,
      cancelled: false,
      completed: false,
      interrupted: false,
    }

    if (onBefore(visit) === false || !fireBeforeEvent(visit)) {
      return
    }

    if (this.activeVisit) {
      this.cancelVisit(this.activeVisit, { interrupted: true })
    }

    this.saveScrollPositions()

    const visitId = this.createVisitId()
    this.activeVisit = {
      ...visit,
      onCancelToken,
      onBefore,
      onStart,
      onProgress,
      onFinish,
      onCancel,
      onSuccess,
      onError,
      queryStringArrayFormat,
      cancelToken: new AbortController(),
    }

    onCancelToken({
      cancel: () => {
        if (this.activeVisit) {
          this.cancelVisit(this.activeVisit, { cancelled: true })
        }
      },
    })

    fireStartEvent(visit)
    onStart(visit)

    const isPartial = !!(only.length || except.length)

    Axios({
      method,
      url: urlWithoutHash(url).href,
      data: method === 'get' ? {} : data,
      params: method === 'get' ? data : {},
      signal: this.activeVisit.cancelToken.signal,
      headers: {
        ...headers,
        Accept: 'text/html, application/xhtml+xml',
        'X-Requested-With': 'XMLHttpRequest',
        'X-Inertia': true,
        ...(isPartial
          ? {
              'X-Inertia-Partial-Component': this.page.component,
            }
          : {}),
        ...(only.length
          ? {
              'X-Inertia-Partial-Data': only.join(','),
            }
          : {}),
        ...(except.length
          ? {
              'X-Inertia-Partial-Except': except.join(','),
            }
          : {}),
        ...(errorBag && errorBag.length ? { 'X-Inertia-Error-Bag': errorBag } : {}),
        ...(this.page.version ? { 'X-Inertia-Version': this.page.version } : {}),
      },
      onUploadProgress: (progress) => {
        if (data instanceof FormData) {
          progress.percentage = progress.progress ? Math.round(progress.progress * 100) : 0
          fireProgressEvent(progress)
          onProgress(progress)
        }
      },
    })
      .then((response) => {
        if (!this.isInertiaResponse(response)) {
          return Promise.reject({ response })
        }

        const pageResponse: Page = response.data
        if (isPartial && pageResponse.component === this.page.component) {
          pageResponse.props = { ...this.page.props, ...pageResponse.props }
        }
        preserveScroll = this.resolvePreserveOption(preserveScroll, pageResponse) as boolean
        preserveState = this.resolvePreserveOption(preserveState, pageResponse)
        if (preserveState && window.history.state?.rememberedState && pageResponse.component === this.page.component) {
          pageResponse.rememberedState = window.history.state.rememberedState
        }
        const requestUrl = url
        const responseUrl = hrefToUrl(pageResponse.url)
        if (requestUrl.hash && !responseUrl.hash && urlWithoutHash(requestUrl).href === responseUrl.href) {
          responseUrl.hash = requestUrl.hash
          pageResponse.url = responseUrl.href
        }
        return this.setPage(pageResponse, { visitId, replace, preserveScroll, preserveState })
      })
      .then(() => {
        const errors = this.page.props.errors || {}
        if (Object.keys(errors).length > 0) {
          const scopedErrors = errorBag ? (errors[errorBag] ? errors[errorBag] : {}) : errors
          fireErrorEvent(scopedErrors)
          return onError(scopedErrors)
        }
        fireSuccessEvent(this.page)
        return onSuccess(this.page)
      })
      .catch((error) => {
        if (this.isInertiaResponse(error.response)) {
          return this.setPage(error.response.data, { visitId })
        } else if (this.isLocationVisitResponse(error.response)) {
          const locationUrl = hrefToUrl(error.response.headers['x-inertia-location'])
          const requestUrl = url
          if (requestUrl.hash && !locationUrl.hash && urlWithoutHash(requestUrl).href === locationUrl.href) {
            locationUrl.hash = requestUrl.hash
          }
          this.locationVisit(locationUrl, preserveScroll === true)
        } else if (error.response) {
          if (fireInvalidEvent(error.response)) {
            modal.show(error.response.data)
          }
        } else {
          return Promise.reject(error)
        }
      })
      .then(() => {
        if (this.activeVisit) {
          this.finishVisit(this.activeVisit)
        }
      })
      .catch((error) => {
        if (!Axios.isCancel(error)) {
          const throwException = fireExceptionEvent(error)
          if (this.activeVisit) {
            this.finishVisit(this.activeVisit)
          }
          if (throwException) {
            return Promise.reject(error)
          }
        }
      })
  }

  protected setPage(
    page: Page,
    {
      visitId = this.createVisitId(),
      replace = false,
      preserveScroll = false,
      preserveState = false,
    }: {
      visitId?: VisitId
      replace?: boolean
      preserveScroll?: PreserveStateOption
      preserveState?: PreserveStateOption
    } = {},
  ): Promise<void> {
    return Promise.resolve(this.resolveComponent(page.component)).then((component) => {
      if (visitId === this.visitId) {
        page.scrollRegions = this.page.scrollRegions || []
        page.rememberedState = page.rememberedState || {}
        replace = replace || hrefToUrl(page.url).href === window.location.href
        replace ? this.replaceState(page) : this.pushState(page)
        this.swapComponent({ component, page, preserveState }).then(() => {
          preserveScroll ? this.restoreScrollPositions() : this.resetScrollPositions()

          if (!replace) {
            fireNavigateEvent(page)
          }
        })
      }
    })
  }

  protected pushState(page: Page): void {
    this.page = page
    if (isChromeIOS || isEdgeIOS) {
      // Defer history.pushState to the next event loop tick to prevent timing conflicts.
      // Ensure any previous history.replaceState completes before pushState is executed.
      setTimeout(() => window.history.pushState(cloneSerializable(page), '', page.url), 1)
    } else {
      window.history.pushState(cloneSerializable(page), '', page.url)
    }
  }

  protected replaceState(page: Page): void {
    this.page = page
    window.history.replaceState(cloneSerializable(page), '', page.url)
  }

  protected handlePopstateEvent(event: PopStateEvent): void {
    if (event.state !== null) {
      const page = event.state
      const visitId = this.createVisitId()
      Promise.resolve(this.resolveComponent(page.component)).then((component) => {
        if (visitId === this.visitId) {
          this.page = page
          this.swapComponent({ component, page, preserveState: false }).then(() => {
            this.restoreScrollPositions()
            fireNavigateEvent(page)
          })
        }
      })
    } else {
      const url = hrefToUrl(this.page.url)
      url.hash = window.location.hash
      this.replaceState({ ...this.page, url: url.href })
      this.resetScrollPositions()
    }
  }

  public get(url: URL | string, data: RequestPayload = {}, options: Omit<VisitOptions, 'method' | 'data'> = {}): void {
    return this.visit(url, { ...options, method: 'get', data })
  }

  public reload(options: Omit<VisitOptions, 'preserveScroll' | 'preserveState'> = {}): void {
    return this.visit(window.location.href, { ...options, preserveScroll: true, preserveState: true })
  }

  public replace(url: URL | string, options: Omit<VisitOptions, 'replace'> = {}): void {
    console.warn(
      `Inertia.replace() has been deprecated and will be removed in a future release. Please use Inertia.${
        options.method ?? 'get'
      }() instead.`,
    )
    return this.visit(url, { preserveState: true, ...options, replace: true })
  }

  public post(url: URL | string, data: RequestPayload = {}, options: Omit<VisitOptions, 'method' | 'data'> = {}): void {
    return this.visit(url, { preserveState: true, ...options, method: 'post', data })
  }

  public put(url: URL | string, data: RequestPayload = {}, options: Omit<VisitOptions, 'method' | 'data'> = {}): void {
    return this.visit(url, { preserveState: true, ...options, method: 'put', data })
  }

  public patch(
    url: URL | string,
    data: RequestPayload = {},
    options: Omit<VisitOptions, 'method' | 'data'> = {},
  ): void {
    return this.visit(url, { preserveState: true, ...options, method: 'patch', data })
  }

  public delete(url: URL | string, options: Omit<VisitOptions, 'method'> = {}): void {
    return this.visit(url, { preserveState: true, ...options, method: 'delete' })
  }

  public remember(data: unknown, key = 'default'): void {
    if (isServer) {
      return
    }

    this.replaceState({
      ...this.page,
      rememberedState: {
        ...this.page?.rememberedState,
        [key]: data,
      },
    })
  }

  public restore(key = 'default'): unknown {
    if (isServer) {
      return
    }

    return window.history.state?.rememberedState?.[key]
  }

  public on<TEventName extends GlobalEventNames>(
    type: TEventName,
    callback: (event: GlobalEvent<TEventName>) => GlobalEventResult<TEventName>,
  ): VoidFunction {
    if (isServer) {
      return () => {}
    }

    const listener = ((event: GlobalEvent<TEventName>) => {
      const response = callback(event)
      if (event.cancelable && !event.defaultPrevented && response === false) {
        event.preventDefault()
      }
    }) as EventListener

    document.addEventListener(`inertia:${type}`, listener)
    return () => document.removeEventListener(`inertia:${type}`, listener)
  }
}
