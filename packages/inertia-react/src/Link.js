import { createElement, forwardRef, useCallback } from 'react'
import { Inertia, mergeDataIntoQueryString, shouldIntercept } from '@inertiajs/inertia'

const noop = () => undefined

export default forwardRef(function InertiaLink({
  children,
  as = 'a',
  data = {},
  href,
  method = 'get',
  preserveScroll = false,
  preserveState = null,
  disabled = false,
  replace = false,
  only = [],
  headers = {},
  onClick = noop,
  onCancelToken = noop,
  onBefore = noop,
  onStart = noop,
  onProgress = noop,
  onFinish = noop,
  onCancel = noop,
  onSuccess = noop,
  onError = noop,
  ...props
}, ref) {
  const visit = useCallback(
    (event) => {
      onClick(event)

      if (as === 'button' && disabled) {
        return
      }

      if (shouldIntercept(event)) {
        event.preventDefault()

        Inertia.visit(href, {
          data,
          method,
          preserveScroll,
          preserveState: preserveState ?? (method !== 'get'),
          replace,
          only,
          headers,
          onCancelToken,
          onBefore,
          onStart,
          onProgress,
          onFinish,
          onCancel,
          onSuccess,
          onError,
        })
      }
    },
    [
      data,
      href,
      method,
      preserveScroll,
      preserveState,
      disabled,
      replace,
      only,
      headers,
      onClick,
      onCancelToken,
      onBefore,
      onStart,
      onProgress,
      onFinish,
      onCancel,
      onSuccess,
      onError,
    ],
  )

  as = as.toLowerCase()
  method = method.toLowerCase()
  const [_href, _data] = mergeDataIntoQueryString(method, href || '', data)
  href = _href
  data = _data

  if (as === 'a' && method !== 'get') {
    console.warn(`Creating POST/PUT/PATCH/DELETE <a> links is discouraged as it causes "Open Link in New Tab/Window" accessibility issues.\n\nPlease specify a more appropriate element using the "as" attribute. For example:\n\n<InertiaLink href="${href}" method="${method}" as="button">...</InertiaLink>`)
  }

  return createElement(as, {
    ...props,
    ...as === 'a' ? { href } : {},
    ...as === 'button' && disabled ? { disabled } : {},
    ref,
    onClick: visit,
  }, children)
})
