import debounce from './debounce'
import { fireNavigateEvent } from './events'
import { History } from './history'
import { page as currentPage } from './page'
import { Scroll } from './scroll'
import { GlobalEvent, GlobalEventNames, GlobalEventResult } from './types'
import { hrefToUrl } from './url'

type InternalEvent = 'missingHistoryItem'
class EventHandler {
  protected internalListeners: {
    event: InternalEvent
    listener: VoidFunction
  }[] = []

  public init() {
    window.addEventListener('popstate', this.handlePopstateEvent.bind(this))
    document.addEventListener('scroll', debounce(Scroll.onScroll.bind(Scroll), 100), true)
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

  protected fireInternalEvent(event: InternalEvent): void {
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

      History.replaceState({ ...currentPage.get(), url: url.href })
      Scroll.reset(currentPage.get())

      return
    }

    if (History.isValidState(state)) {
      History.decrypt(state.page)
        .then((data) => {
          currentPage.setQuietly(data, { preserveState: false }).then(() => {
            Scroll.restore(currentPage.get())
            fireNavigateEvent(currentPage.get())
          })
        })
        .catch(() => {
          this.onMissingHistoryItem()
        })

      return
    }

    this.onMissingHistoryItem()
  }
}

export const eventHandler = new EventHandler()