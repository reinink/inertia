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
import { FunctionalComponentOptions, PropType } from 'vue'

export interface InertiaLinkProps {
  as?: string
  data?: Record<string, FormDataConvertible>
  href: string
  method?: Method
  headers?: Record<string, string>
  onClick?: (event: MouseEvent) => void
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
  queryStringArrayFormat?: SerializationArrayFormat
  formDataArrayFormat?: SerializationArrayFormat
}

type InertiaLink = FunctionalComponentOptions<InertiaLinkProps>

const Link: InertiaLink = {
  functional: true,
  props: {
    as: {
      type: String,
      default: 'a',
    },
    data: {
      type: Object,
      default: () => ({}),
    },
    href: {
      type: String,
    },
    method: {
      type: String as PropType<Method>,
      default: 'get',
    },
    replace: {
      type: Boolean,
      default: false,
    },
    preserveScroll: {
      type: Boolean,
      default: false,
    },
    preserveState: {
      type: Boolean,
      default: null,
    },
    only: {
      type: Array,
      default: () => [],
    },
    except: {
      type: Array,
      default: () => [],
    },
    headers: {
      type: Object,
      default: () => ({}),
    },
    queryStringArrayFormat: {
      type: String as PropType<SerializationArrayFormat>,
      default: 'brackets',
    },
    formDataArrayFormat: {
      type: String as PropType<SerializationArrayFormat>,
      default: 'indices',
    },
  },
  render(h, { props, data, children }) {
    data.on = {
      click: () => ({}),
      cancelToken: () => ({}),
      start: () => ({}),
      progress: () => ({}),
      finish: () => ({}),
      cancel: () => ({}),
      success: () => ({}),
      error: () => ({}),
      ...(data.on || {}),
    }

    const as = props.as.toLowerCase()
    const method = props.method.toLowerCase() as Method
    const [href, propsData] = mergeDataIntoQueryString(
      method,
      props.href || '',
      props.data,
      props.queryStringArrayFormat,
    )

    if (as === 'a' && method !== 'get') {
      console.warn(
        `Creating POST/PUT/PATCH/DELETE <a> links is discouraged as it causes "Open Link in New Tab/Window" accessibility issues.\n\nPlease specify a more appropriate element using the "as" attribute. For example:\n\n<Link href="${href}" method="${method}" as="button">...</Link>`,
      )
    }

    return h(
      props.as,
      {
        ...data,
        attrs: {
          ...data.attrs,
          ...(as === 'a' ? { href } : {}),
        },
        on: {
          ...data.on,
          click: (event) => {
            // @ts-expect-error
            data.on.click(event)

            if (shouldIntercept(event)) {
              event.preventDefault()

              router.visit(href, {
                data: propsData,
                method: method,
                replace: props.replace,
                preserveScroll: props.preserveScroll,
                preserveState: props.preserveState ?? method !== 'get',
                only: props.only,
                except: props.except,
                headers: props.headers,
                formDataArrayFormat: props.formDataArrayFormat,
                // @ts-expect-error
                onCancelToken: data.on.cancelToken,
                // @ts-expect-error
                onBefore: data.on.before,
                // @ts-expect-error
                onStart: data.on.start,
                // @ts-expect-error
                onProgress: data.on.progress,
                // @ts-expect-error
                onFinish: data.on.finish,
                // @ts-expect-error
                onCancel: data.on.cancel,
                // @ts-expect-error
                onSuccess: data.on.success,
                // @ts-expect-error
                onError: data.on.error,
              })
            }
          },
        },
      },
      children,
    )
  },
}
export default Link
