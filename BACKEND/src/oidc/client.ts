import { Issuer, generators, type Client } from 'openid-client'

import { env } from '../config/env'

export type AuthRequestContext = {
  state: string
  nonce: string
  codeVerifier: string
  codeChallenge: string
}

let issuerPromise: Promise<Issuer<Client>> | null = null
let clientPromise: Promise<Client> | null = null

export const getOidcIssuer = async (): Promise<Issuer<Client>> => {
  if (!issuerPromise) {
    issuerPromise = Issuer.discover(env.oidcIssuerUrl)
  }

  return issuerPromise
}

export const getOidcClient = async (): Promise<Client> => {
  if (!clientPromise) {
    clientPromise = getOidcIssuer().then((issuer) => {
      return new issuer.Client({
        client_id: env.oidcClientId,
        client_secret: env.oidcClientSecret,
        redirect_uris: [env.oidcRedirectUri],
        response_types: ['code'],
      })
    })
  }

  return clientPromise
}

export const createAuthRequestContext = (): AuthRequestContext => {
  const state = generators.state()
  const nonce = generators.nonce()
  const codeVerifier = generators.codeVerifier()
  const codeChallenge = generators.codeChallenge(codeVerifier)

  return {
    state,
    nonce,
    codeVerifier,
    codeChallenge,
  }
}
