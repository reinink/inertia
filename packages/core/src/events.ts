import { GlobalEventDetails, GlobalEventNames, GlobalEventTrigger } from './types'

function fireEvent<TEventName extends GlobalEventNames>(
  name: TEventName,
  options: CustomEventInit<GlobalEventDetails<TEventName>>,
): boolean {
  return document.dispatchEvent(new CustomEvent(`inertia:${name}`, options))
}

export const fireBeforeEvent: GlobalEventTrigger<'before'> = (visit) => {
  return fireEvent('before', { cancelable: true, detail: { visit } })
}

export const fireErrorEvent: GlobalEventTrigger<'error'> = (errors) => {
  return fireEvent('error', { detail: { errors } })
}

export const fireExceptionEvent: GlobalEventTrigger<'exception'> = (exception) => {
  return fireEvent('exception', { cancelable: true, detail: { exception } })
}

export const fireFinishEvent: GlobalEventTrigger<'finish'> = (visit) => {
  return fireEvent('finish', { detail: { visit } })
}

export const fireInvalidEvent: GlobalEventTrigger<'invalid'> = (response) => {
  return fireEvent('invalid', { cancelable: true, detail: { response } })
}

export const fireNavigateEvent: GlobalEventTrigger<'navigate'> = (page) => {
  return fireEvent('navigate', { detail: { page } })
}

export const fireProgressEvent: GlobalEventTrigger<'progress'> = (progress) => {
  return fireEvent('progress', { detail: { progress } })
}

export const fireStartEvent: GlobalEventTrigger<'start'> = (visit) => {
  return fireEvent('start', { detail: { visit } })
}

export const fireSuccessEvent: GlobalEventTrigger<'success'> = (page) => {
  return fireEvent('success', { detail: { page } })
}

export const fireHistoryEvent: GlobalEventTrigger<'history'> = (page) => {
  return fireEvent('history', { cancelable: true, detail: { page }})
}
