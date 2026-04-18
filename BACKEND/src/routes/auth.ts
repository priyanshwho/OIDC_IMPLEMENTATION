import { Router, type Request } from 'express'

import { env } from '../config/env'
import {
  createAuthRequestContext,
  getOidcClient,
  getOidcIssuer,
} from '../oidc/client'

const router = Router()

const sanitizeReturnTo = (value: unknown): string => {
  if (typeof value !== 'string' || value.trim() === '') {
    return '/'
  }

  if (!value.startsWith('/') || value.startsWith('//')) {
    return '/'
  }

  return value
}

const destroySession = (request: Request): Promise<void> => {
  return new Promise((resolve, reject) => {
    request.session.destroy((error) => {
      if (error) {
        reject(error)
        return
      }

      resolve()
    })
  })
}

router.get('/login', async (request, response, next) => {
  try {
    const oidcClient = await getOidcClient()
    const { state, nonce, codeVerifier, codeChallenge } =
      createAuthRequestContext()

    request.session.oidc = {
      ...(request.session.oidc ?? {}),
      state,
      nonce,
      codeVerifier,
      returnTo: sanitizeReturnTo(request.query.returnTo),
    }

    const authorizationUrl = oidcClient.authorizationUrl({
      redirect_uri: env.oidcRedirectUri,
      response_type: 'code',
      scope: env.oidcScopes,
      state,
      nonce,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
    })

    response.redirect(authorizationUrl)
  } catch (error) {
    next(error)
  }
})

router.get('/callback', async (request, response, next) => {
  try {
    const providerError = request.query.error
    if (typeof providerError === 'string') {
      response.status(400).json({
        error: 'OIDC provider returned an error',
        providerError,
      })
      return
    }

    const oidcSession = request.session.oidc

    if (!oidcSession?.state || !oidcSession.codeVerifier || !oidcSession.nonce) {
      response.status(400).json({
        error:
          'Missing OIDC verification data in session. Start login flow again.',
      })
      return
    }

    const oidcClient = await getOidcClient()
    const params = oidcClient.callbackParams(request)

    const tokenSet = await oidcClient.callback(env.oidcRedirectUri, params, {
      state: oidcSession.state,
      nonce: oidcSession.nonce,
      code_verifier: oidcSession.codeVerifier,
    })

    const claims = tokenSet.claims() as Record<string, unknown>
    const subClaim = claims.sub

    if (typeof subClaim !== 'string') {
      throw new Error('OIDC token does not include a valid subject claim')
    }

    const returnTo = sanitizeReturnTo(oidcSession.returnTo)

    request.session.oidc = {
      user: {
        sub: subClaim,
        name: typeof claims.name === 'string' ? claims.name : undefined,
        email: typeof claims.email === 'string' ? claims.email : undefined,
        preferredUsername:
          typeof claims.preferred_username === 'string'
            ? claims.preferred_username
            : undefined,
        claims,
      },
      idToken: tokenSet.id_token,
      expiresAt: tokenSet.expires_at,
    }

    response.redirect(new URL(returnTo, env.frontendUrl).toString())
  } catch (error) {
    next(error)
  }
})

router.get('/me', (request, response) => {
  const sessionData = request.session.oidc

  if (!sessionData?.user) {
    response.json({ authenticated: false })
    return
  }

  response.json({
    authenticated: true,
    user: sessionData.user,
    expiresAt: sessionData.expiresAt,
  })
})

router.get('/logout', async (request, response, next) => {
  try {
    const idToken = request.session.oidc?.idToken
    let logoutUrl = env.oidcPostLogoutRedirectUri

    if (idToken) {
      const issuer = await getOidcIssuer()
      if (issuer.metadata.end_session_endpoint) {
        const oidcClient = await getOidcClient()
        logoutUrl = oidcClient.endSessionUrl({
          id_token_hint: idToken,
          post_logout_redirect_uri: env.oidcPostLogoutRedirectUri,
        })
      }
    }

    await destroySession(request)
    response.clearCookie('oidc.sid')
    response.redirect(logoutUrl)
  } catch (error) {
    next(error)
  }
})

export default router
