const { defineConfig } = require('cypress')

module.exports = defineConfig({
  e2e: {
    specPattern: 'cypress/integration/*.{js,jsx,ts,tsx}',
    baseUrl: 'http://localhost:13715',
    setupNodeEvents(on, config) {
      require('cypress-fail-fast/plugin')(on, config)
    },
    video: false,
    screenshotOnRunFailure: false,
    retries: {
      runMode: 4,
      openMode: 2,
    },
  },
})