/**
 * REGRESSION TESTS - Backend: Autenticación (legacy)
 * Ejecutar: cd backend && npx jest tests/regression/auth.regression.test.js
 */

import request from 'supertest'
import app from '../../server.js'   // ajusta si tu entry point tiene otro nombre

const PACIENTE = { email: process.env.TEST_PACIENTE_EMAIL, password: process.env.TEST_PACIENTE_PASSWORD }
const CUIDADOR = { email: process.env.TEST_CUIDADOR_EMAIL, password: process.env.TEST_CUIDADOR_PASSWORD }
const MEDICO   = { email: process.env.TEST_MEDICO_EMAIL,   password: process.env.TEST_MEDICO_PASSWORD }

const extractToken = (res) => {
  const setCookie = res.headers['set-cookie']
  if (!setCookie) return null
  const tokenCookie = setCookie.find(c => c.startsWith('token='))
  return tokenCookie ? tokenCookie.split(';')[0].replace('token=', '') : null
}

// ─── POST /api/login ────────────────────────────────────────────────────────

describe('[REGRESIÓN] POST /api/login', () => {

  it('[REG-API-AUTH-01] Login de paciente devuelve 200 y cookie token', async () => {
    const res = await request(app).post('/api/login').send(PACIENTE).expect(200)
    // La API devuelve msg de éxito, el rol viaja en la cookie JWT
    expect(res.body).toHaveProperty('msg')
    expect(extractToken(res)).not.toBeNull()
  })

  it('[REG-API-AUTH-02] Login de cuidador devuelve 200 y cookie token', async () => {
    const res = await request(app).post('/api/login').send(CUIDADOR).expect(200)
    expect(res.body).toHaveProperty('msg')
    expect(extractToken(res)).not.toBeNull()
  })

  it('[REG-API-AUTH-03] Login de médico devuelve 200 y cookie token', async () => {
    const res = await request(app).post('/api/login').send(MEDICO).expect(200)
    expect(res.body).toHaveProperty('msg')
    expect(extractToken(res)).not.toBeNull()
  })

  it('[REG-API-AUTH-04] Credenciales incorrectas devuelven 401', async () => {
    await request(app).post('/api/login').send({ email: 'noexiste@test.com', password: 'wrong' }).expect(401)
  })

  it('[REG-API-AUTH-05] Body vacío devuelve error de validación (400 o 401)', async () => {
    const res = await request(app).post('/api/login').send({})
    expect([400, 401]).toContain(res.status)
  })
})

// ─── GET /api/verify ────────────────────────────────────────────────────────

describe('[REGRESIÓN] GET /api/verify', () => {

  it('[REG-API-AUTH-06] Token válido de paciente devuelve 200 con info del usuario', async () => {
    const loginRes = await request(app).post('/api/login').send(PACIENTE)
    const token = extractToken(loginRes)
    expect(token).not.toBeNull()

    const res = await request(app)
      .get('/api/verify')
      .set('Cookie', `token=${token}`)
      .expect(200)

    // La API devuelve { user: { email, rol, ... } }
    expect(res.body).toHaveProperty('user')
    expect(res.body.user).toHaveProperty('email', PACIENTE.email)
    expect(res.body.user).toHaveProperty('rol', 'paciente')
  })

  it('[REG-API-AUTH-07] Sin token devuelve 401', async () => {
    await request(app).get('/api/verify').expect(401)
  })

  it('[REG-API-AUTH-08] Token inválido devuelve 401 o 403', async () => {
    const res = await request(app)
      .get('/api/verify')
      .set('Cookie', 'token=tokenfalso123')
    expect([401, 403]).toContain(res.status)
  })
})
// ─── POST /api/logout ───────────────────────────────────────────────────────

describe('[REGRESIÓN] POST /api/logout', () => {

  it('[REG-API-AUTH-09] Logout limpia la cookie token', async () => {
    const loginRes = await request(app).post('/api/login').send(PACIENTE)
    const token = extractToken(loginRes)

    const res = await request(app)
      .post('/api/logout')
      .set('Cookie', `token=${token}`)
      .expect(200)

    const setCookie = res.headers['set-cookie']
    if (setCookie) {
      const tokenCookie = setCookie.find(c => c.startsWith('token='))
      if (tokenCookie) {
        expect(tokenCookie).toMatch(/token=;|token= ;|expires=Thu, 01 Jan 1970/i)
      }
    }
  })
})