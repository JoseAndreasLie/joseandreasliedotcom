// Usage: npm run hash-password   (type the password, or pipe it on stdin)
// Prints: scrypt:<salt hex, 16 bytes>:<hash hex, 64 bytes>
// Verify: timingSafeEqual(scryptSync(pw, Buffer.from(salt, 'hex'), 64), Buffer.from(hash, 'hex'))
// scrypt params are Node defaults (N=16384, r=8, p=1).
import { randomBytes, scrypt } from 'node:crypto'
import { createInterface } from 'node:readline/promises'
import { promisify } from 'node:util'

const rl = createInterface({ input: process.stdin, output: process.stderr })
const password = await rl.question('Password: ')
rl.close()
if (!password) {
  console.error('empty password')
  process.exit(1)
}
const salt = randomBytes(16)
const hash = await promisify(scrypt)(password, salt, 64)
console.log(`scrypt:${salt.toString('hex')}:${hash.toString('hex')}`)
