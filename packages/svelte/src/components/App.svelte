<script context="module" lang="ts">
  import type { ComponentResolver, ResolvedComponent } from '../types'
  import { type Page } from '@inertiajs/core'

  export interface InertiaAppProps {
    initialComponent: ResolvedComponent
    initialPage: Page
    handleScroll: boolean
    resolveComponent: ComponentResolver
  }
</script>

<script lang="ts">
  import type { LayoutType, LayoutResolver } from '../types'
  import { router, type PageProps } from '@inertiajs/core'
  import Render, { h, type RenderProps } from './Render.svelte'
  import { setPage } from '../page'

  export let initialComponent: InertiaAppProps['initialComponent']
  export let initialPage: InertiaAppProps['initialPage']
  export let resolveComponent: InertiaAppProps['resolveComponent']
  export let handleScroll: InertiaAppProps['handleScroll']

  let component = initialComponent
  let key: number | null = null
  let page = initialPage
  let renderProps = resolveRenderProps(component, page, key)

  setPage(page)

  const isServer = typeof window === 'undefined'

  if (!isServer) {
    router.init({
      initialPage,
      resolveComponent,
      handleScroll,
      swapComponent: async (args) => {
        component = args.component as ResolvedComponent
        page = args.page
        key = args.preserveState ? key : Date.now()

        renderProps = resolveRenderProps(component, page, key)
        setPage(page)
      },
    })
  }

  /**
   * Resolves the render props for the current page component, including layouts.
   */
  function resolveRenderProps(component: ResolvedComponent, page: Page, key: number | null = null): RenderProps {
    const child = h(component.default, page.props, [], key)
    const layout = component.layout

    return layout ? resolveLayout(layout, child, page.props, key) : child
  }

  /**
   * Builds the nested layout structure by wrapping the child component with the provided layouts.
   *
   * Resulting nested structure:
   *
   *    {
   *      "component": OuterLayout,
   *      "key": 123456,
   *      "children": [{
   *        "component": InnerLayout,
   *        "key": 123456,
   *        "children": [{
   *          "component": PageComponent,
   *          "key": 123456,
   *          "children": [],
   *        }],
   *      }],
   *    }
   */
  function resolveLayout(
    layout: LayoutType,
    child: RenderProps,
    pageProps: PageProps,
    key: number | null,
  ): RenderProps {
    if (isLayoutFunction(layout)) {
      return layout(h, child)
    }

    if (Array.isArray(layout)) {
      return layout
        .slice()
        .reverse()
        .reduce((currentRender, layoutComponent) => h(layoutComponent, pageProps, [currentRender], key), child)
    }

    return h(layout, pageProps, child ? [child] : [], key)
  }

  /**
   * Type guard to check if layout is a LayoutResolver
   */
  function isLayoutFunction(layout: LayoutType): layout is LayoutResolver {
    return typeof layout === 'function' && layout.length === 2 && typeof layout.prototype === 'undefined'
  }
</script>

<Render {...renderProps} />
