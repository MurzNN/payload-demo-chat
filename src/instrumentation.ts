export async function register() {
  if (typeof window !== 'undefined') {
    return // Skip on client side
  }

  // Only run on Node.js runtime (server side)
  if (process.env.NEXT_RUNTIME === 'nodejs' || !process.env.NEXT_RUNTIME) {
    console.log('Registering Next.js Node instrumentation...')
    await import('@/instrumentation-node')
    console.log('Next.js Node instrumentation registered.')
  }
}
