import cors from 'cors'
import express, { type ErrorRequestHandler } from 'express'
import session from 'express-session'

import { env } from './config/env'
import authRoutes from './routes/auth'

const app = express()
const isProduction = env.nodeEnv === 'production'


if (isProduction) {
  app.set('trust proxy', 1)
}

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use(
  cors({
    origin: env.frontendUrl,
    credentials: true,
  }),
)

app.use(
  session({
    name: 'oidc.sid',
    secret: env.sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      maxAge: 1000 * 60 * 60 * 8,
    },
  }),
)

app.get('/health', (_request, response) => {
  response.json({ status: 'ok', service: 'oidc-adapter-backend' })
})

app.use('/auth', authRoutes)

app.use((_request, response) => {
  response.status(404).json({ error: 'Route not found' })
})

const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  console.error('Unhandled backend error:', error)
  response.status(500).json({ error: 'Internal server error' })
}

app.use(errorHandler)

app.listen(env.port, () => {
  console.log(`OIDC adapter backend running on http://localhost:${env.port}`)
})
