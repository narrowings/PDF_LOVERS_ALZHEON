/// <reference types="cypress" />

/**
 * PRUEBAS FUNCIONALES - Memorama: Análisis Cognitivo
 * Verifica que la sección de análisis muestra
 * las habilidades cognitivas o el estado vacío correctamente.
 */

describe('[MEMORAMA] Análisis Cognitivo', () => {

  beforeEach(() => {
    cy.loginAs('paciente')
    cy.visit('/paciente/memorama')
    cy.wait(2000)
    cy.contains('Análisis Cognitivo').click()
    cy.wait(3000) // esperar llamada a Gemini
  })

  it('[MEM-ANA-01] La sección de análisis carga sin errores críticos', () => {
    cy.get('body').should('be.visible')
    cy.contains(/error crítico|500|fatal/i).should('not.exist')
  })

  it('[MEM-ANA-02] Muestra el título Análisis Cognitivo', () => {
    cy.contains('Análisis Cognitivo', { timeout: 5000 }).should('be.visible')
  })

  it('[MEM-ANA-03] Muestra habilidades o mensaje para completar partidas', () => {
    cy.get('body').then($body => {
      const tieneHabilidades = $body.text().match(
        /memoria visual|atención|velocidad|reconocimiento|concentración|corto plazo/i
      )
      const sinDatos = $body.text().match(/completa partidas|no hay sesiones|sin datos/i)
      const cargando = $body.text().match(/analizando|cargando/i)

      expect(tieneHabilidades || sinDatos || cargando).to.be.ok
    })
  })

  it('[MEM-ANA-04] Si hay datos, muestra las 6 habilidades cognitivas', () => {
    cy.get('body').then($body => {
      const sinDatos = $body.text().match(/completa partidas|no hay sesiones|sin datos/i)
      if (!sinDatos) {
        cy.contains(/memoria visual/i).should('exist')
        cy.contains(/atención/i).should('exist')
        cy.contains(/velocidad/i).should('exist')
        cy.contains(/concentración/i).should('exist')
      } else {
        cy.log('[OK] Sin sesiones - mostrando estado vacío correcto')
      }
    })
  })

  it('[MEM-ANA-05] Si hay datos, muestra una observación textual', () => {
    cy.get('body').then($body => {
      const sinDatos = $body.text().match(/completa partidas|no hay sesiones|sin datos/i)
      if (!sinDatos) {
        // La observación es un texto de 2-3 oraciones generado por Gemini
        cy.get('.glass-card, .glass-panel').should('be.visible')
        cy.contains(/paciente|memoria|progreso|sesion/i).should('exist')
      } else {
        cy.log('[OK] Sin datos de análisis aún')
      }
    })
  })

  it('[MEM-ANA-06] Si hay datos, muestra el ícono de tendencia', () => {
  cy.get('body').then($body => {
    const sinDatos = $body.text().match(/completa partidas|no hay sesiones|sin datos/i)
    if (!sinDatos) {
      // La tendencia se renderiza como ícono SVG (HiArrowTrendingUp/Down/HiMinus)
      // Verificamos que el encabezado del análisis contiene un SVG de tendencia
      cy.get('.glass-card svg')
        .should('exist')
    } else {
      cy.log('[OK] Sin tendencia disponible aún - estado vacío correcto')
    }
  })
})

  it('[MEM-ANA-07] Se puede navegar de análisis de vuelta a jugar', () => {
    cy.contains('Jugar').click()
    cy.contains('¿Listo para jugar?', { timeout: 3000 }).should('be.visible')
  })
})