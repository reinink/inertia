import { createInertiaApp } from '@inertiajs/vue3'
import { createSSRApp, h, type DefineComponent } from 'vue'

createInertiaApp({
  title: (title) => `${title} - Vue 3 Playground`,
  resolve: (name) => {
    const pages = import.meta.glob('./Pages/**/*.vue', { eager: true })
    return pages[`./Pages/${name}.vue`] as Promise<DefineComponent>
  },
  setup({ el, App, props, plugin }) {
    createSSRApp({ render: () => h(App, props) })
      .use(plugin)
      .mount(el)
  },
})
