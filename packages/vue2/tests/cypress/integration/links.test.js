import { tap } from '../support/commands'

describe('Links', () => {
  it('visits a different page', () => {
    cy.visit('/', {
      onLoad: () =>
        cy.on('window:load', () => {
          throw 'A location/non-SPA visit was detected'
        }),
    })

    cy.get('.links-method').click()
    cy.url().should('eq', Cypress.config().baseUrl + '/links/method')

    cy.get('.text').should('have.text', 'This is the links page that demonstrates inertia-link methods')
  })

  it('can make a location visit', () => {
    cy.visit('/links/location', {
      onLoad: () =>
        cy.on('window:load', () => {
          alert('A location/non-SPA visit was detected')
        }),
    })

    const alert = cy.stub()
    cy.on('window:alert', alert)

    cy.get('.example')
      .click()
      .then(() => {
        expect(alert.getCalls()).to.have.length(1)
        expect(alert.getCall(0)).to.be.calledWith('A location/non-SPA visit was detected')

        cy.url().should('eq', Cypress.config().baseUrl + '/dump/get')
        cy.window().should('have.property', '_inertia_request_dump')
        cy.window()
          .then((window) => window._inertia_request_dump)
          .then(({ headers }) => {
            expect(headers).to.not.have.property('x-inertia')
          })
      })
  })

  describe('Auto-cancellation', () => {
    it('will automatically cancel a pending visits when a new request is made', () => {
      cy.visit('/links/automatic-cancellation', {
        onLoad: () =>
          cy.on('window:load', () => {
            throw 'A location/non-SPA visit was detected'
          }),
      })

      const alert = cy.stub()
      cy.on('window:alert', alert)

      cy.get('.visit')
        .click()
        .click()
        .wait(30)
        .then(() => {
          expect(alert.getCalls()).to.have.length(3)
          expect(alert.getCall(0)).to.be.calledWith('started')
          expect(alert.getCall(1)).to.be.calledWith('cancelled')
          expect(alert.getCall(2)).to.be.calledWith('started')
        })
    })
  })

  describe('Method', () => {
    beforeEach(() => {
      cy.visit('/links/method', {
        onLoad: () =>
          cy.on('window:load', () => {
            throw 'A location/non-SPA visit was detected'
          }),
      })
    })

    it('can use the GET method', () => {
      cy.get('.get').click()
      cy.url().should('eq', Cypress.config().baseUrl + '/dump/get')

      cy.window().should('have.property', '_inertia_request_dump')
      cy.window()
        .then((window) => window._inertia_request_dump)
        .then(({ method, form, query }) => {
          expect(method).to.eq('get')
          expect(query).to.be.empty
          expect(form).to.be.empty
        })
    })

    it('can use the POST method', () => {
      cy.get('.post').click()
      cy.url().should('eq', Cypress.config().baseUrl + '/dump/post')

      cy.window().should('have.property', '_inertia_request_dump')
      cy.window()
        .then((window) => window._inertia_request_dump)
        .then(({ method, form, query }) => {
          expect(method).to.eq('post')
          expect(query).to.be.empty
          expect(form).to.be.empty
        })
    })

    it('can use the PUT method', () => {
      cy.get('.put').click()
      cy.url().should('eq', Cypress.config().baseUrl + '/dump/put')

      cy.window().should('have.property', '_inertia_request_dump')
      cy.window()
        .then((window) => window._inertia_request_dump)
        .then(({ method, form, query }) => {
          expect(method).to.eq('put')
          expect(query).to.be.empty
          expect(form).to.be.empty
        })
    })

    it('can use the PATCH method', () => {
      cy.get('.patch').click()
      cy.url().should('eq', Cypress.config().baseUrl + '/dump/patch')

      cy.window().should('have.property', '_inertia_request_dump')
      cy.window()
        .then((window) => window._inertia_request_dump)
        .then(({ method, form, query }) => {
          expect(method).to.eq('patch')
          expect(query).to.be.empty
          expect(form).to.be.empty
        })
    })

    it('can use the DELETE method', () => {
      cy.get('.delete').click()
      cy.url().should('eq', Cypress.config().baseUrl + '/dump/delete')

      cy.window().should('have.property', '_inertia_request_dump')
      cy.window()
        .then((window) => window._inertia_request_dump)
        .then(({ method, form, query }) => {
          expect(method).to.eq('delete')
          expect(query).to.be.empty
          expect(form).to.be.empty
        })
    })
  })

  describe('Data', () => {
    describe('plain objects', () => {
      beforeEach(() => {
        cy.intercept('/dump/**').as('spy')
        cy.visit('/links/data/object', {
          onLoad: () =>
            cy.on('window:load', () => {
              throw 'A location/non-SPA visit was detected'
            }),
        })
      })

      describe('GET method', () => {
        it('passes data as params', () => {
          cy.get('.get').click()

          cy.wait('@spy').then(({ request, response }) => {
            expect(request.url).to.eq(Cypress.config().baseUrl + '/dump/get?foo=get')
            expect(request.headers).to.contain.key('content-type')
            expect(request.headers['content-type']).to.contain('application/json')
            expect(request.method).to.eq('GET')
            expect(response.body.props.form).to.be.empty
            expect(response.body.props.files).to.be.undefined
          })
        })

        describe('query string array formatter', () => {
          it('can use the brackets query string array formatter', () => {
            cy.get('.qsaf-brackets').click()
            cy.wait('@spy')
              .its('request.url')
              .should('eq', Cypress.config().baseUrl + '/dump/get?a[]=b&a[]=c')
          })

          it('can use the indices query string array formatter', () => {
            cy.get('.qsaf-indices').click()
            cy.wait('@spy')
              .its('request.url')
              .should('eq', Cypress.config().baseUrl + '/dump/get?a[0]=b&a[1]=c')
          })

          it('defaults to using the brackets query string array formatter', () => {
            cy.get('.qsaf-default').click()
            cy.wait('@spy')
              .its('request.url')
              .should('eq', Cypress.config().baseUrl + '/dump/get?a[]=b&a[]=c')
          })
        })
      })

      it('can pass data using the POST method', () => {
        cy.get('.post').click()
        cy.wait('@spy').then(({ request, response }) => {
          expect(request.url).to.eq(Cypress.config().baseUrl + '/dump/post')
          expect(request.headers).to.contain.key('content-type')
          expect(request.headers['content-type']).to.contain('application/json')
          expect(request.method).to.eq('POST')
          expect(response.body.props.form).to.contain.key('bar')
          expect(response.body.props.form.bar).to.eq('post')
          expect(response.body.props.files).to.be.undefined
        })
      })

      it('can pass data using the PUT method', () => {
        cy.get('.put').click()
        cy.url().should('eq', Cypress.config().baseUrl + '/dump/put')

        cy.window().should('have.property', '_inertia_request_dump')
        cy.window()
          .then((window) => window._inertia_request_dump)
          .then(({ method, headers, form, files, query }) => {
            expect(headers).to.contain.key('content-type')
            expect(headers['content-type']).to.contain('application/json')

            expect(method).to.eq('put')
            expect(query).to.be.empty
            expect(form).to.contain.key('baz')
            expect(form.baz).to.eq('put')
            expect(files).to.be.empty
          })
      })

      it('can pass data using the PATCH method', () => {
        cy.get('.patch').click()
        cy.url().should('eq', Cypress.config().baseUrl + '/dump/patch')

        cy.window().should('have.property', '_inertia_request_dump')
        cy.window()
          .then((window) => window._inertia_request_dump)
          .then(({ method, headers, form, files, query }) => {
            expect(headers).to.contain.key('content-type')
            expect(headers['content-type']).to.contain('application/json')

            expect(method).to.eq('patch')
            expect(query).to.be.empty
            expect(form).to.contain.key('foo')
            expect(form.foo).to.eq('patch')
            expect(files).to.be.empty
          })
      })

      it('can pass data using the DELETE method', () => {
        cy.get('.delete').click()
        cy.url().should('eq', Cypress.config().baseUrl + '/dump/delete')

        cy.window().should('have.property', '_inertia_request_dump')
        cy.window()
          .then((window) => window._inertia_request_dump)
          .then(({ method, headers, form, files, query }) => {
            expect(headers).to.contain.key('content-type')
            expect(headers['content-type']).to.contain('application/json')

            expect(method).to.eq('delete')
            expect(query).to.be.empty
            expect(form).to.contain.key('bar')
            expect(form.bar).to.eq('delete')
            expect(files).to.be.empty
          })
      })
    })

    describe('FormData objects', () => {
      beforeEach(() => {
        cy.visit('/links/data/form-data', {
          onLoad: () =>
            cy.on('window:load', () => {
              throw 'A location/non-SPA visit was detected'
            }),
        })
      })

      it('can pass data using the POST method', () => {
        cy.get('.post').click()
        cy.url().should('eq', Cypress.config().baseUrl + '/dump/post')

        cy.window().should('have.property', '_inertia_request_dump')
        cy.window()
          .then((window) => window._inertia_request_dump)
          .then(({ method, headers, form, files, query }) => {
            expect(headers).to.contain.key('content-type')
            expect(headers['content-type']).to.contain('multipart/form-data; boundary=')

            expect(method).to.eq('post')
            expect(query).to.be.empty
            expect(form).to.contain.key('bar')
            expect(form.bar).to.eq('baz')
            expect(files).to.be.empty
          })
      })

      it('can pass data using the PUT method', () => {
        cy.get('.put').click()
        cy.url().should('eq', Cypress.config().baseUrl + '/dump/put')

        cy.window().should('have.property', '_inertia_request_dump')
        cy.window()
          .then((window) => window._inertia_request_dump)
          .then(({ method, headers, form, files, query }) => {
            expect(headers).to.contain.key('content-type')
            expect(headers['content-type']).to.contain('multipart/form-data; boundary=')

            expect(method).to.eq('put')
            expect(query).to.be.empty
            expect(form).to.contain.key('bar')
            expect(form.bar).to.eq('baz')
            expect(files).to.be.empty
          })
      })

      it('can pass data using the PATCH method', () => {
        cy.get('.patch').click()
        cy.url().should('eq', Cypress.config().baseUrl + '/dump/patch')

        cy.window().should('have.property', '_inertia_request_dump')
        cy.window()
          .then((window) => window._inertia_request_dump)
          .then(({ method, headers, form, files, query }) => {
            expect(headers).to.contain.key('content-type')
            expect(headers['content-type']).to.contain('multipart/form-data; boundary=')

            expect(method).to.eq('patch')
            expect(query).to.be.empty
            expect(form).to.contain.key('bar')
            expect(form.bar).to.eq('baz')
            expect(files).to.be.empty
          })
      })

      it('can pass data using the DELETE method', () => {
        cy.get('.delete').click()
        cy.url().should('eq', Cypress.config().baseUrl + '/dump/delete')

        cy.window().should('have.property', '_inertia_request_dump')
        cy.window()
          .then((window) => window._inertia_request_dump)
          .then(({ method, headers, form, files, query }) => {
            expect(headers).to.contain.key('content-type')
            expect(headers['content-type']).to.contain('multipart/form-data; boundary=')

            expect(method).to.eq('delete')
            expect(query).to.be.empty
            expect(form).to.contain.key('bar')
            expect(form.bar).to.eq('baz')
            expect(files).to.be.empty
          })
      })
    })

    describe('auto-converted objects (when files are present)', () => {
      beforeEach(() => {
        cy.visit('/links/data/auto-converted', {
          onLoad: () =>
            cy.on('window:load', () => {
              throw 'A location/non-SPA visit was detected'
            }),
        })
      })

      it('auto-converts objects to form-data when files are present using the POST method', () => {
        cy.get('.post').click()
        cy.url().should('eq', Cypress.config().baseUrl + '/dump/post')

        cy.window().should('have.property', '_inertia_request_dump')
        cy.window()
          .then((window) => window._inertia_request_dump)
          .then(({ method, headers, form, files, query }) => {
            expect(headers).to.contain.key('content-type')
            expect(headers['content-type']).to.contain('multipart/form-data; boundary=')

            expect(method).to.eq('post')
            expect(query).to.be.empty
            expect(form).to.contain.key('foo')
            expect(form.foo).to.eq('bar')
            expect(files).to.not.be.empty
          })
      })

      it('auto-converts objects to form-data when files are present using the PUT method', () => {
        cy.get('.put').click()
        cy.url().should('eq', Cypress.config().baseUrl + '/dump/put')

        cy.window().should('have.property', '_inertia_request_dump')
        cy.window()
          .then((window) => window._inertia_request_dump)
          .then(({ method, headers, form, files, query }) => {
            expect(headers).to.contain.key('content-type')
            expect(headers['content-type']).to.contain('multipart/form-data; boundary=')

            expect(method).to.eq('put')
            expect(query).to.be.empty
            expect(form).to.contain.key('foo')
            expect(form.foo).to.eq('bar')
            expect(files).to.not.be.empty
          })
      })

      it('auto-converts objects to form-data when files are present using the PATCH method', () => {
        cy.get('.patch').click()
        cy.url().should('eq', Cypress.config().baseUrl + '/dump/patch')

        cy.window().should('have.property', '_inertia_request_dump')
        cy.window()
          .then((window) => window._inertia_request_dump)
          .then(({ method, headers, form, files, query }) => {
            expect(headers).to.contain.key('content-type')
            expect(headers['content-type']).to.contain('multipart/form-data; boundary=')

            expect(method).to.eq('patch')
            expect(query).to.be.empty
            expect(form).to.contain.key('foo')
            expect(form.foo).to.eq('bar')
            expect(files).to.not.be.empty
          })
      })

      it('auto-converts objects to form-data when files are present using the DELETE method', () => {
        cy.get('.delete').click()
        cy.url().should('eq', Cypress.config().baseUrl + '/dump/delete')

        cy.window().should('have.property', '_inertia_request_dump')
        cy.window()
          .then((window) => window._inertia_request_dump)
          .then(({ method, headers, form, files, query }) => {
            expect(headers).to.contain.key('content-type')
            expect(headers['content-type']).to.contain('multipart/form-data; boundary=')

            expect(method).to.eq('delete')
            expect(query).to.be.empty
            expect(form).to.contain.key('foo')
            expect(form.foo).to.eq('bar')
            expect(files).to.not.be.empty
          })
      })
    })
  })

  describe('Headers', () => {
    it('has the default set of headers', () => {
      cy.visit('/links/headers', {
        onLoad: () =>
          cy.on('window:load', () => {
            throw 'A location/non-SPA visit was detected'
          }),
      })

      cy.get('.default').click()
      cy.url().should('eq', Cypress.config().baseUrl + '/dump/get')

      cy.window().should('have.property', '_inertia_request_dump')
      cy.window()
        .then((window) => window._inertia_request_dump)
        .then(({ headers }) => {
          expect(headers).to.contain.keys(['accept', 'x-requested-with', 'x-inertia'])
          expect(headers).to.not.contain.key('x-inertia-version')
          expect(headers['accept']).to.eq('text/html, application/xhtml+xml')
          expect(headers['x-requested-with']).to.eq('XMLHttpRequest')
          expect(headers['x-inertia']).to.eq('true')
        })
    })

    it('starts using the x-inertia-version header when a version was given from the back-end', () => {
      cy.visit('/links/headers/version', {
        onLoad: () =>
          cy.on('window:load', () => {
            throw 'A location/non-SPA visit was detected'
          }),
      })

      cy.get('.default').click()
      cy.url().should('eq', Cypress.config().baseUrl + '/dump/get')

      cy.window().should('have.property', '_inertia_request_dump')
      cy.window()
        .then((window) => window._inertia_request_dump)
        .then(({ headers }) => {
          expect(headers).to.contain.key('x-inertia-version')
          expect(headers['x-inertia-version']).to.eq('example-version-header')
        })
    })

    it('allows to set custom headers', () => {
      cy.visit('/links/headers', {
        onLoad: () =>
          cy.on('window:load', () => {
            throw 'A location/non-SPA visit was detected'
          }),
      })

      cy.get('.custom').click()
      cy.url().should('eq', Cypress.config().baseUrl + '/dump/get')

      cy.window().should('have.property', '_inertia_request_dump')
      cy.window()
        .then((window) => window._inertia_request_dump)
        .then(({ headers }) => {
          expect(headers).to.contain.keys(['accept', 'x-requested-with', 'x-inertia', 'foo'])
          expect(headers['accept']).to.eq('text/html, application/xhtml+xml')
          expect(headers['x-requested-with']).to.eq('XMLHttpRequest')
          expect(headers['x-inertia']).to.eq('true')
          expect(headers['foo']).to.eq('bar')
        })
    })

    it('cannot override built-in Inertia headers', () => {
      cy.visit('/links/headers', {
        onLoad: () =>
          cy.on('window:load', () => {
            throw 'A location/non-SPA visit was detected'
          }),
      })

      cy.get('.overridden').click()
      cy.url().should('eq', Cypress.config().baseUrl + '/dump/post')

      cy.window().should('have.property', '_inertia_request_dump')
      cy.window()
        .then((window) => window._inertia_request_dump)
        .then(({ headers }) => {
          expect(headers).to.contain.keys(['accept', 'x-requested-with', 'x-inertia', 'bar'])
          expect(headers['accept']).to.eq('text/html, application/xhtml+xml')
          expect(headers['x-requested-with']).to.eq('XMLHttpRequest')
          expect(headers['x-inertia']).to.eq('true')
          expect(headers['bar']).to.eq('baz')
        })
    })
  })

  describe('Replace', () => {
    beforeEach(() => {
      cy.visit('/')
      cy.window().then((window) => (window._inertia_spa_page_load = true))
      cy.get('.links-replace').click()
      cy.url().should('eq', Cypress.config().baseUrl + '/links/replace')
    })

    afterEach(() => {
      cy.window().should('have.prop', '_inertia_spa_page_load')
    })

    it('replaces the current history state', () => {
      cy.get('.replace').click()
      cy.url().should('eq', Cypress.config().baseUrl + '/dump/get')

      cy.go(-1)
      cy.url().should('eq', Cypress.config().baseUrl + '/')

      cy.go(1)
      cy.url().should('eq', Cypress.config().baseUrl + '/dump/get')
    })

    it('does not replace the current history state when it is set to false', () => {
      cy.get('.replace-false').click()
      cy.url().should('eq', Cypress.config().baseUrl + '/dump/get')

      cy.go(-1)
      cy.url().should('eq', Cypress.config().baseUrl + '/links/replace')

      cy.go(1)
      cy.url().should('eq', Cypress.config().baseUrl + '/dump/get')
    })
  })

  describe('Preserve state', () => {
    beforeEach(() => {
      cy.visit('/links/preserve-state', {
        onLoad: () =>
          cy.on('window:load', () => {
            throw 'A location/non-SPA visit was detected'
          }),
      })
    })

    it("preserves the page's local state", () => {
      cy.get('.foo').should('have.text', 'Foo is now default')
      cy.get('.field').type('Example value')

      cy.window().should('have.property', '_inertia_page_key')
      cy.window().then((window) => {
        const componentKey = window._inertia_page_key

        cy.get('.preserve').click()
        cy.url().should('eq', Cypress.config().baseUrl + '/links/preserve-state-page-two')

        cy.window().then((window) => {
          expect(componentKey).to.eq(window._inertia_page_key)
          cy.get('.foo').should('have.text', 'Foo is now bar')
          cy.get('.field').should('have.value', 'Example value')
        })
      })
    })

    it("preserves the page's local state (callback)", () => {
      cy.get('.foo').should('have.text', 'Foo is now default')
      cy.get('.field').type('Example value')

      cy.window().should('have.property', '_inertia_page_key')
      cy.window().then((window) => {
        const componentKey = window._inertia_page_key

        cy.get('.preserve-callback').click()
        cy.url().should('eq', Cypress.config().baseUrl + '/links/preserve-state-page-two')

        cy.window().then((window) => {
          expect(componentKey).to.eq(window._inertia_page_key)
          cy.get('.foo').should('have.text', 'Foo is now callback-bar')
          cy.get('.field').should('have.value', 'Example value')
        })
      })
    })

    it("does not preserve the page's local state", () => {
      cy.get('.foo').should('have.text', 'Foo is now default')
      cy.get('.field').type('Another value')

      cy.window().should('have.property', '_inertia_page_key')
      cy.window().then((window) => {
        const componentKey = window._inertia_page_key

        cy.get('.preserve-false').click()
        cy.url().should('eq', Cypress.config().baseUrl + '/links/preserve-state-page-two')

        cy.window().then((window) => {
          expect(componentKey).to.not.eq(window._inertia_page_key)
          cy.get('.foo').should('have.text', 'Foo is now baz')
          cy.get('.field').should('have.value', '')
        })
      })
    })

    it("does not preserve the page's local state (callback)", () => {
      cy.get('.foo').should('have.text', 'Foo is now default')
      cy.get('.field').type('Another value')

      cy.window().should('have.property', '_inertia_page_key')
      cy.window().then((window) => {
        const componentKey = window._inertia_page_key

        cy.get('.preserve-callback-false').click()
        cy.url().should('eq', Cypress.config().baseUrl + '/links/preserve-state-page-two')

        cy.window().then((window) => {
          expect(componentKey).to.not.eq(window._inertia_page_key)
          cy.get('.foo').should('have.text', 'Foo is now callback-baz')
          cy.get('.field').should('have.value', '')
        })
      })
    })
  })

  describe('Preserve scroll', () => {
    let alert = null

    beforeEach(() => {
      alert = cy.stub()
      cy.on('window:alert', alert)
    })

    describe('disabled (default)', () => {
      beforeEach(() => {
        cy.visit('/links/preserve-scroll-false')
        cy.get('.foo').should('have.text', 'Foo is now default')
        cy.scrollTo('5px', '7px')
        cy.get('#slot').scrollTo('10px', '15px')
        cy.get('.document-position').should('have.text', 'Document scroll position is 5 & 7')
        cy.get('.slot-position').should('have.text', 'Slot scroll position is 10 & 15')
      })

      it('does not reset untracked scroll regions in persistent layouts', () => {
        cy.get('.reset')
          .click({ force: true })
          .then(() => {
            cy.url().should('eq', Cypress.config().baseUrl + '/links/preserve-scroll-false-page-two')

            cy.get('.foo').should('have.text', 'Foo is now bar')
            cy.get('.document-position').should('have.text', 'Document scroll position is 0 & 0')
            cy.get('.slot-position').should('have.text', 'Slot scroll position is 10 & 15')
          })
      })

      it('does not reset untracked scroll regions in persistent layouts when returning false from a preserveScroll callback', () => {
        cy.get('.reset-callback')
          .click({ force: true })
          .then(() => {
            cy.url().should('eq', Cypress.config().baseUrl + '/links/preserve-scroll-false-page-two')
            cy.get('.foo').should('have.text', 'Foo is now foo')

            cy.get('.document-position').should('have.text', 'Document scroll position is 0 & 0')
            cy.get('.slot-position').should('have.text', 'Slot scroll position is 10 & 15')

            // Assert that the page is passed in to the callback
            expect(alert.getCalls()).to.have.length(1)
            tap(alert.getCall(0).lastArg, (page) => {
              expect(page).to.be.an('object')
              expect(page).to.have.property('component')
              expect(page).to.have.property('props')
              expect(page).to.have.property('url')
              expect(page).to.have.property('version')
            })
          })
      })

      it('does not restore untracked scroll regions when pressing the back button', () => {
        cy.get('.reset')
          .click({ force: true })
          .then(() => {
            cy.url().should('eq', Cypress.config().baseUrl + '/links/preserve-scroll-false-page-two')
            cy.get('.foo').should('have.text', 'Foo is now bar')
            cy.get('#slot').scrollTo(0, 0)
            cy.get('.slot-position').should('have.text', 'Slot scroll position is 0 & 0')

            return cy.go(-1)
          })
          .then(() => {
            cy.url().should('eq', Cypress.config().baseUrl + '/links/preserve-scroll-false')
            cy.get('.foo').should('have.text', 'Foo is now default')

            cy.get('.document-position').should('have.text', 'Document scroll position is 5 & 7')
            cy.get('.slot-position').should('have.text', 'Slot scroll position is 0 & 0')
          })
      })

      it('does not restore untracked scroll regions when returning true from a preserveScroll callback', () => {
        cy.get('.preserve-callback')
          .click({ force: true })
          .then(() => {
            cy.url().should('eq', Cypress.config().baseUrl + '/links/preserve-scroll-false-page-two')
            cy.get('.foo').should('have.text', 'Foo is now baz')
            cy.get('#slot').scrollTo(0, 0)
            cy.get('.slot-position').should('have.text', 'Slot scroll position is 0 & 0')

            // Assert that the page is passed in to the callback
            expect(alert.getCalls()).to.have.length(1)
            tap(alert.getCall(0).lastArg, (page) => {
              expect(page).to.be.an('object')
              expect(page).to.have.property('component')
              expect(page).to.have.property('props')
              expect(page).to.have.property('url')
              expect(page).to.have.property('version')
            })

            return cy.go(-1)
          })
          .then(() => {
            cy.url().should('eq', Cypress.config().baseUrl + '/links/preserve-scroll-false')
            cy.get('.foo').should('have.text', 'Foo is now default')

            cy.get('.document-position').should('have.text', 'Document scroll position is 5 & 7')
            cy.get('.slot-position').should('have.text', 'Slot scroll position is 0 & 0')
          })
      })

      it('does not restore untracked scroll regions when pressing the back button from another website', () => {
        cy.get('.off-site')
          .click({ force: true })
          .then(() => {
            cy.url().should('eq', Cypress.config().baseUrl + '/non-inertia')

            return cy.go(-1)
          })
          .then(() => {
            cy.url().should('eq', Cypress.config().baseUrl + '/links/preserve-scroll-false')

            cy.get('.document-position').should('have.text', 'Document scroll position is 5 & 7')
            cy.get('.slot-position').should('have.text', 'Slot scroll position is 0 & 0')
          })
      })
    })

    describe('enabled', () => {
      beforeEach(() => {
        cy.visit('/links/preserve-scroll')
        cy.get('.foo').should('have.text', 'Foo is now default')
        cy.scrollTo('5px', '7px')
        cy.get('#slot').scrollTo('10px', '15px')
        cy.get('.document-position').should('have.text', 'Document scroll position is 5 & 7')
        cy.get('.slot-position').should('have.text', 'Slot scroll position is 10 & 15')
      })

      it('resets scroll regions to the top when doing a regular visit', () => {
        cy.get('.reset')
          .click({ force: true })
          .then(() => {
            cy.url().should('eq', Cypress.config().baseUrl + '/links/preserve-scroll-page-two')
            cy.get('.foo').should('have.text', 'Foo is now bar')

            cy.get('.document-position').should('have.text', 'Document scroll position is 0 & 0')
            cy.get('.slot-position').should('have.text', 'Slot scroll position is 0 & 0')
          })
      })

      it('resets scroll regions to the top when returning false from a preserveScroll callback', () => {
        cy.get('.reset-callback')
          .click({ force: true })
          .then(() => {
            cy.url().should('eq', Cypress.config().baseUrl + '/links/preserve-scroll-page-two')
            cy.get('.foo').should('have.text', 'Foo is now foo')

            cy.get('.document-position').should('have.text', 'Document scroll position is 0 & 0')
            cy.get('.slot-position').should('have.text', 'Slot scroll position is 0 & 0')

            // Assert that the page is passed in to the callback
            expect(alert.getCalls()).to.have.length(1)
            tap(alert.getCall(0).lastArg, (page) => {
              expect(page).to.be.an('object')
              expect(page).to.have.property('component')
              expect(page).to.have.property('props')
              expect(page).to.have.property('url')
              expect(page).to.have.property('version')
            })
          })
      })

      it('preserves scroll regions when using the "preserve-scroll" feature', () => {
        cy.get('.preserve')
          .click({ force: true })
          .then(() => {
            cy.url().should('eq', Cypress.config().baseUrl + '/links/preserve-scroll-page-two')
            cy.get('.foo').should('have.text', 'Foo is now baz')

            cy.get('.document-position').should('have.text', 'Document scroll position is 5 & 7')
            cy.get('.slot-position').should('have.text', 'Slot scroll position is 10 & 15')
          })
      })

      it('preserves scroll regions when using the "preserve-scroll" feature from a callback', () => {
        cy.get('.preserve-callback')
          .click({ force: true })
          .then(() => {
            cy.url().should('eq', Cypress.config().baseUrl + '/links/preserve-scroll-page-two')
            cy.get('.foo').should('have.text', 'Foo is now baz')

            cy.get('.document-position').should('have.text', 'Document scroll position is 5 & 7')
            cy.get('.slot-position').should('have.text', 'Slot scroll position is 10 & 15')

            cy.then(() => {
              // Assert that the page is passed in to the callback
              expect(alert.getCalls()).to.have.length(1)
              tap(alert.getCall(0).lastArg, (page) => {
                expect(page).to.be.an('object')
                expect(page).to.have.property('component')
                expect(page).to.have.property('props')
                expect(page).to.have.property('url')
                expect(page).to.have.property('version')
              })
            })
          })
      })

      it('restores all tracked scroll regions when pressing the back button', () => {
        cy.get('.preserve')
          .click({ force: true })
          .then(() => {
            cy.url().should('eq', Cypress.config().baseUrl + '/links/preserve-scroll-page-two')
            cy.get('#slot').scrollTo(0, 0)
            cy.get('.slot-position').should('have.text', 'Slot scroll position is 0 & 0')

            return cy.go(-1)
          })
          .then(() => {
            cy.url().should('eq', Cypress.config().baseUrl + '/links/preserve-scroll')

            cy.get('.foo').should('have.text', 'Foo is now default')
            cy.get('.document-position').should('have.text', 'Document scroll position is 5 & 7')
            cy.get('.slot-position').should('have.text', 'Slot scroll position is 10 & 15')
          })
      })

      it.skip('restores all tracked scroll regions when pressing the back button from another website', () => {
        cy.get('.off-site')
          .click({ force: true })
          .then(() => {
            cy.url().should('eq', Cypress.config().baseUrl + '/non-inertia')

            return cy.go(-1)
          })
          .then(() => {
            cy.url().should('eq', Cypress.config().baseUrl + '/links/preserve-scroll')

            cy.get('.document-position').should('have.text', 'Document scroll position is 5 & 7')
            cy.get('.slot-position').should('have.text', 'Slot scroll position is 10 & 15')
          })
      })
    })
  })

  describe('URL fragment navigation (& automatic scrolling)', () => {
    /** @see https://github.com/inertiajs/inertia/pull/257 */

    beforeEach(() => {
      cy.visit('/links/url-fragments', {
        onLoad: () =>
          cy.on('window:load', () => {
            throw 'A location/non-SPA visit was detected'
          }),
      })
      cy.url().should('eq', Cypress.config().baseUrl + '/links/url-fragments')
      cy.get('.document-position').should('have.text', 'Document scroll position is 0 & 0')
    })

    it('Scrolls to the fragment element when making a visit to a different page', () => {
      cy.get('.basic').click()
      cy.url().should('eq', Cypress.config().baseUrl + '/links/url-fragments#target')
      cy.get('.document-position').should('not.have.text', 'Document scroll position is 0 & 0')
    })

    it('Scrolls to the fragment element when making a visit to the same page', () => {
      cy.get('.fragment').click()
      cy.url().should('eq', Cypress.config().baseUrl + '/links/url-fragments#target')
      cy.get('.document-position').should('not.have.text', 'Document scroll position is 0 & 0')
    })

    it('Does not scroll to the fragment element when it does not exist on the page', () => {
      cy.get('.non-existent-fragment').click()
      cy.url().should('eq', Cypress.config().baseUrl + '/links/url-fragments#non-existent-fragment')
      cy.get('.document-position').should('have.text', 'Document scroll position is 0 & 0')
    })
  })

  describe('Partial Reloads', () => {
    beforeEach(() => {
      cy.visit('/links/partial-reloads', {
        onLoad: () =>
          cy.on('window:load', () => {
            throw 'A location/non-SPA visit was detected'
          }),
      })
      cy.get('.foo-text').should('have.text', 'Foo is now 1')
      cy.get('.bar-text').should('have.text', 'Bar is now 2')
      cy.get('.baz-text').should('have.text', 'Baz is now 3')
    })

    it('does not have headers specific to partial reloads when the feature is not being used', () => {
      cy.get('.all').click()
      cy.url().should('eq', Cypress.config().baseUrl + '/links/partial-reloads')

      cy.window().should('have.property', '_inertia_props')
      cy.window()
        .then((window) => window._inertia_props)
        .then(({ headers }) => {
          expect(headers).to.not.contain.keys(['x-inertia-partial-component', 'x-inertia-partial-data'])
        })
    })

    it('has headers specific to partial reloads', () => {
      cy.get('.foo-bar').click()
      cy.url().should('eq', Cypress.config().baseUrl + '/links/partial-reloads')

      cy.window().should('have.property', '_inertia_props')
      cy.window()
        .then((window) => window._inertia_props)
        .then(({ headers }) => {
          expect(headers).to.contain.keys([
            'accept',
            'x-requested-with',
            'x-inertia',
            'x-inertia-partial-component',
            'x-inertia-partial-data',
          ])
          expect(headers['accept']).to.eq('text/html, application/xhtml+xml')
          expect(headers['x-requested-with']).to.eq('XMLHttpRequest')
          expect(headers['x-inertia']).to.eq('true')
          expect(headers['x-inertia-partial-data']).to.eq('headers,foo,bar')
          expect(headers['x-inertia-partial-component']).to.eq('Links/PartialReloads')
        })
    })

    it('it updates all props when the feature is not being used', () => {
      cy.get('.all').click()
      cy.url().should('eq', Cypress.config().baseUrl + '/links/partial-reloads')

      cy.get('.foo-text').should('have.text', 'Foo is now 2')
      cy.get('.bar-text').should('have.text', 'Bar is now 3')
      cy.get('.baz-text').should('have.text', 'Baz is now 4')
    })

    it('it only updates props that are passed through "only"', () => {
      cy.get('.foo-bar').click()
      cy.url().should('eq', Cypress.config().baseUrl + '/links/partial-reloads')
      cy.get('.foo-text').should('have.text', 'Foo is now 2')
      cy.get('.bar-text').should('have.text', 'Bar is now 3')
      cy.get('.baz-text').should('have.text', 'Baz is now 3')

      cy.get('.baz').click()
      cy.url().should('eq', Cypress.config().baseUrl + '/links/partial-reloads')
      cy.get('.foo-text').should('have.text', 'Foo is now 2')
      cy.get('.bar-text').should('have.text', 'Bar is now 3')
      cy.get('.baz-text').should('have.text', 'Baz is now 5')

      cy.get('.all').click()
      cy.url().should('eq', Cypress.config().baseUrl + '/links/partial-reloads')
      cy.get('.foo-text').should('have.text', 'Foo is now 3')
      cy.get('.bar-text').should('have.text', 'Bar is now 4')
      cy.get('.baz-text').should('have.text', 'Baz is now 5')
    })

    it('it only updates props that are not passed through "except"', () => {
      cy.get('.except-foo-bar').click()
      cy.url().should('eq', Cypress.config().baseUrl + '/links/partial-reloads')
      cy.get('.foo-text').should('have.text', 'Foo is now 1')
      cy.get('.bar-text').should('have.text', 'Bar is now 2')
      cy.get('.baz-text').should('have.text', 'Baz is now 4')

      cy.get('.except-baz').click()
      cy.url().should('eq', Cypress.config().baseUrl + '/links/partial-reloads')
      cy.get('.foo-text').should('have.text', 'Foo is now 2')
      cy.get('.bar-text').should('have.text', 'Bar is now 3')
      cy.get('.baz-text').should('have.text', 'Baz is now 4')
    })
  })

  describe('Redirects', () => {
    let alert = null
    beforeEach(() => {
      cy.visit('/', {
        onLoad: () =>
          cy.on('window:load', () => {
            alert('A location/non-SPA visit was detected')
          }),
      })

      alert = cy.stub()
      cy.on('window:alert', alert)
    })

    it('follows 303 redirects', () => {
      cy.get('.links-redirect')
        .click()
        .wait(50)
        .then(() => {
          cy.url().should('eq', Cypress.config().baseUrl + '/dump/get')
          expect(alert.getCalls()).to.have.length(0)
        })
    })

    it('follows external redirects', () => {
      cy.get('.links-redirect-external')
        .click()
        .wait(50)
        .then(() => {
          cy.url().should('eq', Cypress.config().baseUrl + '/non-inertia')
          expect(alert.getCalls()).to.have.length(1)
          expect(alert.getCall(0)).to.be.calledWith('A location/non-SPA visit was detected')
        })
    })
  })

  describe('"as" warning', () => {
    it('shows no warning when using GET inertia-links', () => {
      cy.visit('/links/as-warning/get', {
        onBeforeLoad: (window) => {
          cy.spy(window.console, 'warn').as('consoleWarn')
        },
      })

      cy.get('@consoleWarn').should('not.be.called')
    })

    it('shows a warning when using POST inertia-links using the anchor tag', () => {
      cy.visit('/links/as-warning/post', {
        onBeforeLoad: (window) => {
          cy.spy(window.console, 'warn').as('consoleWarn')
        },
      })

      cy.get('@consoleWarn').should(
        'be.calledWith',
        'Creating POST/PUT/PATCH/DELETE <a> links is discouraged as it causes "Open Link in New Tab/Window" accessibility issues.\n\n' +
          'Please specify a more appropriate element using the "as" attribute. For example:\n\n' +
          '<Link href="/example" method="post" as="button">...</Link>',
      )
    })

    it('shows no warning when using POST inertia-links "as" a non-anchor tag', () => {
      cy.visit('/links/as-warning-false/post', {
        onBeforeLoad: (window) => {
          cy.spy(window.console, 'warn').as('consoleWarn')
        },
      })

      cy.get('@consoleWarn').should('not.be.called')
    })

    it('shows a warning when using PUT inertia-links using the anchor tag', () => {
      cy.visit('/links/as-warning/put', {
        onBeforeLoad: (window) => {
          cy.spy(window.console, 'warn').as('consoleWarn')
        },
      })

      cy.get('@consoleWarn').should(
        'be.calledWith',
        'Creating POST/PUT/PATCH/DELETE <a> links is discouraged as it causes "Open Link in New Tab/Window" accessibility issues.\n\n' +
          'Please specify a more appropriate element using the "as" attribute. For example:\n\n' +
          '<Link href="/example" method="put" as="button">...</Link>',
      )
    })

    it('shows no warning when using PUT inertia-links "as" a non-anchor tag', () => {
      cy.visit('/links/as-warning-false/put', {
        onBeforeLoad: (window) => {
          cy.spy(window.console, 'warn').as('consoleWarn')
        },
      })

      cy.get('@consoleWarn').should('not.be.called')
    })

    it('shows a warning when using PATCH inertia-links using the anchor tag', () => {
      cy.visit('/links/as-warning/patch', {
        onBeforeLoad: (window) => {
          cy.spy(window.console, 'warn').as('consoleWarn')
        },
      })

      cy.get('@consoleWarn').should(
        'be.calledWith',
        'Creating POST/PUT/PATCH/DELETE <a> links is discouraged as it causes "Open Link in New Tab/Window" accessibility issues.\n\n' +
          'Please specify a more appropriate element using the "as" attribute. For example:\n\n' +
          '<Link href="/example" method="patch" as="button">...</Link>',
      )
    })

    it('shows no warning when using PATCH inertia-links "as" a non-anchor tag', () => {
      cy.visit('/links/as-warning-false/patch', {
        onBeforeLoad: (window) => {
          cy.spy(window.console, 'warn').as('consoleWarn')
        },
      })

      cy.get('@consoleWarn').should('not.be.called')
    })

    it('shows a warning when using DELETE inertia-links using the anchor tag', () => {
      cy.visit('/links/as-warning/delete', {
        onBeforeLoad: (window) => {
          cy.spy(window.console, 'warn').as('consoleWarn')
        },
      })

      cy.get('@consoleWarn').should(
        'be.calledWith',
        'Creating POST/PUT/PATCH/DELETE <a> links is discouraged as it causes "Open Link in New Tab/Window" accessibility issues.\n\n' +
          'Please specify a more appropriate element using the "as" attribute. For example:\n\n' +
          '<Link href="/example" method="delete" as="button">...</Link>',
      )
    })

    it('shows no warning when using DELETE inertia-links "as" a non-anchor tag', () => {
      cy.visit('/links/as-warning-false/delete', {
        onBeforeLoad: (window) => {
          cy.spy(window.console, 'warn').as('consoleWarn')
        },
      })

      cy.get('@consoleWarn').should('not.be.called')
    })
  })
})
