import { router, setupProgress, type InertiaAppResponse, type Page } from '@inertiajs/core'
import escape from 'html-escape'
import type { ComponentType } from 'svelte'
import App, { type InertiaAppProps } from './components/App.svelte'
import type { ComponentResolver } from './types'

type SvelteRenderResult = { html: string; head: string; css?: { code: string } }
type AppComponent = ComponentType<App> & { render: (props: InertiaAppProps) => SvelteRenderResult }

interface CreateInertiaAppProps {
  id?: string
  resolve: ComponentResolver
  setup: (props: {
    el: HTMLElement | null
    App: AppComponent
    props: InertiaAppProps
  }) => void | App | SvelteRenderResult
  progress?:
    | false
    | {
        delay?: number
        color?: string
        includeCSS?: boolean
        showSpinner?: boolean
      }
  page?: Page
}

export default async function createInertiaApp({
  id = 'app',
  resolve,
  setup,
  progress = {},
  page,
}: CreateInertiaAppProps): InertiaAppResponse {
  const isServer = typeof window === 'undefined'
  const el = isServer ? null : document.getElementById(id)
  const initialPage: Page = page || JSON.parse(el?.dataset.page || '{}')
  const resolveComponent = (name: string) => Promise.resolve(resolve(name))

  const [initialComponent] = await Promise.all([
    resolveComponent(initialPage.component),
    router.decryptHistory().catch(() => {}),
  ])

  const props: InertiaAppProps = { initialPage, initialComponent, resolveComponent }

  const svelteApp = setup({
    el,
    App: App as unknown as AppComponent,
    props,
  })

  if (isServer) {
    const { html, head, css } = svelteApp as SvelteRenderResult

    return {
      body: `<div data-server-rendered="true" id="${id}" data-page="${escape(JSON.stringify(initialPage))}">${html}</div>`,
      head: [head, css ? `<style data-vite-css>${css.code}</style>` : ''],
    }
  }

  if (progress) {
    setupProgress(progress)
  }
}
