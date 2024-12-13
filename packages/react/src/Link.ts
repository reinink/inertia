import {
  FormDataConvertible,
  mergeDataIntoQueryString,
  Method,
  PreserveStateOption,
  Progress,
  router,
  SerializationArrayFormat,
  shouldIntercept,
} from '@inertiajs/core'
import { createElement, forwardRef, useCallback } from 'react'

const noop = () => undefined

interface BaseInertiaLinkProps {
  as?: string
  data?: Record<string, FormDataConvertible>
  href: string
  method?: Method
  headers?: Record<string, string>
  onClick?: (event: React.MouseEvent<Element>) => void
  preserveScroll?: PreserveStateOption
  preserveState?: PreserveStateOption
  replace?: boolean
  only?: string[]
  except?: string[]
  onCancelToken?: (cancelToken: import('axios').CancelTokenSource) => void
  onBefore?: () => void
  onStart?: () => void
  onProgress?: (progress: Progress) => void
  onFinish?: () => void
  onCancel?: () => void
  onSuccess?: () => void
  onError?: () => void
  queryStringArrayFormat?: SerializationArrayFormat
  formDataArrayFormat?: SerializationArrayFormat
}

export type InertiaLinkProps = BaseInertiaLinkProps &
  Omit<React.HTMLAttributes<HTMLElement>, keyof BaseInertiaLinkProps> &
  Omit<React.AllHTMLAttributes<HTMLElement>, keyof BaseInertiaLinkProps>

const Link = forwardRef<unknown, InertiaLinkProps>(
  (
    {
      children,
      as = 'a',
      data = {},
      href,
      method = 'get',
      preserveScroll = false,
      preserveState = null,
      replace = false,
      only = [],
      except = [],
      headers = {},
      queryStringArrayFormat = 'brackets',
      formDataArrayFormat = 'indices',
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
    },
    ref,
  ) => {
    const visit = useCallback(
      (event: React.MouseEvent) => {
        onClick(event)

        if (shouldIntercept(event)) {
          event.preventDefault()

          router.visit(href, {
            data,
            method,
            preserveScroll,
            preserveState: preserveState ?? method !== 'get',
            replace,
            only,
            except,
            headers,
            formDataArrayFormat,
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
        replace,
        only,
        except,
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
    method = method.toLowerCase() as Method
    const [_href, _data] = mergeDataIntoQueryString(method, href || '', data, queryStringArrayFormat)
    href = _href
    data = _data

    if (as === 'a' && method !== 'get') {
      console.warn(
        `Creating POST/PUT/PATCH/DELETE <a> links is discouraged as it causes "Open Link in New Tab/Window" accessibility issues.\n\nPlease specify a more appropriate element using the "as" attribute. For example:\n\n<Link href="${href}" method="${method}" as="button">...</Link>`,
      )
    }

    return createElement(
      as,
      {
        ...props,
        ...(as === 'a' ? { href } : {}),
        ref,
        onClick: visit,
      },
      children,
    )
  },
)
Link.displayName = 'InertiaLink'

export default Link
