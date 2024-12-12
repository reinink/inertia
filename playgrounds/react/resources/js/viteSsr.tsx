import { createInertiaApp } from '@inertiajs/react'
import type { AppCallback } from '@inertiajs/react/server'
import * as ReactDOMServer from 'react-dom/server'

const render: AppCallback = (page) =>
  createInertiaApp({
    page,
    render: ReactDOMServer.renderToString,
    title: (title) => `${title} - React Playground`,
    resolve: (name) => import(`./Pages/${name}.tsx`),
    setup: ({ App, props }) => <App {...props} />,
  })

  export default render
