// API client (PLAN.md 2.2). All calls are relative: /api in dev via Vite proxy, Caddy in prod.
// Errors: thrown Error with the server's { error } message and `.status` (0 = network).
// Dev only: public reads (getWorks, getWork) fall back to mocks.js when the API is unreachable.

const BASE = '/api'
const TOKEN_KEY = 'jal_admin_token'

export function getToken() {
  try {
    return sessionStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function logout() {
  try {
    sessionStorage.removeItem(TOKEN_KEY)
  } catch {
    // storage blocked: nothing stored
  }
}

function fail(message, status) {
  const err = new Error(message)
  err.status = status
  return err
}

async function request(path, { method = 'GET', body, auth = false } = {}) {
  const headers = {}
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (auth) {
    const token = getToken()
    if (token) headers.Authorization = `Bearer ${token}`
  }

  let res
  try {
    res = await fetch(BASE + path, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw fail('Cannot reach the server. Check your connection and try again.', 0)
  }

  if (res.status === 204) return null
  const data = await res.json().catch(() => null)
  if (!res.ok) {
    if (res.status === 401 && auth) logout()
    // Vite's proxy answers 5xx with a non JSON body when the API is down.
    const status = data === null && res.status >= 500 ? 0 : res.status
    throw fail(data?.error || `Request failed (${res.status})`, status)
  }
  return data
}

async function withDevMock(call, mock) {
  try {
    return await call()
  } catch (err) {
    // `import.meta.env.DEV &&` is statically false in prod, so mocks never ship.
    if (import.meta.env.DEV && err.status === 0) {
      console.warn('[api] API unreachable, using dev mocks')
      const { mockWorks } = await import('./mocks.js')
      return mock(mockWorks)
    }
    throw err
  }
}

// Public

/** List published works, newest first, without `body`. type: 'video'|'photo'|'project'|'writing' or omitted. */
export function getWorks({ type } = {}) {
  const qs = type ? `?type=${encodeURIComponent(type)}` : ''
  return withDevMock(
    () => request(`/works${qs}`),
    (works) =>
      works
        .filter((w) => w.published && (!type || w.type === type))
        .sort((a, b) => b.date.localeCompare(a.date))
        // eslint-disable-next-line no-unused-vars
        .map(({ body, ...rest }) => rest),
  )
}

/** One published work by slug. Throws status 404 if missing. */
export function getWork(slug) {
  return withDevMock(
    () => request(`/works/${encodeURIComponent(slug)}`),
    (works) => {
      const w = works.find((x) => x.slug === slug && x.published)
      if (!w) throw fail('Work not found', 404)
      return w
    },
  )
}

// Admin (JWT in sessionStorage)

/** Exchanges the admin password for a token, stores it, returns it. */
export async function login(password) {
  const { token } = await request('/login', { method: 'POST', body: { password } })
  try {
    sessionStorage.setItem(TOKEN_KEY, token)
  } catch {
    // storage blocked: token only lives for this call
  }
  return token
}

export const getAdminWorks = () => request('/admin/works', { auth: true })
export const createWork = (work) => request('/works', { method: 'POST', body: work, auth: true })
export const updateWork = (id, work) => request(`/works/${id}`, { method: 'PUT', body: work, auth: true })
export const deleteWork = (id) => request(`/works/${id}`, { method: 'DELETE', auth: true })

/** Uploads an image (multipart `file`). onProgress(0..1). Resolves { url, thumb_url }. XHR for upload progress. */
export function uploadImage(file, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', `${BASE}/upload`)
    const token = getToken()
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`)
    xhr.responseType = 'json'
    if (onProgress) {
      xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(e.loaded / e.total)
    }
    xhr.onload = () => {
      const data = xhr.response
      if (xhr.status >= 200 && xhr.status < 300) return resolve(data)
      if (xhr.status === 401) logout()
      reject(fail(data?.error || `Upload failed (${xhr.status})`, xhr.status))
    }
    xhr.onerror = () => reject(fail('Upload failed. Cannot reach the server.', 0))
    const form = new FormData()
    form.append('file', file)
    xhr.send(form)
  })
}
