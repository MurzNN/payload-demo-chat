import config from '@payload-config'
import dotenv from 'dotenv'
import { getPayload } from 'payload'
import { seedInitialData } from './seed-initial-data'

dotenv.config()
const payload = await getPayload({ config })

await seedInitialData(payload)

process.exit(0)
