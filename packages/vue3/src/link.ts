import { mergeDataIntoQueryString, Method, PageProps, Progress, router, shouldIntercept } from '@inertiajs/core'
import { Component, defineComponent, DefineComponent, h, onMounted, PropType, ref } from 'vue'

export interface InertiaLinkProps {
  as?: string | Component
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
      type: [String, Object] as PropType<string | Component>,
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
    queryStringArrayFormat: {
      type: String as PropType<'brackets' | 'indices'>,
      default: 'brackets',
    },
  },
  setup(props, { slots, attrs }) {
    const internalRef = ref(null)

    onMounted(() => {
      if (!internalRef.value) {
        return
      }

      const element = internalRef.value.$el

      if (element.tagName !== 'A') {
        element.removeAttribute('href')
      }
    })

    return () => {
      const isAnchor = props.as === 'a' || props.as === 'A'
      const isCustomComponent = typeof props.as !== 'string'
      const method = props.method.toLowerCase() as Method
      const [href, data] = mergeDataIntoQueryString(method, props.href || '', props.data, props.queryStringArrayFormat)

      if (isAnchor && method !== 'get') {
        console.warn(
          `Creating POST/PUT/PATCH/DELETE <a> links is discouraged as it causes "Open Link in New Tab/Window" accessibility issues.\n\nPlease specify a more appropriate element using the "as" attribute. For example:\n\n<Link href="${href}" method="${method}" as="button">...</Link>`,
        )
      }

      return h(
        props.as,
        {
          ...attrs,
          ...(isAnchor || isCustomComponent ? { href } : {}),
          ...(isCustomComponent ? { ref: internalRef } : {}),
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
                // @ts-expect-error
                onCancelToken: attrs.onCancelToken || (() => ({})),
                // @ts-expect-error
                onBefore: attrs.onBefore || (() => ({})),
                // @ts-expect-error
                onStart: attrs.onStart || (() => ({})),
                // @ts-expect-error
                onProgress: attrs.onProgress || (() => ({})),
                // @ts-expect-error
                onFinish: attrs.onFinish || (() => ({})),
                // @ts-expect-error
                onCancel: attrs.onCancel || (() => ({})),
                // @ts-expect-error
                onSuccess: attrs.onSuccess || (() => ({})),
                // @ts-expect-error
                onError: attrs.onError || (() => ({})),
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
