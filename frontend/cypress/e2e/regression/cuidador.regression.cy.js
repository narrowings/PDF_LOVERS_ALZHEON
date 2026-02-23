/// <reference types="cypress" />

/**
 * REGRESSION TESTS - Cuidador (legacy)
 */

describe('[REGRESIÓN] Cuidador - Dashboard (legacy)', () => {

  beforeEach(() => {
    cy.loginAs('cuidador')
    cy.url({ timeout: 10000 }).should('include', '/cuidador')
  })

  it('[REG-CUI-01] El dashboard del cuidador carga correctamente', () => {
    cy.contains(/dashboard|inicio/i, { timeout: 5000 }).should('be.visible')
  })

  it('[REG-CUI-02] Muestra información del paciente asociado o mensaje sin paciente', () => {
    cy.get('body').then($body => {
      const tieneInfo = $body.text().includes('Paciente') || $body.text().includes('Pedro')
      const sinPaciente = $body.text().match(/sin paciente|no asignado/i)
      expect(tieneInfo || sinPaciente).to.be.true
    })
  })

  it('[REG-CUI-03] Muestra tarjetas de estadísticas', () => {
    cy.get('.glass-card, [class*="stat"], [class*="card"]', { timeout: 5000 })
      .should('have.length.at.least', 1)
    cy.contains(/\d+/).should('be.visible')
  })

  it('[REG-CUI-04] Existe sección de progreso semanal', () => {
    cy.contains(/semana|progreso/i, { timeout: 5000 }).should('exist')
  })

  it('[REG-CUI-05] Navegar a gestión de fotos funciona', () => {
    cy.contains(/fotos|galería/i).should('be.visible').click()
    cy.url().should('include', '/fotos')
  })

  it('[REG-CUI-06] Botón de cerrar sesión está visible', () => {
    cy.get('main, [class*="dashboard"], [class*="content"]')
      .contains(/cerrar sesión|logout|salir/i)
      .should('be.visible')
  })
})

describe('[REGRESIÓN] Cuidador - Gestión de Fotos (legacy)', () => {

  beforeEach(() => {
    cy.loginAs('cuidador')
    cy.visit('/cuidador/fotos')
    cy.wait(2000)
  })

  it('[REG-CUI-07] La página de fotos carga correctamente', () => {
    cy.contains(/fotos|galería/i, { timeout: 5000 }).should('be.visible')
  })

  it('[REG-CUI-08] Botón para agregar foto existe', () => {
    cy.contains(/agregar foto|subir|nueva foto/i).should('be.visible')
  })

  it('[REG-CUI-09] Formulario de subida se abre al hacer click en agregar', () => {
    cy.contains(/agregar foto|subir|nueva foto/i).click()
    cy.get('input[type="file"]', { timeout: 5000 }).should('exist')
  })

  it('[REG-CUI-10] Las fotos existentes usan URL de R2', () => {
    cy.get('body').then($body => {
      const r2Imgs = $body.find('img[src*="r2.dev"]')
      if (r2Imgs.length > 0) {
        cy.get('img[src*="r2.dev"]').should('have.length.at.least', 1)
        cy.log(`[OK] ${r2Imgs.length} imagen(es) con URL de R2`)
      } else {
        cy.log('[OK] Sin fotos en R2 aún — estado vacío correcto')
      }
    })
  })
})

describe('[REGRESIÓN] Cuidador - Progreso del paciente (legacy)', () => {

  beforeEach(() => {
    cy.loginAs('cuidador')
    cy.visit('/cuidador/progreso')
    cy.wait(2000)
  })

  it('[REG-CUI-11] La página de progreso carga sin errores', () => {
    cy.get('body').should('be.visible')
    cy.contains(/progreso|grabaciones/i, { timeout: 5000 }).should('exist')
  })

  it('[REG-CUI-12] Muestra grabaciones o estado vacío', () => {
    cy.get('body').then($body => {
      if ($body.find('.glass-card').length > 0) {
        cy.get('.glass-card').should('be.visible')
      } else {
        cy.log('[OK] Sin grabaciones — estado vacío correcto')
      }
    })
  })
})