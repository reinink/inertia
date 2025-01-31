import { createHeadManager, Page, PageProps, router } from '@inertiajs/core'
import {
  computed,
  DefineComponent,
  defineComponent,
  h,
  markRaw,
  Plugin,
  PropType,
  reactive,
  ref,
  KeepAlive,
} from 'vue'
import remember from './remember'
import { VuePageHandlerArgs } from './types'
import useForm from './useForm'

interface KeepAliveOptions {
  enabled: boolean
  includes?: string[]
  maxLength?: number
}

export interface InertiaAppProps {
  initialPage: Page
  initialComponent?: object
  resolveComponent?: (name: string) => DefineComponent | Promise<DefineComponent>
  titleCallback?: (title: string) => string
  onHeadUpdate?: (elements: string[]) => void
  keepAliveResolver?: (component: DefineComponent) => KeepAliveOptions
}

export type InertiaApp = DefineComponent<InertiaAppProps>

const component = ref(null)
const page = ref<Page<any>>(null)
const key = ref(null)
let headManager = null

const App: InertiaApp = defineComponent({
  name: 'Inertia',
  props: {
    initialPage: {
      type: Object as PropType<Page>,
      required: true,
    },
    initialComponent: {
      type: Object,
      required: false,
    },
    resolveComponent: {
      type: Function as PropType<(name: string) => DefineComponent | Promise<DefineComponent>>,
      required: false,
    },
    titleCallback: {
      type: Function as PropType<(title: string) => string>,
      required: false,
      default: (title) => title,
    },
    onHeadUpdate: {
      type: Function as PropType<(elements: string[]) => void>,
      required: false,
      default: () => () => {},
    },
    keepAliveResolver: {
      type: Function as PropType<(component: DefineComponent) => KeepAliveOptions>,
      required: false,
      default: () => ({
        enabled: false,
      }),
    },
  },
  setup(props) {
    component.value = props.initialComponent ? markRaw(props.initialComponent) : null
    page.value = props.initialPage
    key.value = null

    const isServer = typeof window === 'undefined'
    headManager = createHeadManager(isServer, props.titleCallback, props.onHeadUpdate)

    if (!isServer) {
      router.init({
        initialPage: props.initialPage,
        resolveComponent: props.resolveComponent,
        swapComponent: async (args: VuePageHandlerArgs) => {
          component.value = markRaw(args.component)
          page.value = args.page

          const urlParams = new URLSearchParams(args.page.url.split('?')[1] || '')
          const id = urlParams.get('KeepAliveId')
          const componentName = (args.component as any)?.name || args.page.component
          
          if (id) {
            key.value = `${componentName}-${id}`
          } else if (args.preserveState) {
            key.value = key.value
          } else {
            // Use a combination of timestamp and random number to ensure uniqueness
            key.value = `${Date.now()}-${Math.random()}`
          }
        },
      })

      router.on('navigate', () => headManager.forceUpdate())
    }

    return () => {
      if (component.value) {
        component.value.inheritAttrs = !!component.value.inheritAttrs

        const componentName = (component.value as any)?.name || 
                            (component.value as any)?.__name ||
                            page.value?.component

        const componentKey = componentName || key.value

        const child = h(component.value, {
          ...page.value.props,
          key: componentKey,
        })

        const renderPage = () => {
          const keepAliveOptions = props.keepAliveResolver(component.value)

          if (keepAliveOptions.enabled) {
            return h(KeepAlive, {
              max: keepAliveOptions.maxLength || 10,
              include: keepAliveOptions.includes || [],
            }, () => child)
          }
          return child
        }

        if (component.value.layout) {
          if (typeof component.value.layout === 'function') {
            return component.value.layout(h, renderPage())
          }

          return (Array.isArray(component.value.layout) ? component.value.layout : [component.value.layout])
            .concat(renderPage())
            .reverse()
            .reduce((child, layout) => {
              layout.inheritAttrs = !!layout.inheritAttrs
              return h(layout, { ...page.value.props }, () => child)
            })
        }

        return renderPage()
      }
    }
  },
})
export default App

export const plugin: Plugin = {
  install(app) {
    router.form = useForm

    Object.defineProperty(app.config.globalProperties, '$inertia', { get: () => router })
    Object.defineProperty(app.config.globalProperties, '$page', { get: () => page.value })
    Object.defineProperty(app.config.globalProperties, '$headManager', { get: () => headManager })

    app.mixin(remember)
  },
}

export function usePage<SharedProps extends PageProps>(): Page<SharedProps> {
  return reactive({
    props: computed(() => page.value?.props),
    url: computed(() => page.value?.url),
    component: computed(() => page.value?.component),
    version: computed(() => page.value?.version),
    clearHistory: computed(() => page.value?.clearHistory),
    deferredProps: computed(() => page.value?.deferredProps),
    mergeProps: computed(() => page.value?.mergeProps),
    rememberedState: computed(() => page.value?.rememberedState),
    encryptHistory: computed(() => page.value?.encryptHistory),
  })
}
