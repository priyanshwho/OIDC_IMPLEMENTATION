import dotenv from 'dotenv'

dotenv.config()

const readString = (name: string, fallback?: string): string => {
  const value = process.env[name] ?? fallback

  if (!value || value.trim() === '' || value.includes('REPLACE_ME')) {
    throw new Error(`Missing required environment variable: ${name}`)
  }

  return value
}

const readNumber = (name: string, fallback: number): number => {
  const rawValue = process.env[name]
  if (!rawValue) {
    return fallback
  }

  const parsedValue = Number.parseInt(rawValue, 10)
  if (Number.isNaN(parsedValue)) {
    throw new Error(`Environment variable ${name} must be a valid number`)
  }

  return parsedValue
}

const nodeEnv = process.env.NODE_ENV ?? 'development'
const port = readNumber('PORT', 4000)
const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:5173'
const oidcRedirectUri =
  process.env.OIDC_REDIRECT_URI ?? `http://localhost:${port}/auth/callback`

export const env = {
  nodeEnv,
  port,
  frontendUrl,
  sessionSecret: readString('SESSION_SECRET'),
  oidcIssuerUrl: readString('OIDC_ISSUER_URL'),
  oidcClientId: readString('OIDC_CLIENT_ID'),
  oidcClientSecret: readString('OIDC_CLIENT_SECRET'),
  oidcRedirectUri,
  oidcScopes: process.env.OIDC_SCOPES ?? 'openid profile email',
  oidcPostLogoutRedirectUri:
    process.env.OIDC_POST_LOGOUT_REDIRECT_URI ?? frontendUrl,
} as const
