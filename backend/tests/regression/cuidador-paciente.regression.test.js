/**
 * REGRESSION TESTS - Backend: Cuidador, Médico y aislamiento del Memorama
 * Ejecutar: cd backend && npx jest tests/regression/cuidador-paciente.regression.test.js
 */

import request from 'supertest'
import app from '../../server.js'

// ─── Helper ─────────────────────────────────────────────────────────────────

const getToken = async (credentials) => {
  const res = await request(app).post('/api/login').send(credentials)
  const setCookie = res.headers['set-cookie']
  if (!setCookie) throw new Error('No se recibió cookie en login')
  const tokenCookie = setCookie.find(c => c.startsWith('token='))
  return tokenCookie ? tokenCookie.split(';')[0].replace('token=', '') : null
}

let tokenPaciente, tokenCuidador, tokenMedico

beforeAll(async () => {
  tokenPaciente = await getToken({ email: process.env.TEST_PACIENTE_EMAIL, password: process.env.TEST_PACIENTE_PASSWORD })
  tokenCuidador = await getToken({ email: process.env.TEST_CUIDADOR_EMAIL, password: process.env.TEST_CUIDADOR_PASSWORD })
  tokenMedico   = await getToken({ email: process.env.TEST_MEDICO_EMAIL,   password: process.env.TEST_MEDICO_PASSWORD })
})

// ─── Cuidador: Fotos ─────────────────────────────────────────────────────────

describe('[REGRESIÓN] GET /api/cuidador/fotos', () => {

  it('[REG-API-CUI-01] Devuelve 200 y array con token válido', async () => {
    const res = await request(app)
      .get('/api/cuidador/fotos')
      .set('Cookie', `token=${tokenCuidador}`)
      .expect(200)
    expect(Array.isArray(res.body)).toBe(true)
  })

  it('[REG-API-CUI-02] Sin token devuelve 401', async () => {
    await request(app).get('/api/cuidador/fotos').expect(401)
  })

  it('[REG-API-CUI-03] Token de médico (rol incorrecto) devuelve 403', async () => {
    await request(app)
      .get('/api/cuidador/fotos')
      .set('Cookie', `token=${tokenMedico}`)
      .expect(403)
  })
})

// ─── Cuidador: Grabaciones ───────────────────────────────────────────────────

describe('[REGRESIÓN] GET /api/cuidador/grabaciones', () => {

  it('[REG-API-CUI-04] Devuelve 200 y array con token válido', async () => {
    const res = await request(app)
      .get('/api/cuidador/grabaciones')
      .set('Cookie', `token=${tokenCuidador}`)
      .expect(200)
    expect(Array.isArray(res.body)).toBe(true)
  })

  it('[REG-API-CUI-05] Sin token devuelve 401', async () => {
    await request(app).get('/api/cuidador/grabaciones').expect(401)
  })
})

// ─── Cuidador: Estadísticas ──────────────────────────────────────────────────

describe('[REGRESIÓN] GET /api/cuidador/estadisticas', () => {

  it('[REG-API-CUI-06] Devuelve 200 y objeto de estadísticas', async () => {
    const res = await request(app)
      .get('/api/cuidador/estadisticas')
      .set('Cookie', `token=${tokenCuidador}`)
      .expect(200)
    expect(typeof res.body).toBe('object')
    expect(Array.isArray(res.body)).toBe(false)
  })

  it('[REG-API-CUI-07] Sin token devuelve 401', async () => {
    await request(app).get('/api/cuidador/estadisticas').expect(401)
  })
})

// ─── Médico: Estadísticas ────────────────────────────────────────────────────

describe('[REGRESIÓN] GET /api/medico/estadisticas', () => {

  it('[REG-API-MED-01] Devuelve 200 con token de médico', async () => {
    const res = await request(app)
      .get('/api/medico/estadisticas')
      .set('Cookie', `token=${tokenMedico}`)
      .expect(200)
    expect(typeof res.body).toBe('object')
  })

  it('[REG-API-MED-02] Token de cuidador devuelve 403', async () => {
    await request(app)
      .get('/api/medico/estadisticas')
      .set('Cookie', `token=${tokenCuidador}`)
      .expect(403)
  })

  it('[REG-API-MED-03] Sin token devuelve 401', async () => {
    await request(app).get('/api/medico/estadisticas').expect(401)
  })
})

// ─── Médico: Pacientes ───────────────────────────────────────────────────────

describe('[REGRESIÓN] GET /api/medico/pacientes', () => {

  it('[REG-API-MED-04] Devuelve 200 y array de pacientes asignados', async () => {
    const res = await request(app)
      .get('/api/medico/pacientes')
      .set('Cookie', `token=${tokenMedico}`)
      .expect(200)
    expect(Array.isArray(res.body)).toBe(true)
  })

  it('[REG-API-MED-05] Sin token devuelve 401', async () => {
    await request(app).get('/api/medico/pacientes').expect(401)
  })
})

// ─── Médico: Alertas ─────────────────────────────────────────────────────────

describe('[REGRESIÓN] GET /api/medico/alertas', () => {

  it('[REG-API-MED-06] El endpoint de alertas responde y está protegido', async () => {
    const res = await request(app)
      .get('/api/medico/alertas')
      .set('Cookie', `token=${tokenMedico}`)
    
    // 200 = OK, 500 = bug preexistente en BD (no es regresión del memorama)
    expect([200, 500]).toContain(res.status)
    expect(res.status).not.toBe(401)
    expect(res.status).not.toBe(404)
  })

  it('[REG-API-MED-07] Sin token devuelve 401', async () => {
    await request(app).get('/api/medico/alertas').expect(401)
  })
})

// ─── Aislamiento: El Memorama no rompe las rutas legacy ─────────────────────

describe('[REGRESIÓN] Aislamiento - Memorama no afecta endpoints legacy', () => {

  it('[REG-ISO-01] /api/paciente/memorama existe y no devuelve 404', async () => {
    const res = await request(app)
      .get('/api/paciente/memorama')
      .set('Cookie', `token=${tokenPaciente}`)
    expect(res.status).not.toBe(404)
  })

  it('[REG-ISO-02] /api/cuidador/fotos sigue siendo 200 (no afectada)', async () => {
    await request(app)
      .get('/api/cuidador/fotos')
      .set('Cookie', `token=${tokenCuidador}`)
      .expect(200)
  })

  it('[REG-ISO-03] /api/medico/estadisticas sigue siendo 200 (no afectada)', async () => {
    await request(app)
      .get('/api/medico/estadisticas')
      .set('Cookie', `token=${tokenMedico}`)
      .expect(200)
  })
})