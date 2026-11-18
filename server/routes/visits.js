import express from 'express'
import Visit from '../models/Visit.js'
import auth from '../middleware/auth.js'
import { isMongoConnected, readLocalStore, writeLocalStore } from '../store.js'

const router = express.Router()

function getBrowser(ua) {
  if (!ua) return 'Unknown'
  if (ua.includes('Edg')) return 'Edge'
  if (ua.includes('OPR') || ua.includes('Opera')) return 'Opera'
  if (ua.includes('Chrome')) return 'Chrome'
  if (ua.includes('Firefox')) return 'Firefox'
  if (ua.includes('Safari')) return 'Safari'
  return 'Other'
}

function getDevice(ua) {
  if (!ua) return 'Unknown'
  if (/tablet|ipad/i.test(ua)) return 'Tablet'
  if (/mobile/i.test(ua)) return 'Mobile'
  return 'Desktop'
}

function isPrivateIp(ip) {
  return (
    !ip ||
    ip === 'unknown' ||
    ip === '::1' ||
    ip.startsWith('127.') ||
    ip.startsWith('10.') ||
    ip.startsWith('192.168.') ||
    ip.startsWith('::ffff:127.') ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(ip)
  )
}

function summarizeAnalytics(visit) {
  if (!visit) {
    return { total: 0, countries: {}, devices: {}, browsers: {}, pages: {}, recent: [] }
  }
  const countries = {}
  const devices = {}
  const browsers = {}
  const pages = {}

  visit.visitors.forEach((v) => {
    countries[v.country] = (countries[v.country] || 0) + 1
    devices[v.device] = (devices[v.device] || 0) + 1
    browsers[v.browser] = (browsers[v.browser] || 0) + 1
    pages[v.page] = (pages[v.page] || 0) + 1
  })

  const sortedCountries = Object.entries(countries)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .reduce((obj, [k, v]) => ({ ...obj, [k]: v }), {})

  return {
    total: visit.count,
    countries: sortedCountries,
    devices,
    browsers,
    pages,
    recent: visit.visitors.slice(-20).reverse(),
  }
}

// GET /api/visits — public total count
router.get('/', async (req, res) => {
  try {
    if (isMongoConnected()) {
      let visit = await Visit.findOne()
      if (!visit) visit = await Visit.create({ count: 0 })
      return res.json({ count: visit.count })
    }
    const store = readLocalStore()
    return res.json({ count: store.visit.count })
  } catch (err) {
    return res.status(500).json({ message: err.message })
  }
})

// POST /api/visits/track — public visitor tracker
router.post('/track', async (req, res) => {
  try {
    const page = String(req.body?.page || '/').slice(0, 120)
    const rawIp = req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress || 'unknown'
    const ip = String(rawIp).trim()

    let country = 'Unknown'
    let city = 'Unknown'

    if (isPrivateIp(ip)) {
      country = 'Local'
      city = 'Dev'
    } else {
      try {
        const geoRes = await fetch(`http://ip-api.com/json/${encodeURIComponent(ip)}?fields=country,city,status`, {
          signal: AbortSignal.timeout(1500),
        })
        const geo = await geoRes.json()
        if (geo.status === 'success') {
          country = geo.country || 'Unknown'
          city = geo.city || 'Unknown'
        }
      } catch {
        // Ignore geo lookup failure
      }
    }

    const ua = req.headers['user-agent'] || ''
    const entry = {
      ip,
      country,
      city,
      device: getDevice(ua),
      browser: getBrowser(ua),
      page,
      visitedAt: new Date(),
    }

    if (isMongoConnected()) {
      let visit = await Visit.findOne()
      if (!visit) visit = new Visit({ count: 0, visitors: [] })
      visit.count += 1
      visit.visitors.push(entry)
      if (visit.visitors.length > 500) {
        visit.visitors = visit.visitors.slice(-500)
      }
      await visit.save()
      return res.json({ count: visit.count })
    }

    const store = readLocalStore()
    store.visit.count += 1
    store.visit.visitors.push({ ...entry, visitedAt: entry.visitedAt.toISOString() })
    if (store.visit.visitors.length > 500) {
      store.visit.visitors = store.visit.visitors.slice(-500)
    }
    writeLocalStore(store)
    return res.json({ count: store.visit.count })
  } catch (err) {
    return res.status(500).json({ message: err.message })
  }
})

// GET /api/visits/analytics — admin only
router.get('/analytics', auth, async (req, res) => {
  try {
    if (isMongoConnected()) {
      const visit = await Visit.findOne()
      return res.json(summarizeAnalytics(visit))
    }
    const store = readLocalStore()
    return res.json(summarizeAnalytics(store.visit))
  } catch (err) {
    return res.status(500).json({ message: err.message })
  }
})

export default router
