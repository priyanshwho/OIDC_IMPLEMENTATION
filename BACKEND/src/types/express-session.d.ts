import 'express-session'

declare module 'express-session' {
  interface SessionData {
    oidc?: {
      state?: string
      nonce?: string
      codeVerifier?: string
      returnTo?: string
      user?: {
        sub: string
        name?: string
        email?: string
        preferredUsername?: string
        claims: Record<string, unknown>
      }
      idToken?: string
      expiresAt?: number
    }
  }
}
