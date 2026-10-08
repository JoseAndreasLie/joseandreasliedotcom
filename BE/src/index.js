for (const k of ['JWT_SECRET', 'ADMIN_PASSWORD_HASH']) {
  if (!process.env[k]) {
    console.error(`missing required env ${k}`)
    process.exit(1)
  }
}
if (process.env.JWT_SECRET.length < 32 || /change-me/i.test(process.env.JWT_SECRET)) {
  console.error('JWT_SECRET must be at least 32 chars and not the placeholder (openssl rand -hex 32)')
  process.exit(1)
}

const { app } = await import('./app.js')
const port = Number(process.env.PORT) || 4000
app.listen(port, () => console.log(`api listening on :${port}`))
