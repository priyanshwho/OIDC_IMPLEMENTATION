
import { useCallback, useEffect, useMemo, useState } from 'react'

type AuthenticatedUser = {
  sub: string
  name?: string
  email?: string
  preferredUsername?: string
}

type AuthState =
  | {
      authenticated: false
    }
  | {
      authenticated: true
      user: AuthenticatedUser
      expiresAt?: number
    }

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000'

const Home = () => {
  const [authState, setAuthState] = useState<AuthState>({ authenticated: false })
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const fetchAuthState = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error(`Unable to reach auth adapter (HTTP ${response.status})`)
      }

      const data = (await response.json()) as AuthState
      setAuthState(data)
      setErrorMessage(null)
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Unexpected error while checking session',
      )
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- async auth bootstrap from backend
    void fetchAuthState()
  }, [fetchAuthState])

  const tokenExpiry = useMemo(() => {
    if (!authState.authenticated || !authState.expiresAt) {
      return 'Not available'
    }

    return new Date(authState.expiresAt * 1000).toLocaleString()
  }, [authState])

  const handleLogin = () => {
    const returnTo = encodeURIComponent(window.location.pathname)
    window.location.href = `${API_BASE_URL}/auth/login?returnTo=${returnTo}`
  }

  const handleLogout = () => {
    window.location.href = `${API_BASE_URL}/auth/logout`
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex min-h-screen w-full max-w-4xl items-center px-6 py-12">
        <section className="w-full rounded-3xl border border-slate-800 bg-slate-900/80 p-8 shadow-2xl shadow-black/30 backdrop-blur-sm">
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-violet-300">
            OIDC Adapter
          </p>
          <h1 className="text-3xl font-bold leading-tight sm:text-4xl">
            React + Tailwind frontend connected to your Express OIDC backend
          </h1>
          <p className="mt-3 text-slate-300">
            Authenticate via your OpenID Connect provider and manage user sessions through
            the backend adapter.
          </p>

          <div className="mt-8 rounded-2xl border border-slate-700 bg-slate-950/70 p-5">
            {isLoading ? (
              <p className="text-slate-300">Checking authentication status...</p>
            ) : authState.authenticated ? (
              <div className="space-y-3">
                <p className="text-emerald-300">✅ You are logged in.</p>
                <div className="space-y-1 text-sm text-slate-200">
                  <p>
                    <span className="font-semibold text-slate-400">Name:</span>{' '}
                    {authState.user.name ?? 'N/A'}
                  </p>
                  <p>
                    <span className="font-semibold text-slate-400">Email:</span>{' '}
                    {authState.user.email ?? 'N/A'}
                  </p>
                  <p>
                    <span className="font-semibold text-slate-400">Subject:</span>{' '}
                    {authState.user.sub}
                  </p>
                  <p>
                    <span className="font-semibold text-slate-400">Token expires:</span>{' '}
                    {tokenExpiry}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-amber-200">You are currently logged out.</p>
            )}

            {errorMessage ? (
              <p className="mt-4 rounded-lg border border-rose-400/50 bg-rose-900/40 px-3 py-2 text-sm text-rose-200">
                {errorMessage}
              </p>
            ) : null}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleLogin}
              className="rounded-lg bg-violet-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-400"
            >
              Login with OIDC
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg border border-slate-600 px-5 py-2.5 text-sm font-semibold text-slate-100 transition hover:border-slate-500 hover:bg-slate-800"
            >
              Logout
            </button>
            <button
              type="button"
              onClick={() => {
                setIsLoading(true)
                void fetchAuthState()
              }}
              className="rounded-lg border border-slate-700 px-5 py-2.5 text-sm font-semibold text-slate-200 transition hover:border-slate-500 hover:bg-slate-800"
            >
              Refresh status
            </button>
          </div>
        </section>
      </div>
    </main>
  )
}

export default Home
