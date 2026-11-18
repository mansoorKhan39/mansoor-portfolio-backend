import 'dotenv/config'
import { connectDatabase, createApiApp } from './server/app.js'

const PORT = Number(process.env.PORT) || 5000

async function start() {
  await connectDatabase()
  const app = createApiApp()

  app.get('/', (_req, res) => {
    res.json({ service: 'mansoor-portfolio-backend', status: 'running' })
  })

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Backend running on http://0.0.0.0:${PORT}`)
  })
}

start().catch((err) => {
  console.error('Failed to start backend:', err)
  process.exit(1)
})
