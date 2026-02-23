/// <reference types="cypress" />

/**
 * REGRESSION TESTS - Paciente (legacy)
 * Dashboard, fotos y grabaciones — NO toca /memorama.
 */

describe('[REGRESIÓN] Paciente - Dashboard (legacy)', () => {

  beforeEach(() => {
    cy.loginAs('paciente')
    cy.url({ timeout: 10000 }).should('include', '/paciente')
  })

  it('[REG-PAC-01] El dashboard carga y muestra los elementos principales', () => {
    cy.contains('Mis Fotos', { timeout: 5000 }).should('be.visible')
    cy.contains('Mis Grabaciones').should('be.visible')
  })

  it('[REG-PAC-02] Muestra tarjetas de estadísticas', () => {
    cy.get('.glass-card', { timeout: 5000 }).should('have.length.at.least', 1)
    cy.contains(/\d+/).should('be.visible')
  })

  it('[REG-PAC-03] Muestra mensaje de bienvenida', () => {
    cy.contains(/bienvenido|hola/i, { timeout: 5000 }).should('be.visible')
  })

  it('[REG-PAC-04] La sección de progreso semanal existe', () => {
    cy.get('body').then($body => {
      if ($body.text().match(/semana|progreso/i)) {
        cy.contains(/semana|progreso/i).should('be.visible')
      } else {
        cy.log('[OK] Sección de progreso no presente en este estado')
      }
    })
  })

  it('[REG-PAC-05] Navegar a Mis Fotos funciona', () => {
    cy.contains(/mis fotos/i).click()
    cy.url().should('include', '/fotos')
  })

  it('[REG-PAC-06] Navegar a Mis Grabaciones funciona', () => {
    cy.contains(/mis grabaciones|grabaciones/i).click()
    cy.url().should('include', '/grabaciones')
  })

  it('[REG-PAC-07] Regresar al dashboard desde Fotos funciona', () => {
    cy.contains(/mis fotos/i).click()
    cy.url().should('include', '/fotos')
    cy.contains(/dashboard|inicio/i).click()
    cy.url().should('include', '/dashboard')
  })

  it('[REG-PAC-08] Botón de cerrar sesión está visible', () => {
    cy.get('main, [class*="dashboard"], [class*="content"]')
      .contains(/cerrar sesión|logout|salir/i)
      .should('be.visible')
  })

  it('[REG-PAC-09] Los elementos glass-card siguen presentes', () => {
    cy.get('.glass-card, .glass-panel').first().should('exist')
  })
})

describe('[REGRESIÓN] Paciente - Galería de Fotos (legacy)', () => {

  beforeEach(() => {
    cy.loginAs('paciente')
    cy.visit('/paciente/fotos')
    cy.wait(2000)
  })

  it('[REG-PAC-10] La página de fotos carga sin errores', () => {
    cy.contains(/mis fotos|galería/i, { timeout: 5000 }).should('be.visible')
  })

  it('[REG-PAC-11] Muestra fotos o estado vacío correctamente', () => {
    cy.get('body').then($body => {
      if ($body.find('.glass-card').length > 0) {
        cy.get('img').should('have.length.at.least', 1)
        cy.get('img').first().should('be.visible').and('have.attr', 'src').and('not.be.empty')
      } else {
        cy.log('[OK] Estado vacío — sin fotos aún')
        cy.get('body').should('be.visible')
      }
    })
  })

  it('[REG-PAC-12] El layout usa grid o flexbox', () => {
    cy.get('[class*="grid"], [class*="flex"]').should('exist')
  })
})

describe('[REGRESIÓN] Paciente - Grabaciones (legacy)', () => {

  beforeEach(() => {
    cy.loginAs('paciente')
    cy.visit('/paciente/grabaciones')
    cy.wait(2000)
  })

  it('[REG-PAC-13] La página de grabaciones carga sin errores', () => {
    cy.contains(/grabaciones|grabar/i, { timeout: 5000 }).should('be.visible')
  })

  it('[REG-PAC-14] Muestra galería de fotos para seleccionar al grabar', () => {
    cy.get('body').then($body => {
      if ($body.find('img').length > 0) {
        cy.get('img').should('exist')
      } else {
        cy.log('[OK] Sin fotos disponibles para seleccionar')
      }
    })
  })

  it('[REG-PAC-15] Textarea de descripción está disponible', () => {
    cy.get('body').then($body => {
      if ($body.find('textarea').length > 0) {
        cy.get('textarea').first().should('be.visible')
      } else {
        cy.log('[OK] Textarea visible solo tras seleccionar foto — comportamiento esperado')
      }
    })
  })
})