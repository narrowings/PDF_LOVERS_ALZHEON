/// <reference types="cypress" />

/**
 * REGRESSION TESTS - Autenticación (legacy)
 * Verifica que login/logout/registro siguen funcionando
 * después de agregar el Memorama.
 */

describe('[REGRESIÓN] Auth - Login y sesión (legacy)', () => {

  beforeEach(() => {
    cy.clearCookies()
    cy.clearLocalStorage()
    cy.visit('/login')
  })

  it('[REG-AUTH-01] La página de login carga correctamente', () => {
    cy.contains('Ingresar').should('be.visible')
    cy.get('input[type="email"]').should('be.visible')
    cy.get('input[type="password"]').should('be.visible')
    cy.get('button[type="submit"]').should('be.visible')
  })

  it('[REG-AUTH-02] Muestra error con credenciales inválidas', () => {
    cy.get('input[type="email"]').type('noexiste@test.com')
    cy.get('input[type="password"]').type('WrongPassword123')
    cy.get('button[type="submit"]').click()
    cy.contains(/credenciales|incorrecta|error/i, { timeout: 5000 }).should('be.visible')
  })

  it('[REG-AUTH-03] Valida campos vacíos (no debe enviar el form)', () => {
    cy.get('button[type="submit"]').click()
    cy.get('input[type="email"]:invalid').should('exist')
    cy.url().should('include', '/login')
  })

  it('[REG-AUTH-04] Valida formato de email incorrecto', () => {
    cy.get('input[type="email"]').type('emailsindominio')
    cy.get('input[type="password"]').type('Test1234!')
    cy.get('button[type="submit"]').click()
    cy.get('input[type="email"]:invalid').should('exist')
  })

  it('[REG-AUTH-05] Paciente puede iniciar sesión y llega a su dashboard', () => {
    cy.get('input[type="email"]').type(Cypress.env('PACIENTE_EMAIL'))
    cy.get('input[type="password"]').type(Cypress.env('PACIENTE_PASSWORD'))
    cy.get('button[type="submit"]').click()
    cy.url({ timeout: 10000 }).should('include', '/paciente')
    cy.contains('Mis Fotos', { timeout: 5000 }).should('be.visible')
    cy.getCookie('token').should('exist')
  })

  it('[REG-AUTH-06] Cuidador puede iniciar sesión y llega a su dashboard', () => {
    cy.get('input[type="email"]').type(Cypress.env('CUIDADOR_EMAIL'))
    cy.get('input[type="password"]').type(Cypress.env('CUIDADOR_PASSWORD'))
    cy.get('button[type="submit"]').click()
    cy.url({ timeout: 10000 }).should('include', '/cuidador')
    cy.contains(/fotos|paciente/i, { timeout: 5000 }).should('be.visible')
    cy.getCookie('token').should('exist')
  })

  it('[REG-AUTH-07] Médico puede iniciar sesión y llega a su dashboard', () => {
    cy.get('input[type="email"]').type(Cypress.env('MEDICO_EMAIL'))
    cy.get('input[type="password"]').type(Cypress.env('MEDICO_PASSWORD'))
    cy.get('button[type="submit"]').click()
    cy.url({ timeout: 10000 }).should('include', '/medico')
    cy.contains(/pacientes|médico/i, { timeout: 5000 }).should('be.visible')
    cy.getCookie('token').should('exist')
  })

  it('[REG-AUTH-08] Paciente puede cerrar sesión y vuelve al login', () => {
    cy.loginAs('paciente')
    cy.get('main, [class*="dashboard"], [class*="content"]')
      .contains(/cerrar sesión|logout|salir/i)
      .click()
    cy.url({ timeout: 5000 }).should('include', '/login')
    cy.getCookie('token').should('not.exist')
  })

  it('[REG-AUTH-09] Sin sesión activa, /paciente redirige al login', () => {
    cy.visit('/paciente/dashboard', { failOnStatusCode: false })
    cy.url({ timeout: 5000 }).should('include', '/login')
  })

  it('[REG-AUTH-10] Sin sesión activa, /medico redirige al login', () => {
    cy.visit('/medico/dashboard', { failOnStatusCode: false })
    cy.url({ timeout: 5000 }).should('include', '/login')
  })
})

describe('[REGRESIÓN] Auth - Registro (legacy)', () => {

  beforeEach(() => {
    cy.clearCookies()
    cy.clearLocalStorage()
    cy.visit('/register')
  })

  it('[REG-AUTH-11] La página de registro carga correctamente', () => {
    cy.contains(/registr|crear cuenta/i).should('be.visible')
    cy.get('input[name="nombre"]').should('be.visible')
    cy.get('input[type="email"]').should('be.visible')
    cy.get('input[type="password"]').should('be.visible')
    cy.get('select[name="rol"]').should('be.visible')
  })

  it('[REG-AUTH-12] No puede registrarse con email ya existente', () => {
    cy.get('input[name="nombre"]').type('Usuario Duplicado')
    cy.get('input[type="email"]').type(Cypress.env('PACIENTE_EMAIL'))
    cy.get('input[type="password"]').first().type('Test1234!')
    cy.get('input[type="password"]').eq(1).type('Test1234!')
    cy.get('select[name="rol"]').select('paciente')
    cy.get('button[type="submit"]').click()
    cy.contains(/ya existe|registrado|duplicado/i, { timeout: 5000 }).should('be.visible')
  })

  it('[REG-AUTH-13] Tiene link de navegación hacia el login', () => {
    cy.contains(/iniciar sesión|login/i).should('be.visible').click()
    cy.url().should('include', '/login')
  })
})