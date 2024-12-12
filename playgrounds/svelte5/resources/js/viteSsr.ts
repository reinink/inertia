import { createInertiaApp } from '@inertiajs/svelte'
import type { AppCallback } from '@inertiajs/svelte/server'

const render: AppCallback = (page) =>
  createInertiaApp({
    page,
    resolve: (name) => import(`./Pages/${name}.svelte`),
  })

export default render
