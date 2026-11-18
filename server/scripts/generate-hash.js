// Run this ONCE to generate your admin password hash:
// node server/scripts/generate-hash.js "your-password"
import bcrypt from 'bcryptjs'

const password = process.argv[2] || 'mansoor123'
const hash = bcrypt.hashSync(password, 10)
console.log('Add this to your .env as ADMIN_PASSWORD_HASH:')
console.log(hash)
