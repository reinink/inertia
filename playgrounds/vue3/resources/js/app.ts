import { createInertiaApp } from '@inertiajs/vue3'
import { createSSRApp, h, type DefineComponent } from 'vue'
import { useHead } from 'unhead'

useHead({
    titleTemplate: (title) => `${title} - Vue 3 Playground`,
})

createInertiaApp({
  resolve: (name) => {
    const pages = import.meta.glob('./Pages/**/*.vue', { eager: true })
    return pages[`./Pages/${name}.vue`] as DefineComponent
  },
  setup({ el, App, props, plugin }) {
    createSSRApp({ render: () => h(App, props) })
      .use(plugin)
      .mount(el)
  },
})
