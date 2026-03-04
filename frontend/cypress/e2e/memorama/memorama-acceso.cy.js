/// <reference types="cypress" />


describe('[MEMORAMA] Acceso y navegación', () => {

  beforeEach(() => {
    cy.loginAs('paciente')
    cy.visit('/paciente/memorama')
    cy.wait(2000)
  })

  it('[MEM-ACC-01] La página del memorama carga correctamente', () => {
    cy.contains('Memorama Cognitivo', { timeout: 5000 }).should('be.visible')
    cy.contains('Ejercita tu memoria').should('be.visible')
  })

  it('[MEM-ACC-02] Muestra los 3 botones de navegación interna', () => {
    cy.contains('Jugar').should('be.visible')
    cy.contains('Mis Resultados').should('be.visible')
    cy.contains('Análisis Cognitivo').should('be.visible')
  })

  it('[MEM-ACC-03] Por defecto aterriza en la sección Jugar', () => {
    cy.contains('¿Listo para jugar?', { timeout: 5000 }).should('be.visible')
    cy.contains('¡Comenzar!').should('be.visible')
  })

  it('[MEM-ACC-04] Navegar a Mis Resultados funciona', () => {
    cy.contains('Mis Resultados').click()
    cy.wait(1000)
    // La sección de resultados debe aparecer y la de juego desaparecer
    cy.contains('¿Listo para jugar?').should('not.exist')
  })

  it('[MEM-ACC-05] Navegar a Análisis Cognitivo funciona', () => {
    cy.contains('Análisis Cognitivo').click()
    cy.wait(1000)
    cy.contains('¿Listo para jugar?').should('not.exist')
  })

  it('[MEM-ACC-06] Navegar de vuelta a Jugar funciona', () => {
    cy.contains('Mis Resultados').click()
    cy.wait(500)
    cy.contains('Jugar').click()
    cy.contains('¿Listo para jugar?', { timeout: 3000 }).should('be.visible')
  })

  it('[MEM-ACC-07] Muestra la descripción de los 3 niveles en el menú', () => {
    cy.contains('Nivel 1 — Números').should('be.visible')
    cy.contains('Nivel 2 — Imágenes').should('be.visible')
    cy.contains('Nivel 3 — Avanzado').should('be.visible')
  })

  it('[MEM-ACC-08] Solo el paciente puede acceder - médico es redirigido', () => {
    cy.clearCookies()
    cy.clearLocalStorage()
    cy.loginAs('medico')
    cy.visit('/paciente/memorama', { failOnStatusCode: false })
    // El médico no debe poder ver el memorama del paciente
    cy.url().should('not.include', '/paciente/memorama')
  })

  it('[MEM-ACC-09] La nueva llamada a fotos no bloquea la carga del memorama', () => {
  // Verificar que aunque la llamada a fotos tarde, el menú carga
  cy.contains('¡Comenzar!', { timeout: 8000 }).should('be.visible')
  // Y que las secciones de navegación siguen funcionando
  cy.contains('Mis Resultados').should('be.visible')
  cy.contains('Análisis Cognitivo').should('be.visible')
})
})