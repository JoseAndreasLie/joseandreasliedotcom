// API client (PLAN.md 2.2). All calls are relative: /api in dev via Vite proxy, nginx in prod.
// Errors: thrown Error with the server's { error } message and `.status` (0 = network).
// Dev only: public reads (list, get) fall back to mocks.js when the API is unreachable.

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
      return mock(await import('./mocks.js'))
    }
    throw err
  }
}

// Resources: 'works' (Behind the Lens: photo + video), 'projects', 'products'.
// Mirrors BE ordering: works newest first, projects/products by position.
const HEAVY = { works: 'body', projects: 'body', products: 'writeup' }
const byOrder = (resource) =>
  resource === 'works' ? (a, b) => b.date.localeCompare(a.date) : (a, b) => a.position - b.position || (b.year ?? 0) - (a.year ?? 0)

// Public

/** Published rows of a resource, without the heavy text field. works accepts { type: 'video'|'photo' }. */
export function list(resource, { type } = {}) {
  const qs = type ? `?type=${encodeURIComponent(type)}` : ''
  return withDevMock(
    () => request(`/${resource}${qs}`),
    (mocks) =>
      mocks[resource]
        .filter((r) => r.published && (!type || r.type === type))
        .sort(byOrder(resource))
        .map(({ [HEAVY[resource]]: _heavy, ...rest }) => rest), // eslint-disable-line no-unused-vars
  )
}

/** One published row by slug. Throws status 404 if missing. */
export function get(resource, slug) {
  return withDevMock(
    () => request(`/${resource}/${encodeURIComponent(slug)}`),
    (mocks) => {
      const r = mocks[resource].find((x) => x.slug === slug && x.published)
      if (!r) throw fail('Not found', 404)
      return r
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

export const adminList = (resource) => request(`/admin/${resource}`, { auth: true })
export const create = (resource, row) => request(`/${resource}`, { method: 'POST', body: row, auth: true })
export const update = (resource, id, row) => request(`/${resource}/${id}`, { method: 'PUT', body: row, auth: true })
export const remove = (resource, id) => request(`/${resource}/${id}`, { method: 'DELETE', auth: true })

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
