import { connectDatabase, createApiApp } from '../server/app.js'

const app = createApiApp()

app.get('/', (_req, res) => {
  res.json({ service: 'mansoor-portfolio-backend', status: 'running' })
})

export default async function handler(req, res) {
  await connectDatabase()
  return app(req, res)
}
