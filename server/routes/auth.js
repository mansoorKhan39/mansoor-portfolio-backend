import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import auth, { getJwtSecret } from '../middleware/auth.js'

const router = express.Router()

const DEV_DEFAULT_HASH = bcrypt.hashSync('mansoor123', 10)

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { password } = req.body || {}
    if (!password) {
      return res.status(400).json({ message: 'Password required' })
    }

    let hash = process.env.ADMIN_PASSWORD_HASH
    if (!hash && process.env.NODE_ENV !== 'production') {
      hash = DEV_DEFAULT_HASH
    }

    if (!hash) {
      return res.status(500).json({ message: 'Admin not configured' })
    }

    const isMatch = await bcrypt.compare(password, hash)
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    const token = jwt.sign({ role: 'admin' }, getJwtSecret(), {
      expiresIn: '7d',
    })
    return res.json({ token })
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Authentication error' })
  }
})

// GET /api/auth/verify
router.get('/verify', auth, (req, res) => {
  return res.json({ valid: true, role: req.admin?.role || 'admin' })
})

export default router
