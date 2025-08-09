# Payload Demo Chat

A payload example project that demonstrates frontend implementation with
interactive chats, using the IoC approach and Dependency Injection container.

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

## Details

- Uses [Tailwind CSS](https://tailwindcss.com/) and
[shadcn/ui](https://ui.shadcn.com/) for tesing.

- Uses [awilix-manager](https://github.com/kibertoad/awilix-manager) to
demonstrate the usage of DI container with async init functions.

