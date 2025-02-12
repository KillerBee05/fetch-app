declare global {
  namespace Cypress {
    interface Chainable {
      login(name: string, email: string): Chainable<void>
    }
  }
}

Cypress.Commands.add('login', (name: string, email: string) => {
  cy.visit('/login')
  cy.get('#name').type(name)
  cy.get('#email').type(email)
  cy.get('button[type="submit"]').click()
})

export {}
