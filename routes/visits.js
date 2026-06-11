const express = require("express")
const router = express.Router()
const Visit = require("../models/Visit")
const auth = require("../middleware/auth")

// Detect browser from user-agent
function getBrowser(ua) {
  if (!ua) return 'Unknown'
  if (ua.includes('Chrome') && !ua.includes('Edg')) return 'Chrome'
  if (ua.includes('Firefox')) return 'Firefox'
  if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari'
  if (ua.includes('Edg')) return 'Edge'
  if (ua.includes('Opera')) return 'Opera'
  return 'Other'
}

// Detect device
function getDevice(ua) {
  if (!ua) return 'Unknown'
  if (/mobile/i.test(ua)) return 'Mobile'
  if (/tablet|ipad/i.test(ua)) return 'Tablet'
  return 'Desktop'
}

// GET /api/visits — public, get total count only
router.get("/", async (req, res) => {
  try {
    let visit = await Visit.findOne()
    if (!visit) visit = await Visit.create({ count: 0 })
    res.json({ count: visit.count })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// POST /api/visits/track — public, track visitor
router.post("/track", async (req, res) => {
  try {
    const { page } = req.body

    // Get IP
    const ip = (req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress || 'unknown').trim()

    // Get location from IP
    let country = 'Unknown', city = 'Unknown'
    try {
      const geoRes = await fetch(`http://ip-api.com/json/${ip}?fields=country,city,status`)
      const geo = await geoRes.json()
      if (geo.status === 'success') {
        country = geo.country || 'Unknown'
        city = geo.city || 'Unknown'
      }
    } catch {}

    // Get device & browser
    const ua = req.headers['user-agent'] || ''
    const device = getDevice(ua)
    const browser = getBrowser(ua)

    // Save to DB
    let visit = await Visit.findOne()
    if (!visit) visit = new Visit({ count: 0, visitors: [] })

    visit.count += 1
    visit.visitors.push({ ip, country, city, device, browser, page: page || '/', visitedAt: new Date() })

    // Keep only last 500 visitors to save space
    if (visit.visitors.length > 500) {
      visit.visitors = visit.visitors.slice(-500)
    }

    await visit.save()
    res.json({ count: visit.count })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// GET /api/visits/analytics — admin only
router.get("/analytics", auth, async (req, res) => {
  try {
    const visit = await Visit.findOne()
    if (!visit) return res.json({ total: 0, countries: {}, devices: {}, browsers: {}, pages: {}, recent: [] })

    const countries = {}, devices = {}, browsers = {}, pages = {}

    visit.visitors.forEach(v => {
      countries[v.country] = (countries[v.country] || 0) + 1
      devices[v.device]    = (devices[v.device] || 0) + 1
      browsers[v.browser]  = (browsers[v.browser] || 0) + 1
      pages[v.page]        = (pages[v.page] || 0) + 1
    })

    // Sort countries by count
    const sortedCountries = Object.entries(countries)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .reduce((obj, [k, v]) => ({ ...obj, [k]: v }), {})

    res.json({
      total: visit.count,
      countries: sortedCountries,
      devices,
      browsers,
      pages,
      recent: visit.visitors.slice(-20).reverse(), // last 20 visitors
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

module.exports = router
