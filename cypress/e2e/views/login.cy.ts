// cypress/e2e/auth/login.cy.ts
describe('Login', () => {
  beforeEach(() => {
    cy.visit('/login')
    cy.clearLocalStorage()
  })

  it('should successfully log in with valid credentials', () => {
    cy.intercept('POST', '/auth/login', {
      statusCode: 200,
      body: {
        data: {
          // Add whatever response data your API returns
        }
      }
    }).as('loginRequest')

    cy.get('#name').type('John Doe')
    cy.get('#email').type('john@example.com')
    cy.get('button[type="submit"]').click()

    cy.wait('@loginRequest').its('request.body').should('deep.equal', {
      name: 'John Doe',
      email: 'john@example.com'
    })

    cy.url().should('eq', Cypress.config().baseUrl + '/')
  })

  it('should validate required fields', () => {
    cy.get('button[type="submit"]').click()
    
    // Correct typing for input validation
    cy.get('#name').then($el => {
      const input = $el[0] as HTMLInputElement
      expect(input.validity.valid).to.be.false
    })

    cy.get('#email').then($el => {
      const input = $el[0] as HTMLInputElement
      expect(input.validity.valid).to.be.false
    })
  })

  it('should validate email format', () => {
    cy.get('#name').type('John Doe')
    cy.get('#email').type('invalid-email')
    cy.get('button[type="submit"]').click()

    cy.get('#email').then($el => {
      const input = $el[0] as HTMLInputElement
      expect(input.validity.valid).to.be.false
      expect(input.validity.typeMismatch).to.be.true
    })
  })
})