import express from 'express'
import mongoose from 'mongoose'
import cors from 'cors'

import authRoutes from './routes/auth.js'
import projectRoutes from './routes/projects.js'
import messageRoutes from './routes/messages.js'
import visitRoutes from './routes/visits.js'
import Project from './models/Project.js'
import { isMongoConnected, SEED_PROJECTS } from './store.js'

let cachedConnectPromise = null
let seedAttempted = false

async function seedMongoOnce() {
  if (seedAttempted || !isMongoConnected()) return
  seedAttempted = true
  try {
    const metaCol = mongoose.connection.db.collection('_portfolio_meta')
    const seededFlag = await metaCol.findOne({ _id: 'initial_projects_seed' })
    if (seededFlag) return

    const existingCount = await Project.estimatedDocumentCount()
    if (existingCount === 0) {
      const docs = SEED_PROJECTS.map(({ _id, createdAt, ...rest }) => rest)
      await Project.insertMany(docs)
    }

    await metaCol.updateOne(
      { _id: 'initial_projects_seed' },
      { $setOnInsert: { seededAt: new Date() } },
      { upsert: true }
    )
  } catch (err) {
    console.error('Mongo initial seed skipped:', err?.message || err)
  }
}

export async function connectDatabase() {
  if (isMongoConnected()) {
    await seedMongoOnce()
    return
  }

  const uri = process.env.MONGODB_URI
  if (!uri) {
    return
  }

  if (!cachedConnectPromise) {
    cachedConnectPromise = mongoose
      .connect(uri, {
        serverSelectionTimeoutMS: 8000,
      })
      .then(async () => {
        console.log('MongoDB connected')
        await seedMongoOnce()
      })
      .catch((err) => {
        cachedConnectPromise = null
        console.error('MongoDB connection error (falling back to local store):', err?.message || err)
      })
  }

  await cachedConnectPromise
}

export function createApiApp() {
  const app = express()

  const envOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean)
    : []

  const vercelOrigins = [
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '',
    process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : '',
  ].filter(Boolean)

  const allowedOrigins = [...new Set([...envOrigins, ...vercelOrigins])]

  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || envOrigins.length === 0 || allowedOrigins.includes(origin)) {
          callback(null, true)
        } else {
          callback(new Error('Not allowed by CORS'))
        }
      },
      credentials: true,
    })
  )

  app.use(express.json())

  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      database: isMongoConnected() ? 'mongodb' : 'local-file',
    })
  })

  app.use('/api/auth', authRoutes)
  app.use('/api/projects', projectRoutes)
  app.use('/api/messages', messageRoutes)
  app.use('/api/visits', visitRoutes)

  return app
}
