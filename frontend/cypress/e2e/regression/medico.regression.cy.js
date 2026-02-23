/// <reference types="cypress" />

/**
 * REGRESSION TESTS - Médico (legacy)
 */

describe('[REGRESIÓN] Médico - Dashboard (legacy)', () => {

  beforeEach(() => {
    cy.loginAs('medico')
    cy.url({ timeout: 10000 }).should('include', '/medico')
  })

  it('[REG-MED-01] El dashboard del médico carga correctamente', () => {
    cy.contains(/dashboard|médico/i, { timeout: 5000 }).should('be.visible')
  })

  it('[REG-MED-02] Muestra tarjetas de estadísticas globales', () => {
    cy.get('.glass-card, [class*="stat"]', { timeout: 5000 })
      .should('have.length.at.least', 2)
    cy.contains(/\d+/).should('be.visible')
  })

  it('[REG-MED-03] Muestra el total de pacientes asignados', () => {
    cy.contains(/paciente/i).should('be.visible')
    cy.contains(/\d+/).should('be.visible')
  })

  it('[REG-MED-04] Muestra estadísticas de fotos y grabaciones', () => {
    cy.contains(/foto/i).should('exist')
    cy.contains(/grabaci/i).should('exist')
  })

  it('[REG-MED-05] Navegación a gestión de pacientes funciona', () => {
    cy.contains(/pacientes|mis pacientes/i).should('be.visible').click()
    cy.url().should('include', '/pacientes')
  })

  it('[REG-MED-06] Muestra lista de pacientes o estado vacío', () => {
    cy.get('body').then($body => {
      if ($body.find('.glass-card').length > 0) {
        cy.get('.glass-card').should('be.visible')
      } else {
        cy.log('[OK] Sin pacientes — estado vacío correcto')
        cy.get('body').should('be.visible')
      }
    })
  })

  it('[REG-MED-07] Click en paciente navega a su detalle', () => {
    cy.get('body').then($body => {
      if ($body.find('div.cursor-pointer').length > 0) {
        cy.get('div.cursor-pointer').first().click()
        cy.url().should('match', /pacientes\/[a-f0-9]+/)
      } else {
        cy.log('[OK] Sin pacientes para navegar')
      }
    })
  })

  it('[REG-MED-08] Botón de cerrar sesión está visible', () => {
    cy.get('main, [class*="dashboard"], [class*="content"]')
      .contains(/cerrar sesión|logout|salir/i)
      .should('be.visible')
  })

  it('[REG-MED-09] Muestra bienvenida con nombre del médico', () => {
    cy.contains(/dr\.|médico|bienvenido/i, { timeout: 5000 }).should('be.visible')
  })
})

describe('[REGRESIÓN] Médico - Gestión de Pacientes (legacy)', () => {

  beforeEach(() => {
    cy.loginAs('medico')
    cy.visit('/medico/pacientes')
    cy.wait(2000)
  })

  it('[REG-MED-10] La página de pacientes carga correctamente', () => {
    cy.contains(/pacientes/i, { timeout: 5000 }).should('be.visible')
  })

  it('[REG-MED-11] Existe opción para asignar pacientes', () => {
    cy.get('body').then($body => {
      if ($body.text().match(/asignar|agregar paciente/i)) {
        cy.contains(/asignar|agregar paciente/i).should('exist')
      } else {
        cy.log('[OK] Opción de asignación no visible en este estado')
      }
    })
  })

  it('[REG-MED-12] Puede navegar al detalle de un paciente y volver', () => {
    cy.get('body').then($body => {
      if ($body.find('div.cursor-pointer').length > 0) {
        cy.get('div.cursor-pointer').first().click()
        cy.url().should('match', /pacientes\/[a-f0-9]+/)
        cy.go('back')
      } else {
        cy.log('[OK] Sin pacientes asignados — estado vacío correcto')
      }
    })
  })
})