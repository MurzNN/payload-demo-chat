import { initContainerManager } from './container'

declare global {
  // eslint-disable-next-line no-var
  var __appBootstrapped: boolean | undefined
}

if (!globalThis.__appBootstrapped) {
  console.log('Executing Next.js Node instrumentation...')
  globalThis.__appBootstrapped = true
  await initContainerManager()
  console.log('Next.js Node instrumentation executed.')
}
