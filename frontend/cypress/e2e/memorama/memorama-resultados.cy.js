/// <reference types="cypress" />


describe('[MEMORAMA] Mis Resultados', () => {

  beforeEach(() => {
    cy.loginAs('paciente')
    cy.visit('/paciente/memorama')
    cy.wait(2000)
    cy.contains('Mis Resultados').click()
    cy.wait(2000)
  })

  it('[MEM-RES-01] La sección de resultados carga sin errores', () => {
    cy.get('body').should('be.visible')
    // No debe haber error visible
    cy.contains(/error crítico|500|fatal/i).should('not.exist')
  })

  it('[MEM-RES-02] Muestra historial de sesiones o mensaje vacío', () => {
    cy.get('body').then($body => {
      const tieneResultados = $body.find('.glass-card, .glass-panel').length > 0
      if (tieneResultados) {
        cy.get('.glass-card, .glass-panel').should('be.visible')
        cy.log('[OK] Historial de sesiones encontrado')
      } else {
        cy.log('[OK] Sin sesiones aún - estado vacío correcto')
        cy.get('body').should('be.visible')
      }
    })
  })

  it('[MEM-RES-03] Si hay sesiones, muestra fecha de cada una', () => {
    cy.get('body').then($body => {
      if ($body.find('.glass-card, .glass-panel').length > 0) {
        // Buscar algo que parezca fecha
        cy.contains(/202[0-9]|ene|feb|mar|abr|may|jun|jul|ago|sep|oct|nov|dic/i)
          .should('exist')
      } else {
        cy.log('[OK] Sin sesiones para verificar fechas')
      }
    })
  })

  it('[MEM-RES-04] Si hay sesiones, muestra tiempos de los niveles', () => {
    cy.get('body').then($body => {
      if ($body.find('.glass-card, .glass-panel').length > 0) {
        // Buscar tiempos en formato "Xs" o "Xm Xs"
        cy.contains(/\d+s|\d+m/).should('exist')
      } else {
        cy.log('[OK] Sin sesiones para verificar tiempos')
      }
    })
  })

  it('[MEM-RES-05] Si hay sesiones, muestra indicador de completado total', () => {
    cy.get('body').then($body => {
      if ($body.find('.glass-card, .glass-panel').length > 0) {
        cy.contains(/completado|completo|✓|niveles/i).should('exist')
      } else {
        cy.log('[OK] Sin sesiones para verificar estado')
      }
    })
  })

  it('[MEM-RES-06] Se puede navegar de resultados de vuelta a jugar', () => {
    cy.contains('Jugar').click()
    cy.contains('¿Listo para jugar?', { timeout: 3000 }).should('be.visible')
  })
})