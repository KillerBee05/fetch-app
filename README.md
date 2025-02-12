# fetch-app

This template should help get you started developing with Vue 3 in Vite.

## Recommended IDE Setup

[VSCode](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Type Support for `.vue` Imports in TS

TypeScript cannot handle type information for `.vue` imports by default, so we replace the `tsc` CLI with `vue-tsc` for type checking. In editors, we need [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) to make the TypeScript language service aware of `.vue` types.

## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Run End-to-End Tests with [Cypress](https://www.cypress.io/)
```sh
npx cypress run
```
```sh
npm run test:e2e:dev
```

This runs the end-to-end tests against the Vite development server.
It is much faster than the production build.

But it's still recommended to test the production build with `test:e2e` before deploying (e.g. in CI environments):

```sh
npm run build
npm run test:e2e
```

### Safari Browser Compatibility Note
Safari Issues with Authentication
The application currently experiences authentication issues with Safari due to its default privacy settings. This is because:

Our login endpoint returns an authentication cookie via the Set-Cookie response header
The cookie is marked as HttpOnly for security purposes
Safari's default "Prevent Cross-Site Tracking" setting blocks these third-party cookies
This prevents the authentication flow from working correctly

Workaround Options:

Use a different browser (Chrome, Firefox, etc.)
Disable "Prevent Cross-Site Tracking" in Safari's Privacy settings (not recommended for general browsing)
