import { mergeDataIntoQueryString, Method, PageProps, Progress, router, shouldIntercept } from '@inertiajs/core'
import { defineComponent, DefineComponent, h, PropType } from 'vue'

export interface InertiaLinkProps {
  as?: string
  data?: object
  href: string
  method?: Method
  headers?: object
  onClick?: (event: MouseEvent) => void
  preserveScroll?: boolean | ((props: PageProps) => boolean)
  preserveState?: boolean | ((props: PageProps) => boolean) | null
  replace?: boolean
  only?: string[]
  except?: string[]
  onCancelToken?: (cancelToken: import('axios').CancelTokenSource) => void
  onBefore?: () => void
  onError?: () => void
  onStart?: () => void
  onProgress?: (progress: Progress) => void
  onFinish?: () => void
  onCancel?: () => void
  onSuccess?: () => void
  queryStringArrayFormat?: 'brackets' | 'indices'
}

type InertiaLink = DefineComponent<InertiaLinkProps>

const Link: InertiaLink = defineComponent({
  name: 'Link',
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
      required: true,
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
      type: Array<string>,
      default: () => [],
    },
    except: {
      type: Array<string>,
      default: () => [],
    },
    headers: {
      type: Object,
      default: () => ({}),
    },
    onCancelToken: {
      default: () => (() => {}),
    },
    onBefore: {
      default: () => (() => {}),
    },
    onError: {
      default: () => (() => {}),
    },
    onStart: {
      default: () => (() => {}),
    },
    onProgress: {
      default: () => (() => {}),
    },
    onFinish: {
      default: () => (() => {}),
    },
    onCancel: {
      default: () => (() => {}),
    },
    onSuccess: {
      default: () => (() => {}),
    },
    queryStringArrayFormat: {
      type: String as PropType<'brackets' | 'indices'>,
      default: 'brackets',
    },
  },
  setup(props, { slots, attrs }) {
    return () => {
      const as = props.as.toLowerCase()
      const method = props.method.toLowerCase() as Method
      const [href, data] = mergeDataIntoQueryString(method, props.href || '', props.data, props.queryStringArrayFormat)

      if (as === 'a' && method !== 'get') {
        console.warn(
          `Creating POST/PUT/PATCH/DELETE <a> links is discouraged as it causes "Open Link in New Tab/Window" accessibility issues.\n\nPlease specify a more appropriate element using the "as" attribute. For example:\n\n<Link href="${href}" method="${method}" as="button">...</Link>`,
        )
      }

      return h(
        props.as,
        {
          ...attrs,
          ...(as === 'a' ? { href } : {}),
          onClick: (event) => {
            if (shouldIntercept(event)) {
              event.preventDefault()

              router.visit(href, {
                data: data,
                method: method,
                replace: props.replace,
                preserveScroll: props.preserveScroll,
                preserveState: props.preserveState ?? method !== 'get',
                only: props.only,
                except: props.except,
                headers: props.headers,
                onCancelToken: props.onCancelToken,
                onBefore: props.onBefore,
                onStart: props.onStart,
                onProgress: props.onProgress,
                onFinish: props.onFinish,
                onCancel: props.onCancel,
                onSuccess: props.onSuccess,
                onError: props.onError,
              })
            }
          },
        },
        slots,
      )
    }
  },
})

export default Link
