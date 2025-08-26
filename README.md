# Payload Demo Chat

An example project with Payload CMS to demonstrate real-time bi-directional communication approaches by providing live chatrooms with persistent storage.

The app tries to use the best scaleable and testable modern architectural approaches to implement the functionality, and may seem overly complicated, but the idea is to provide these patters for demo purposes, to reuse in other mature complex apps.

For now, the app uses these technologies:

- [Payload CMS](https://payloadcms.com/) as the main driver.
- [Next.js](https://nextjs.org/) and [React](https://react.dev/).
- [Tailwind CSS](https://tailwindcss.com/) and [shadcn/ui](https://ui.shadcn.com/) for design.
- WebSockets using [ws](https://www.npmjs.com/package/ws) NPM package.
- [Next WS](https://github.com/apteryxxyz/next-ws) package to integrate WebSockets with Next.js
- Dependency Injection (DI) container [Awilix](https://github.com/jeffijoe/awilix) and [awilix-manager](https://github.com/kibertoad/awilix-manager) to implement the IoC (Inversion of Control) appoach with async initialization.

## Quick start

1. Copy the `.emv.example` file to `.env` and change there values, at least this one:
```
PAYLOAD_SECRET=SOME_RANDOM_STRING_OF_ANY_LENGTH
```

2. Install dependencies:
```
pnpm i
```

3. Run the app in the dev mode:
```
pnpm dev
```
