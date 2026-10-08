import { useCallback, useEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { Button } from '../../components/ui'
import { deleteWork, getAdminWorks, getToken, login, logout } from '../../lib/api'
import WorkForm from './WorkForm'
import './Admin.scss'

// Hidden Operate surface: plain, fast, no hero motion. Not in nav; noindex.
export default function Admin() {
  const [authed, setAuthed] = useState(() => !!getToken())
  const [notice, setNotice] = useState('')

  // Any admin call that 401s has already cleared the token (api.js); bounce to login.
  const onAuthError = useCallback((err) => {
    if (err?.status === 401) {
      setAuthed(false)
      setNotice('Session expired. Sign in again.')
      return true
    }
    return false
  }, [])

  return (
    <div className="container admin">
      <title>Admin · Jose Andreas Lie</title>
      <meta name="robots" content="noindex" />
      {authed ? (
        <Dashboard
          onAuthError={onAuthError}
          onLogout={() => {
            logout()
            setAuthed(false)
            setNotice('Signed out.')
          }}
        />
      ) : (
        <Login
          notice={notice}
          onSuccess={() => {
            setNotice('')
            setAuthed(true)
          }}
        />
      )}
    </div>
  )
}

function Login({ notice, onSuccess }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    if (!password) return setError('Enter the admin password.')
    setBusy(true)
    setError('')
    try {
      await login(password)
      onSuccess()
    } catch (err) {
      setError(err.status === 401 ? 'Wrong password.' : err.message)
      setBusy(false)
    }
  }

  return (
    <form className="admin-login" onSubmit={submit} noValidate>
      <h1 className="t-headline">Admin</h1>
      {notice && (
        <p className="t-dim" role="status">
          {notice}
        </p>
      )}
      <div className={`afield${error ? ' afield--error' : ''}`}>
        <label htmlFor="admin-password" className="t-label">
          Password
        </label>
        <input
          id="admin-password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={busy}
          autoFocus
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? 'admin-password-err' : undefined}
        />
        <p id="admin-password-err" className="afield__error" aria-live="polite">
          {error}
        </p>
      </div>
      <Button type="submit" variant="primary" disabled={busy}>
        {busy ? 'Signing in' : 'Sign in'}
      </Button>
    </form>
  )
}

function Dashboard({ onAuthError, onLogout }) {
  const [works, setWorks] = useState(null)
  const [loadError, setLoadError] = useState('')
  const [editing, setEditing] = useState(null) // null = list, 'new', or a work row
  const [confirmId, setConfirmId] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [status, setStatus] = useState('')
  // Selector to focus once the list is back on screen (trigger button, or the status line).
  const focusNext = useRef(null)

  useEffect(() => {
    if (editing || !focusNext.current) return
    const el = document.querySelector(focusNext.current)
    if (el) {
      el.focus()
      focusNext.current = null
    }
  }, [editing, works, status])

  const open = (target, trigger) => {
    focusNext.current = `[data-focus="${trigger}"]`
    setEditing(target)
  }

  const load = useCallback(async () => {
    setLoadError('')
    try {
      setWorks(await getAdminWorks())
    } catch (err) {
      if (!onAuthError(err)) setLoadError(err.message)
    }
  }, [onAuthError])

  useEffect(() => {
    load()
  }, [load])

  const remove = async (work) => {
    focusNext.current = '.admin__status'
    setDeletingId(work.id)
    try {
      await deleteWork(work.id)
      setWorks((ws) => ws.filter((w) => w.id !== work.id))
      setStatus(`Deleted “${work.title}”.`)
    } catch (err) {
      if (!onAuthError(err)) setStatus(`Delete failed: ${err.message}`)
    } finally {
      setDeletingId(null)
      setConfirmId(null)
    }
  }

  // Inline confirm swaps the buttons; keep keyboard focus on the swapped-in control.
  const swapFocus = (id, target) => {
    flushSync(() => setConfirmId(id))
    document.querySelector(`[data-focus="${target}"]`)?.focus()
  }

  if (editing) {
    return (
      <WorkForm
        work={editing === 'new' ? null : editing}
        onCancel={() => setEditing(null)}
        onSaved={(saved, isNew) => {
          focusNext.current = '.admin__status'
          setEditing(null)
          setStatus(`${isNew ? 'Created' : 'Saved'} “${saved.title}”${saved.published ? '' : ' as draft'}.`)
          load()
        }}
      />
    )
  }

  return (
    <div className="admin-dash">
      <header className="admin__bar">
        <h1 className="t-headline">Works</h1>
        <div className="admin__bar-actions">
          <Button variant="primary" onClick={() => open('new', 'new')} data-focus="new">
            New work
          </Button>
          <Button variant="ghost" onClick={onLogout}>
            Sign out
          </Button>
        </div>
      </header>

      <p className="admin__status" role="status" aria-live="polite" tabIndex={-1}>
        {status}
      </p>

      {loadError && (
        <div className="admin__error" role="alert">
          <p>Could not load works: {loadError}</p>
          <Button onClick={load}>Retry</Button>
        </div>
      )}
      {!works && !loadError && <p className="t-label t-dim">Loading works</p>}
      {works && works.length === 0 && <p className="t-dim">No works yet. Create the first one.</p>}

      {works && works.length > 0 && (
        <div className="admin-table__wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th scope="col">Title</th>
                <th scope="col">Type</th>
                <th scope="col">Date</th>
                <th scope="col">Status</th>
                <th scope="col">
                  <span className="visually-hidden">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {works.map((w) => (
                <tr key={w.id}>
                  <td>
                    <span className="admin-table__title">{w.title}</span>
                    <code className="admin-table__slug">{w.slug}</code>
                  </td>
                  <td className="t-label">{w.type}</td>
                  <td className="t-label">{w.date}</td>
                  <td>
                    <span className={`admin-pill${w.published ? ' admin-pill--live' : ''}`}>
                      {w.published ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td>
                    <div className="admin-table__actions">
                      {confirmId === w.id ? (
                        <>
                          <span className="t-label">Delete?</span>
                          <Button
                            variant="primary"
                            onClick={() => remove(w)}
                            disabled={deletingId === w.id}
                            aria-label={`Confirm delete ${w.title}`}
                            data-focus={`confirm-${w.id}`}
                          >
                            {deletingId === w.id ? 'Deleting' : 'Delete'}
                          </Button>
                          <Button variant="ghost" onClick={() => swapFocus(null, `delete-${w.id}`)} disabled={deletingId === w.id}>
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button onClick={() => open(w, `edit-${w.id}`)} aria-label={`Edit ${w.title}`} data-focus={`edit-${w.id}`}>
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            onClick={() => swapFocus(w.id, `confirm-${w.id}`)}
                            aria-label={`Delete ${w.title}`}
                            data-focus={`delete-${w.id}`}
                          >
                            Delete
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
