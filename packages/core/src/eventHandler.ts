import debounce from './debounce'
import { fireNavigateEvent } from './events'
import { history } from './history'
import { page as currentPage } from './page'
import { Scroll } from './scroll'
import { EventHandlerInitParams, GlobalEvent, GlobalEventNames, GlobalEventResult, InternalEvent } from './types'
import { hrefToUrl } from './url'

class EventHandler {
  protected internalListeners: {
    event: InternalEvent
    listener: VoidFunction
  }[] = []

  public init({ handleScroll }: EventHandlerInitParams) {
    if (typeof window !== 'undefined') {
      window.addEventListener('popstate', this.handlePopstateEvent.bind(this))
      if (handleScroll) {
        window.addEventListener('scroll', debounce(Scroll.onWindowScroll.bind(Scroll), 100), true)
      }
    }

    if (typeof document !== 'undefined' && handleScroll) {
      document.addEventListener('scroll', debounce(Scroll.onScroll.bind(Scroll), 100), true)
    }
  }

  public onGlobalEvent<TEventName extends GlobalEventNames>(
    type: TEventName,
    callback: (event: GlobalEvent<TEventName>) => GlobalEventResult<TEventName>,
  ): VoidFunction {
    const listener = ((event: GlobalEvent<TEventName>) => {
      const response = callback(event)

      if (event.cancelable && !event.defaultPrevented && response === false) {
        event.preventDefault()
      }
    }) as EventListener

    return this.registerListener(`inertia:${type}`, listener)
  }

  public on(event: InternalEvent, callback: VoidFunction): VoidFunction {
    this.internalListeners.push({ event, listener: callback })

    return () => {
      this.internalListeners = this.internalListeners.filter((listener) => listener.listener !== callback)
    }
  }

  public onMissingHistoryItem() {
    // At this point, the user has probably cleared the state
    // Mark the current page as cleared so that we don't try to write anything to it.
    currentPage.clear()
    // Fire an event so that that any listeners can handle this situation
    this.fireInternalEvent('missingHistoryItem')
  }

  public fireInternalEvent(event: InternalEvent): void {
    this.internalListeners.filter((listener) => listener.event === event).forEach((listener) => listener.listener())
  }

  protected registerListener(type: string, listener: EventListener): VoidFunction {
    document.addEventListener(type, listener)

    return () => document.removeEventListener(type, listener)
  }

  protected handlePopstateEvent(event: PopStateEvent): void {
    const state = event.state || null

    if (state === null) {
      const url = hrefToUrl(currentPage.get().url)
      url.hash = window.location.hash

      history.replaceState({ ...currentPage.get(), url: url.href })
      Scroll.reset()

      return
    }

    if (!history.isValidState(state)) {
      return this.onMissingHistoryItem()
    }

    history
      .decrypt(state.page)
      .then((data) => {
        currentPage.setQuietly(data, { preserveState: false }).then(() => {
          Scroll.restore(history.getScrollRegions())
          fireNavigateEvent(currentPage.get())
        })
      })
      .catch(() => {
        this.onMissingHistoryItem()
      })
  }
}

export const eventHandler = new EventHandler()
