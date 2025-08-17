import { headers as getHeaders } from 'next/headers.js'
import configPromise from '@payload-config'
import { getPayload } from 'payload'

export const GET = async (request: Request) => {
  const payload = await getPayload({
    config: configPromise,
  })

  const headers = await getHeaders()
  const { user } = await payload.auth({ headers })

  return Response.json({
    message: `Custom route. User: ${user?.id || 'anonymous'}.`,
  })
}
