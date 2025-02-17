# Contributing

Thanks for your interest in contributing to Inertia.js!

## Packages

To make local Inertia.js development easier, this project has been setup as a monorepo using [NPM Workspaces](https://docs.npmjs.com/using-npm/workspaces). To set it up, start by cloning the repository on your system.

```sh
git clone https://github.com/inertiajs/inertia.git inertia
cd inertia
```

Next, install the JavaScript dependencies:

```sh
npm install
```

Next, build the packages:

```sh
npm run build --workspace=packages --if-present
```

If you're making changes to one of the packages that requires a build step (`core`, `react`, `vue2`, `vue3`), you can setup a watcher to automatically run the build step whenever files are changed.

```sh
cd packages/core
npm run dev
```

When proposing changes to one of the adapters (`react`, `vue2`, `vue3`, `svelte`), please try to apply the same changes to the other adapters where possible.

## Playgrounds

It's often helpful to develop Inertia.js using a real application. The playground folder contains an example Laravel project for each of the adapters. Here's how to get a playground running:

```sh
cd playgrounds/react
npm run build
composer install
cp .env.example .env
php artisan key:generate
php artisan serve
# visit the site at http://127.0.0.1:8000
```

To automatically see changes to the JavaScript files in the browser, start the development server:

```sh
npm run dev
```

To test the SSR mode, first run the build, and then start the SSR server:

```sh
npm run build
php artisan inertia:start-ssr
```

## Testing

Inertia.js uses [Playwright](https://playwright.dev/) for testing. To run the tests, use the following command:

```sh
npx playwright install # install playwright with system-wide browser dependencies

# install packages for the test app
cd tests/app
npm install

# run tests
cd ..
npx playwright test
```

## Publishing

This section is really for the benefit of the core maintainers.

1. Increment the version numbers in the `package.json` file for each package, making sure to also update the adapter dependencies on `@inertiajs/core`.
2. Run `npm install` to update the top-level `package-lock.json` file.
3. Update `CHANGELOG.md`.
4. Run `npm publish` for each package. This will automatically run the necessary build step. When publishing beta releases, make sure to run `npm publish --tag=beta` or `npm publish --tag=next` if it's `next`.
5. Add release notes to [GitHub](https://github.com/inertiajs/inertia/releases).
