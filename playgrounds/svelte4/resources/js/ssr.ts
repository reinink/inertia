import { createInertiaApp, type ResolvedComponent } from '@inertiajs/svelte'
import createServer from '@inertiajs/svelte/server'

createServer((page) =>
  createInertiaApp({
    page,
    resolve: (name) => {
      const pages = import.meta.glob<ResolvedComponent>('./Pages/**/*.svelte', { eager: true })
      return pages[`./Pages/${name}.svelte`]
    },
    setup({ App, props }) {
      return App.render(props)
    },
  }),
)
