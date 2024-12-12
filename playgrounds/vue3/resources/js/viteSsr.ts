import { createInertiaApp } from '@inertiajs/vue3'
import type { AppCallback } from '@inertiajs/vue3/server'
import { renderToString } from '@vue/server-renderer'
import { createSSRApp, h } from 'vue'

const render: AppCallback = (page) =>
  createInertiaApp({
    page,
    render: renderToString,
    title: (title) => `${title} - Vue 3 Playground`,
    resolve: (name) => import(`./Pages/${name}.vue`),
    setup({ App, props, plugin }) {
      return createSSRApp({
        render: () => h(App, props),
      }).use(plugin)
    },
  })

export default render
