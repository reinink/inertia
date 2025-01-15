import {
  CacheForOption,
  FormDataConvertible,
  LinkPrefetchOption,
  mergeDataIntoQueryString,
  Method,
  PendingVisit,
  PreserveStateOption,
  Progress,
  router,
  shouldIntercept,
} from '@inertiajs/core'
import { computed, defineComponent, DefineComponent, h, onMounted, onUnmounted, PropType, ref } from 'vue'

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
  onStart?: (visit: PendingVisit) => void
  onProgress?: (progress: Progress) => void
  onFinish?: (visit: PendingVisit) => void
  onCancel?: () => void
  onSuccess?: () => void
  onError?: () => void
  queryStringArrayFormat?: 'brackets' | 'indices'
  async?: boolean
  prefetch?: boolean | LinkPrefetchOption | LinkPrefetchOption[]
  cacheFor?: CacheForOption | CacheForOption[]
}

type InertiaLink = DefineComponent<InertiaLinkProps>

// @ts-ignore
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
    queryStringArrayFormat: {
      type: String as PropType<'brackets' | 'indices'>,
      default: 'brackets',
    },
    async: {
      type: Boolean,
      default: false,
    },
    prefetch: {
      type: [Boolean, String, Array] as PropType<boolean | LinkPrefetchOption | LinkPrefetchOption[]>,
      default: false,
    },
    cacheFor: {
      type: [Number, String, Array] as PropType<CacheForOption | CacheForOption[]>,
      default: 0,
    },
    onStart: {
      type: Function as PropType<(visit: PendingVisit) => void>,
      default: (_visit: PendingVisit) => {},
    },
    onProgress: {
      type: Function as PropType<(progress: Progress) => void>,
      default: () => {},
    },
    onFinish: {
      type: Function as PropType<(visit: PendingVisit) => void>,
      default: () => {},
    },
    onBefore: {
      type: Function as PropType<() => void>,
      default: () => {},
    },
    onCancel: {
      type: Function as PropType<() => void>,
      default: () => {},
    },
    onSuccess: {
      type: Function as PropType<() => void>,
      default: () => {},
    },
    onError: {
      type: Function as PropType<() => void>,
      default: () => {},
    },
    onCancelToken: {
      type: Function as PropType<(cancelToken: import('axios').CancelTokenSource) => void>,
      default: () => {},
    },
  },
  setup(props, { slots, attrs }) {
    const inFlightCount = ref(0)
    const hoverTimeout = ref(null)

    const prefetchModes: LinkPrefetchOption[] = (() => {
      if (props.prefetch === true) {
        return ['hover']
      }

      if (props.prefetch === false) {
        return []
      }

      if (Array.isArray(props.prefetch)) {
        return props.prefetch
      }

      return [props.prefetch]
    })()

    const cacheForValue = (() => {
      if (props.cacheFor !== 0) {
        // If they've provided a value, respect it
        return props.cacheFor
      }

      if (prefetchModes.length === 1 && prefetchModes[0] === 'click') {
        // If they've only provided a prefetch mode of 'click',
        // we should only prefetch for the next request but not keep it around
        return 0
      }

      // Otherwise, default to 30 seconds
      return 30_000
    })()

    onMounted(() => {
      if (prefetchModes.includes('mount')) {
        prefetch()
      }
    })

    onUnmounted(() => {
      clearTimeout(hoverTimeout.value)
    })

    const method = props.method.toLowerCase() as Method
    const as = method !== 'get' ? 'button' : props.as.toLowerCase()
    const mergeDataArray = computed(() =>
      mergeDataIntoQueryString(method, props.href || '', props.data, props.queryStringArrayFormat),
    )
    const href = computed(() => mergeDataArray.value[0])
    const data = computed(() => mergeDataArray.value[1])

    const elProps = computed(() => ({
      a: { href: href.value },
      button: { type: 'button' },
    }))

    const baseParams = {
      data: data.value,
      method: method,
      replace: props.replace,
      preserveScroll: props.preserveScroll,
      preserveState: props.preserveState ?? method !== 'get',
      only: props.only,
      except: props.except,
      headers: props.headers,
      async: props.async,
    }

    const visitParams = {
      ...baseParams,
      onCancelToken: props.onCancelToken,
      onBefore: props.onBefore,
      onStart: (event) => {
        inFlightCount.value++
        props.onStart(event)
      },
      onProgress: props.onProgress,
      onFinish: (event) => {
        inFlightCount.value--
        props.onFinish(event)
      },
      onCancel: props.onCancel,
      onSuccess: props.onSuccess,
      onError: props.onError,
    }

    const prefetch = () => {
      router.prefetch(href.value, baseParams, { cacheFor: cacheForValue })
    }

    const regularEvents = {
      onClick: (event: Parameters<InertiaLinkProps['onClick']>[0]) => {
        if (shouldIntercept(event)) {
          event.preventDefault()
          router.visit(href.value, visitParams)
        }
      },
      onMouseenter: () => {
        hoverTimeout.value = setTimeout(() => {
          prefetch()
        }, 75)
      },
      onMouseleave: () => {
        clearTimeout(hoverTimeout.value)
      },
    }

    const prefetchHoverEvents = {
      onMouseenter: regularEvents.onMouseenter,
      onMouseleave: regularEvents.onMouseleave,
      onTouchstart: regularEvents.onMouseenter,
      onFocus: regularEvents.onMouseenter,
      onBlur: regularEvents.onMouseleave,
      onClick: regularEvents.onClick,
    }

    const prefetchClickEvents = {
      onMousedown: (event) => {
        if (shouldIntercept(event)) {
          event.preventDefault()
          prefetch()
        }
      },
      onMouseup: (event) => {
        event.preventDefault()
        router.visit(href.value, visitParams)
      },
      onClick: (event) => {
        if (shouldIntercept(event)) {
          // Let the mouseup event handle the visit
          event.preventDefault()
        }
      },
    }

    return () => {
      return h(
        as,
        {
          ...attrs,
          ...(elProps.value[as] || {}),
          'data-loading': inFlightCount.value > 0 ? '' : undefined,
          ...(() => {
            if (prefetchModes.includes('hover')) {
              return prefetchHoverEvents
            }

            if (prefetchModes.includes('click')) {
              return prefetchClickEvents
            }

            return regularEvents
          })(),
        },
        slots,
      )
    }
  },
})

export default Link
