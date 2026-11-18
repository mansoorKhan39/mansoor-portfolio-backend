import jwt from 'jsonwebtoken'

const DEV_JWT_FALLBACK = 'mansoor-portfolio-dev-jwt-secret-change-in-prod'

export function getJwtSecret() {
  if (process.env.JWT_SECRET) return process.env.JWT_SECRET
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET must be set in production')
  }
  return DEV_JWT_FALLBACK
}

export default function auth(req, res, next) {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token, authorization denied' })
  }
  const token = authHeader.split(' ')[1]
  try {
    const decoded = jwt.verify(token, getJwtSecret())
    req.admin = decoded
    next()
  } catch {
    return res.status(401).json({ message: 'Token is not valid' })
  }
}
