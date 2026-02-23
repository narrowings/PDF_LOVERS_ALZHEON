/**
 * PRUEBAS FUNCIONALES - Backend: Endpoints del Memorama
 * Verifica que guardar sesiones y obtener análisis
 * funcionan correctamente.
 *
 * Ejecutar: cd backend && npx jest tests/memorama --runInBand
 */

import request from 'supertest'
import app from '../../server.js'

const getToken = async (credentials) => {
  const res = await request(app).post('/api/login').send(credentials)
  const setCookie = res.headers['set-cookie']
  if (!setCookie) throw new Error('No se recibió cookie en login')
  const tokenCookie = setCookie.find(c => c.startsWith('token='))
  return tokenCookie ? tokenCookie.split(';')[0].replace('token=', '') : null
}

let tokenPaciente
let tokenCuidador
let tokenMedico
let sesionGuardadaId

beforeAll(async () => {
  tokenPaciente = await getToken({
    email: process.env.TEST_PACIENTE_EMAIL,
    password: process.env.TEST_PACIENTE_PASSWORD,
  })
  tokenCuidador = await getToken({
    email: process.env.TEST_CUIDADOR_EMAIL,
    password: process.env.TEST_CUIDADOR_PASSWORD,
  })
  tokenMedico = await getToken({
    email: process.env.TEST_MEDICO_EMAIL,
    password: process.env.TEST_MEDICO_PASSWORD,
  })
})

// ─── POST /api/paciente/memorama ────────────────────────────────────────────

describe('[MEMORAMA] POST /api/paciente/memorama - Guardar sesión', () => {

  it('[MEM-API-01] Guarda una sesión completa y devuelve 201', async () => {
    const res = await request(app)
      .post('/api/paciente/memorama')
      .set('Cookie', `token=${tokenPaciente}`)
      .send({
        nivel1: { completado: true, tiempoSegundos: 45, errores: 1 },
        nivel2: { completado: true, tiempoSegundos: 80, errores: 2 },
        nivel3: { completado: true, tiempoSegundos: 110, errores: 0 },
      })
      .expect(201)

    expect(res.body).toHaveProperty('ok', true)
    expect(res.body).toHaveProperty('sesion')
    expect(res.body.sesion).toHaveProperty('_id')
    expect(res.body.sesion).toHaveProperty('completadoTotal', true)
    expect(res.body.sesion).toHaveProperty('tiempoTotal')

    // Guardar el ID para verificarlo después
    sesionGuardadaId = res.body.sesion._id
  })

  it('[MEM-API-02] Guarda una sesión parcial (solo nivel 1 completado)', async () => {
    const res = await request(app)
      .post('/api/paciente/memorama')
      .set('Cookie', `token=${tokenPaciente}`)
      .send({
        nivel1: { completado: true, tiempoSegundos: 60, errores: 0 },
        nivel2: { completado: false, tiempoSegundos: null, errores: 0 },
        nivel3: { completado: false, tiempoSegundos: null, errores: 0 },
      })
      .expect(201)

    expect(res.body.ok).toBe(true)
    expect(res.body.sesion.completadoTotal).toBe(false)
  })

  it('[MEM-API-03] Calcula tiempoTotal correctamente sumando niveles completados', async () => {
    const res = await request(app)
      .post('/api/paciente/memorama')
      .set('Cookie', `token=${tokenPaciente}`)
      .send({
        nivel1: { completado: true, tiempoSegundos: 30, errores: 0 },
        nivel2: { completado: true, tiempoSegundos: 70, errores: 1 },
        nivel3: { completado: true, tiempoSegundos: 100, errores: 2 },
      })
      .expect(201)

    // tiempoTotal = 30 + 70 + 100 = 200
    expect(res.body.sesion.tiempoTotal).toBe(200)
  })

  it('[MEM-API-04] Sin token devuelve 401', async () => {
    await request(app)
      .post('/api/paciente/memorama')
      .send({
        nivel1: { completado: true, tiempoSegundos: 45, errores: 0 },
        nivel2: { completado: true, tiempoSegundos: 80, errores: 0 },
        nivel3: { completado: true, tiempoSegundos: 110, errores: 0 },
      })
      .expect(401)
  })

  it('[MEM-API-05] Token de cuidador devuelve 403 (solo paciente puede guardar)', async () => {
    await request(app)
      .post('/api/paciente/memorama')
      .set('Cookie', `token=${tokenCuidador}`)
      .send({
        nivel1: { completado: true, tiempoSegundos: 45, errores: 0 },
        nivel2: { completado: true, tiempoSegundos: 80, errores: 0 },
        nivel3: { completado: true, tiempoSegundos: 110, errores: 0 },
      })
      .expect(403)
  })

  it('[MEM-API-06] Token de médico devuelve 403', async () => {
    await request(app)
      .post('/api/paciente/memorama')
      .set('Cookie', `token=${tokenMedico}`)
      .send({
        nivel1: { completado: true, tiempoSegundos: 45, errores: 0 },
        nivel2: { completado: true, tiempoSegundos: 80, errores: 0 },
        nivel3: { completado: true, tiempoSegundos: 110, errores: 0 },
      })
      .expect(403)
  })
})

// ─── GET /api/paciente/memorama ─────────────────────────────────────────────

describe('[MEMORAMA] GET /api/paciente/memorama - Obtener sesiones', () => {

  it('[MEM-API-07] Devuelve 200 y array de sesiones', async () => {
    const res = await request(app)
      .get('/api/paciente/memorama')
      .set('Cookie', `token=${tokenPaciente}`)
      .expect(200)

    expect(Array.isArray(res.body)).toBe(true)
  })

  it('[MEM-API-08] Las sesiones tienen la estructura correcta', async () => {
    const res = await request(app)
      .get('/api/paciente/memorama')
      .set('Cookie', `token=${tokenPaciente}`)
      .expect(200)

    if (res.body.length > 0) {
      const sesion = res.body[0]
      expect(sesion).toHaveProperty('_id')
      expect(sesion).toHaveProperty('fecha')
      expect(sesion).toHaveProperty('nivel1')
      expect(sesion).toHaveProperty('nivel2')
      expect(sesion).toHaveProperty('nivel3')
      expect(sesion).toHaveProperty('completadoTotal')
    }
  })

  it('[MEM-API-09] La sesión guardada en MEM-API-01 aparece en el historial', async () => {
    if (!sesionGuardadaId) return

    const res = await request(app)
      .get('/api/paciente/memorama')
      .set('Cookie', `token=${tokenPaciente}`)
      .expect(200)

    const ids = res.body.map(s => s._id)
    expect(ids).toContain(sesionGuardadaId)
  })

  it('[MEM-API-10] Sin token devuelve 401', async () => {
    await request(app).get('/api/paciente/memorama').expect(401)
  })

  it('[MEM-API-11] Token de médico devuelve 403', async () => {
    await request(app)
      .get('/api/paciente/memorama')
      .set('Cookie', `token=${tokenMedico}`)
      .expect(403)
  })
})

// ─── GET /api/paciente/memorama/analisis ───────────────────────────────────

describe('[MEMORAMA] GET /api/paciente/memorama/analisis - Análisis cognitivo', () => {

  it('[MEM-API-12] Devuelve 200 con estructura de análisis', async () => {
    const res = await request(app)
      .get('/api/paciente/memorama/analisis')
      .set('Cookie', `token=${tokenPaciente}`)
      .expect(200)

    expect(res.body).toHaveProperty('habilidades')
    expect(res.body).toHaveProperty('observacion')
    expect(res.body).toHaveProperty('tendencia')
    expect(res.body).toHaveProperty('sesionesAnalizadas')
  })

  it('[MEM-API-13] Las habilidades tienen las 6 métricas cognitivas', async () => {
    const res = await request(app)
      .get('/api/paciente/memorama/analisis')
      .set('Cookie', `token=${tokenPaciente}`)
      .expect(200)

    const h = res.body.habilidades
    expect(h).toHaveProperty('memoriaVisual')
    expect(h).toHaveProperty('atencion')
    expect(h).toHaveProperty('velocidadProcesamiento')
    expect(h).toHaveProperty('reconocimientoPatrones')
    expect(h).toHaveProperty('concentracion')
    expect(h).toHaveProperty('memoriaCortoPlazo')
  })

  it('[MEM-API-14] La tendencia es uno de los valores válidos', async () => {
    const res = await request(app)
      .get('/api/paciente/memorama/analisis')
      .set('Cookie', `token=${tokenPaciente}`)
      .expect(200)

    expect(['mejorando', 'estable', 'necesita-apoyo'])
      .toContain(res.body.tendencia)
  })

  it('[MEM-API-15] Sin token devuelve 401', async () => {
    await request(app)
      .get('/api/paciente/memorama/analisis')
      .expect(401)
  })

  it('[MEM-API-16] Token de médico devuelve 403', async () => {
    await request(app)
      .get('/api/paciente/memorama/analisis')
      .set('Cookie', `token=${tokenMedico}`)
      .expect(403)
  })
})
