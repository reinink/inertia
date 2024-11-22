const path = require('path')
const express = require('express')
const inertia = require('./helpers')
const bodyParser = require('body-parser')
const multer = require('multer')

const app = express()
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json({ extended: true }))
const upload = multer()

// Used because Cypress does not allow you to navigate to a different origin URL within a single test.
app.all('/non-inertia', (req, res) => res.send('This is a page that does not have the Inertia app loaded.'))

// Intercepts all .js assets (including files loaded via code splitting)
app.get(/.*\.js$/, (req, res) =>
  res.sendFile(path.resolve(__dirname, '../../packages/', inertia.package, 'test-app/dist', req.path.substring(1))),
)

/**
 * Used for testing the Inertia plugin is registered.
 * @see plugin.test.js
 */
app.get('/plugin/*', (req, res) =>
  inertia.render(req, res, {
    component: 'Home',
    props: {
      example: 'FooBar',
    },
  }),
)

/**
 * Our actual 'app' routes
 */
app.get('/', (req, res) =>
  inertia.render(req, res, {
    component: 'Home',
    props: {
      example: 'FooBar',
    },
  }),
)

app.get('/links/partial-reloads', (req, res) =>
  inertia.render(req, res, {
    component: 'Links/PartialReloads',
    props: {
      headers: req.headers,
      foo: Number.parseInt(req.query.foo || 0) + 1,
      bar: (props) => props.foo + 1,
      baz: (props) => props.foo + 2,
    },
  }),
)
app.all('/links/preserve-state-page-two', (req, res) =>
  inertia.render(req, res, { component: 'Links/PreserveState', props: { foo: req.query.foo } }),
)
app.all('/links/preserve-scroll-page-two', (req, res) =>
  inertia.render(req, res, { component: 'Links/PreserveScroll', props: { foo: req.query.foo } }),
)
app.all('/links/preserve-scroll-false-page-two', (req, res) =>
  inertia.render(req, res, { component: 'Links/PreserveScrollFalse', props: { foo: req.query.foo } }),
)
app.get('/links/as-warning/:method', (req, res) =>
  inertia.render(req, res, { component: 'Links/AsWarning', props: { method: req.params.method } }),
)
app.get('/links/as-warning-false/:method', (req, res) =>
  inertia.render(req, res, { component: 'Links/AsWarningFalse', props: { method: req.params.method } }),
)
app.get('/links/headers/version', (req, res) =>
  inertia.render(req, res, { component: 'Links/Headers', version: 'example-version-header' }),
)
app.get('/links/data-loading', (req, res) => inertia.render(req, res, { component: 'Links/DataLoading' }))

app.get('/links/disabled', (req, res) => inertia.render(req, res, { component: 'Links/Disabled' }))

app.get('/visits/partial-reloads', (req, res) =>
  inertia.render(req, res, {
    component: 'Visits/PartialReloads',
    props: {
      headers: req.headers,
      foo: Number.parseInt(req.query.foo || 0) + 1,
      bar: (props) => props.foo + 1,
      baz: (props) => props.foo + 2,
    },
  }),
)
app.all('/visits/preserve-state-page-two', (req, res) =>
  inertia.render(req, res, { component: 'Visits/PreserveState', props: { foo: req.query.foo } }),
)
app.all('/visits/preserve-scroll-page-two', (req, res) =>
  inertia.render(req, res, { component: 'Visits/PreserveScroll', props: { foo: req.query.foo } }),
)
app.all('/visits/preserve-scroll-false-page-two', (req, res) =>
  inertia.render(req, res, { component: 'Visits/PreserveScrollFalse', props: { foo: req.query.foo } }),
)
app.post('/visits/events-errors', (req, res) =>
  inertia.render(req, res, { component: 'Visits/Events', props: { errors: { foo: 'bar' } } }),
)
app.get('/visits/headers/version', (req, res) =>
  inertia.render(req, res, { component: 'Visits/Headers', version: 'example-version-header' }),
)

app.post('/remember/form-helper/default', (req, res) =>
  inertia.render(req, res, {
    component: 'Remember/FormHelper/Default',
    props: { errors: { name: 'Some name error', handle: 'The Handle was invalid' } },
  }),
)
app.post('/remember/form-helper/remember', (req, res) =>
  inertia.render(req, res, {
    component: 'Remember/FormHelper/Remember',
    props: { errors: { name: 'Some name error', handle: 'The Handle was invalid' } },
  }),
)

app.post('/form-helper/data', (req, res) =>
  inertia.render(req, res, {
    component: 'FormHelper/Data',
    props: { errors: { name: 'Some name error', handle: 'The Handle was invalid' } },
  }),
)

app.post('/form-helper/errors', (req, res) =>
  inertia.render(req, res, {
    component: 'FormHelper/Errors',
    props: { errors: { name: 'Some name error', handle: 'The Handle was invalid' } },
  }),
)

app.post('/form-helper/events/errors', (req, res) => {
  setTimeout(() => {
    inertia.render(req, res, {
      component: 'FormHelper/Events',
      props: { errors: { name: 'Some name error', handle: 'The Handle was invalid' } },
    })
  }, 250)
})

app.get('/dump/get', upload.any(), (req, res) =>
  inertia.render(req, res, {
    component: 'Dump',
    props: { headers: req.headers, method: 'get', form: req.body, query: req.query, files: req.files },
  }),
)
app.post('/dump/post', upload.any(), (req, res) =>
  inertia.render(req, res, {
    component: 'Dump',
    props: { headers: req.headers, method: 'post', form: req.body, query: req.query, files: req.files },
  }),
)
app.put('/dump/put', upload.any(), (req, res) =>
  inertia.render(req, res, {
    component: 'Dump',
    props: { headers: req.headers, method: 'put', form: req.body, query: req.query, files: req.files },
  }),
)
app.patch('/dump/patch', upload.any(), (req, res) =>
  inertia.render(req, res, {
    component: 'Dump',
    props: { headers: req.headers, method: 'patch', form: req.body, query: req.query, files: req.files },
  }),
)
app.delete('/dump/delete', upload.any(), (req, res) =>
  inertia.render(req, res, {
    component: 'Dump',
    props: { headers: req.headers, method: 'delete', form: req.body, query: req.query, files: req.files },
  }),
)

app.get('/persistent-layouts/shorthand/simple/page-a', (req, res) =>
  inertia.render(req, res, { props: { foo: 'bar', baz: 'example' } }),
)
app.get('/persistent-layouts/shorthand/nested/page-a', (req, res) =>
  inertia.render(req, res, { props: { foo: 'bar', baz: 'example' } }),
)

app.post('/events/errors', (req, res) =>
  inertia.render(req, res, { component: 'Events', props: { errors: { foo: 'bar' } } }),
)

app.get('/poll/hook', (req, res) => inertia.render(req, res, { component: 'Poll/Hook', props: {} }))
app.get('/poll/hook/manual', (req, res) => inertia.render(req, res, { component: 'Poll/HookManual', props: {} }))
app.get('/poll/router/manual', (req, res) => inertia.render(req, res, { component: 'Poll/RouterManual', props: {} }))

app.get('/prefetch/:pageNumber', (req, res) => {
  inertia.render(req, res, {
    component: 'Prefetch/Page',
    props: {
      pageNumber: req.params.pageNumber,
      lastLoaded: Date.now(),
    },
  })
})

app.get('/prefetch/swr/:pageNumber', (req, res) => {
  const page = () => {
    inertia.render(req, res, {
      component: 'Prefetch/SWR',
      props: {
        pageNumber: req.params.pageNumber,
        lastLoaded: Date.now(),
      },
    })
  }

  if (req.params.pageNumber === '4' || req.params.pageNumber === '5') {
    setTimeout(page, 1500)
  } else {
    page()
  }
})

app.get('/history/:pageNumber', (req, res) => {
  inertia.render(req, res, {
    component: 'History/Page',
    props: {
      pageNumber: req.params.pageNumber,
      multiByte: req.params.pageNumber === '5' ? '😃' : 'n/a',
    },
    encryptHistory: req.params.pageNumber === '3' || req.params.pageNumber === '5',
    clearHistory: req.params.pageNumber === '4',
  })
})

app.get('/when-visible', (req, res) => {
  const page = () =>
    inertia.render(req, res, {
      component: 'WhenVisible',
      props: {},
    })

  if (req.headers['x-inertia-partial-data']) {
    setTimeout(page, 500)
  } else {
    page()
  }
})

app.get('/merge-props', (req, res) => {
  inertia.render(req, res, {
    component: 'MergeProps',
    props: {
      bar: new Array(5).fill(1),
      foo: new Array(5).fill(1),
    },
    ...(req.headers['x-inertia-reset'] ? {} : { mergeProps: ['foo'] }),
  })
})

app.get('/deferred-props/page-1', (req, res) => {
  if (!req.headers['x-inertia-partial-data']) {
    return inertia.render(req, res, {
      component: 'DeferredProps/Page1',
      deferredProps: {
        default: ['foo', 'bar'],
      },
      props: {},
    })
  }

  setTimeout(
    () =>
      inertia.render(req, res, {
        component: 'DeferredProps/Page1',
        props: {
          foo: req.headers['x-inertia-partial-data']?.includes('foo') ? { text: 'foo value' } : undefined,
          bar: req.headers['x-inertia-partial-data']?.includes('bar') ? { text: 'bar value' } : undefined,
        },
      }),
    500,
  )
})

app.get('/deferred-props/page-2', (req, res) => {
  if (!req.headers['x-inertia-partial-data']) {
    return inertia.render(req, res, {
      component: 'DeferredProps/Page2',
      deferredProps: {
        default: ['baz'],
        other: ['qux'],
      },
      props: {},
    })
  }

  if (req.headers['x-inertia-partial-data']?.includes('baz')) {
    setTimeout(
      () =>
        inertia.render(req, res, {
          component: 'DeferredProps/Page2',
          props: {
            baz: 'baz value',
          },
        }),
      500,
    )
  }

  if (req.headers['x-inertia-partial-data']?.includes('qux')) {
    setTimeout(
      () =>
        inertia.render(req, res, {
          component: 'DeferredProps/Page2',
          props: {
            qux: 'qux value',
          },
        }),
      750,
    )
  }
})

app.get('/svelte/props-and-page-store', (req, res) =>
  inertia.render(req, res, { component: 'Svelte/PropsAndPageStore', props: { foo: req.query.foo || 'default' }}),
)

app.all('/sleep', (req, res) => setTimeout(() => res.send(''), 2000))
app.post('/redirect', (req, res) => res.redirect(303, '/dump/get'))
app.get('/location', ({ res }) => inertia.location(res, '/dump/get'))
app.post('/redirect-external', (req, res) => inertia.location(res, '/non-inertia'))
app.post('/disconnect', (req, res) => res.socket.destroy())
app.post('/json', (req, res) => res.json({ foo: 'bar' }))

app.all('*', (req, res) => inertia.render(req, res))

const adapterPorts = {
  vue3: 13715,
  react: 13716,
  svelte: 13717,
}

app.listen(adapterPorts[process.env.PACKAGE || 'vue3'])
