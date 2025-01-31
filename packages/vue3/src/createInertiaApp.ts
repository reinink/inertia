import { Page, router, setupProgress } from '@inertiajs/core'
import { DefineComponent, Plugin, App as VueApp, createSSRApp, h } from 'vue'
import App, { InertiaApp, InertiaAppProps, plugin } from './app'

interface CreateInertiaAppProps {
  id?: string
  resolve: (name: string) => DefineComponent | Promise<DefineComponent> | { default: DefineComponent }
  setup: (props: { el: Element; App: InertiaApp; props: InertiaAppProps; plugin: Plugin }) => void | VueApp
  title?: (title: string) => string
  progress?:
    | false
    | {
        delay?: number
        color?: string
        includeCSS?: boolean
        showSpinner?: boolean
      }
  page?: Page
  render?: (app: VueApp) => Promise<string>
  keepAliveResolver?: (component: DefineComponent) => {
    enabled: boolean
    includes?: string[]
    maxLength?: number
  }
}

export default async function createInertiaApp({
  id = 'app',
  resolve,
  setup,
  title,
  progress = {},
  page,
  render,
  keepAliveResolver,
}: CreateInertiaAppProps): Promise<{ head: string[]; body: string }> {
  const isServer = typeof window === 'undefined'
  const el = isServer ? null : document.getElementById(id)
  const initialPage = page || JSON.parse(el.dataset.page)
  const resolveComponent = (name) => Promise.resolve(resolve(name)).then((module) => module.default || module)

  let head = []

  const vueApp = await Promise.all([
    resolveComponent(initialPage.component),
    router.decryptHistory().catch(() => {}),
  ]).then(([initialComponent]) => {
    return setup({
      el,
      App,
      props: {
        initialPage,
        initialComponent,
        resolveComponent,
        titleCallback: title,
        onHeadUpdate: isServer ? (elements) => (head = elements) : null,
        keepAliveResolver,
      },
      plugin,
    })
  })

  if (!isServer && progress) {
    setupProgress(progress)
  }

  if (isServer) {
    const body = await render(
      createSSRApp({
        render: () =>
          h('div', {
            id,
            'data-page': JSON.stringify(initialPage),
            innerHTML: vueApp ? render(vueApp) : '',
          }),
      }),
    )

    return { head, body }
  }
}
