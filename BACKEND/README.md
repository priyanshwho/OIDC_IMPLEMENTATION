# Backend (Express + TypeScript + OIDC Adapter)

This backend exposes an OIDC adapter layer for authentication.

## Routes

- `GET /health` – health check
- `GET /auth/login` – redirect user to OIDC provider
- `GET /auth/callback` – authorization code callback endpoint
- `GET /auth/me` – returns authenticated user session info
- `GET /auth/logout` – clears session and starts OIDC logout if available

## Setup

1. Install dependencies.
2. Fill in `.env` with your OIDC provider values.
3. Run development server.

## Required environment variables

- `SESSION_SECRET`
- `OIDC_ISSUER_URL`
- `OIDC_CLIENT_ID`
- `OIDC_CLIENT_SECRET`

You can copy defaults from `.env.example`.
