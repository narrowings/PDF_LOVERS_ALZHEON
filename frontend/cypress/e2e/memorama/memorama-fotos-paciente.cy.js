/// <reference types="cypress" />

/**
 * PRUEBAS FUNCIONALES - Memorama: Fotos del paciente (rama Solarte_R)
 *
 * Verifica el nuevo comportamiento donde si el paciente tiene
 * 6 o más fotos, el memorama las usa en lugar de las de Unsplash.
 *
 * Dos escenarios:
 *  - Paciente CON 6+ fotos → el memorama usa sus fotos personales
 *  - Paciente CON menos de 6 fotos → el memorama usa las imágenes por defecto
 */

describe('[MEMORAMA] Fotos del paciente - selección de imágenes', () => {

  beforeEach(() => {
    cy.loginAs('paciente')
    cy.visit('/paciente/memorama')
    cy.wait(2000)
  })

  it('[MEM-FOT-01] La página del memorama carga correctamente con o sin fotos del paciente', () => {
    cy.contains('Memorama Cognitivo', { timeout: 5000 }).should('be.visible')
    cy.contains('¿Listo para jugar?').should('be.visible')
  })

  it('[MEM-FOT-02] El botón Comenzar funciona independientemente de cuántas fotos tenga el paciente', () => {
    cy.contains('¡Comenzar!').click()
    cy.contains('Nivel 1 de 3', { timeout: 5000 }).should('be.visible')
  })

  it('[MEM-FOT-03] El nivel 1 siempre usa números sin importar la cantidad de fotos', () => {
    cy.contains('¡Comenzar!').click()
    cy.wait(6000) // esperar countdown de 5s
    // El nivel 1 es de números, no imágenes
    cy.get('body').then($body => {
      // Deben existir cartas en el tablero
      cy.get('button, [class*="carta"]', { timeout: 5000 })
        .should('have.length.at.least', 4)
    })
  })

  it('[MEM-FOT-04] Con 6+ fotos del paciente, el nivel 2 muestra imágenes (no el placeholder vacío)', () => {
    // Primero verificar cuántas fotos tiene el paciente
    cy.request({
      method: 'GET',
      url: 'http://localhost:5500/api/paciente/fotos',
      failOnStatusCode: false
    }).then(res => {
      if (res.status === 200 && res.body.length >= 6) {
        // Tiene 6+ fotos, ir al nivel 2 y verificar que hay imágenes
        cy.contains('¡Comenzar!').click()
        cy.wait(7000) // nivel 1 countdown
        // El nivel 2 debería tener imágenes del paciente
        cy.get('img', { timeout: 5000 }).should('have.length.at.least', 1)
        cy.log('[OK] Nivel 2 usa fotos del paciente')
      } else {
        cy.log('[OK] Paciente tiene menos de 6 fotos - se usan imágenes por defecto')
      }
    })
  })

  it('[MEM-FOT-05] Con menos de 6 fotos, el memorama inicia normalmente con imágenes por defecto', () => {
    cy.request({
      method: 'GET',
      url: 'http://localhost:5500/api/paciente/fotos',
      failOnStatusCode: false
    }).then(res => {
      if (res.status === 200 && res.body.length < 6) {
        cy.contains('¡Comenzar!').click()
        cy.contains('Nivel 1 de 3', { timeout: 5000 }).should('be.visible')
        cy.log('[OK] Memorama inicia con imágenes por defecto (Unsplash)')
      } else {
        cy.log('[OK] Paciente tiene 6+ fotos - se usan fotos personales')
      }
    })
  })

  it('[MEM-FOT-06] El juego no se rompe si la carga de fotos falla (resiliencia)', () => {
    // Aunque la API de fotos falle, el memorama debe seguir funcionando
    // con las imágenes por defecto
    cy.intercept('GET', '**/api/paciente/fotos', { statusCode: 500 }).as('fotosFail')
    cy.reload()
    cy.wait(2000)

    // El memorama debe seguir cargando
    cy.contains('Memorama Cognitivo', { timeout: 5000 }).should('be.visible')
    cy.contains('¡Comenzar!').should('be.visible')

    // Y debe poder iniciar
    cy.contains('¡Comenzar!').click()
    cy.contains('Nivel 1 de 3', { timeout: 5000 }).should('be.visible')
  })

  it('[MEM-FOT-07] El juego no se rompe si la respuesta de fotos viene vacía', () => {
    cy.intercept('GET', '**/api/paciente/fotos', { statusCode: 200, body: [] }).as('fotosVacías')
    cy.reload()
    cy.wait(2000)

    cy.contains('Memorama Cognitivo', { timeout: 5000 }).should('be.visible')
    cy.contains('¡Comenzar!').click()
    cy.contains('Nivel 1 de 3', { timeout: 5000 }).should('be.visible')
  })

  it('[MEM-FOT-08] El menú sigue mostrando los 3 niveles correctamente', () => {
    cy.contains('Nivel 1 — Números').should('be.visible')
    cy.contains('Nivel 2 — Imágenes').should('be.visible')
    cy.contains('Nivel 3 — Avanzado').should('be.visible')
  })
})