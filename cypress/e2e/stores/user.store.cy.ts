import type { Dog } from '@/types/interfaces'

describe('User Store', () => {
  const testDogs: Dog[] = [
    {
      id: 'dog1',
      img: 'test-image-1.jpg',
      name: 'Max',
      breed: 'Labrador',
      age: 3,
      zip_code: '12345',
      city: 'New York',
      state: 'NY'
    },
    {
      id: 'dog2',
      img: 'test-image-2.jpg',
      name: 'Bella',
      breed: 'Poodle',
      age: 2,
      zip_code: '12346',
      city: 'Buffalo',
      state: 'NY'
    }
  ]

  beforeEach(() => {
    cy.clearLocalStorage()
  })

  it('should handle login successfully', () => {
    cy.intercept('POST', '/auth/login', {
      statusCode: 200,
      body: {
        data: {
          token: 'test-token'
        }
      }
    }).as('loginRequest')

    cy.visit('/login')
    cy.get('#name').type('John Doe')
    cy.get('#email').type('john@example.com')
    cy.get('button[type="submit"]').click()

    cy.wait('@loginRequest')
    
    // Check localStorage since store is persisted
    cy.window().its('localStorage').then(localStorage => {
      const userStore = JSON.parse(localStorage['user'])
      expect(userStore.name).to.equal('John Doe')
      expect(userStore.email).to.equal('john@example.com')
      expect(userStore.favorites).to.deep.equal([])
      expect(userStore.match).to.be.null
    })

    cy.url().should('eq', Cypress.config().baseUrl + '/')
  })

  it('should handle favorites management', () => {
    // Login first
    cy.visit('/login')
    cy.get('#name').type('John Doe')
    cy.get('#email').type('john@example.com')
    cy.get('button[type="submit"]').click()

    // Check initial empty favorites
    cy.window().its('localStorage').then(localStorage => {
      const userStore = JSON.parse(localStorage['user'])
      expect(userStore.favorites).to.deep.equal([])
    })

    // Add favorites through localStorage
    cy.window().then((win) => {
      const store = JSON.parse(win.localStorage.getItem('user') || '{}')
      store.favorites = testDogs
      win.localStorage.setItem('user', JSON.stringify(store))
    })

    // Visit match page and verify favorites are loaded
    cy.visit('/match')
    cy.contains(testDogs[0].name).should('be.visible')
    cy.contains(testDogs[1].name).should('be.visible')
  })

  it('should handle empty favorites state', () => {
    // Login with empty favorites
    cy.visit('/login')
    cy.get('#name').type('John Doe')
    cy.get('#email').type('john@example.com')
    cy.get('button[type="submit"]').click()

    // Visit match page
    cy.visit('/match')

    // Verify empty state is shown
    cy.contains('You haven\'t added any favorites yet').should('be.visible')
    cy.get('[data-cy="browse-dogs-button"]')
      .should('be.visible')
      .and('contain', 'Browse Dogs')
  })

  it('should handle match generation', () => {
    // Login and set up favorites
    cy.visit('/login')
    cy.get('#name').type('John Doe')
    cy.get('#email').type('john@example.com')
    cy.get('button[type="submit"]').click()

    // Set up favorites through localStorage
    cy.window().then((win) => {
      const store = JSON.parse(win.localStorage.getItem('user') || '{}')
      store.favorites = testDogs
      win.localStorage.setItem('user', JSON.stringify(store))
    })

    // Mock match endpoint
    cy.intercept('POST', '**/dogs/match', {
      statusCode: 200,
      body: {
        match: 'dog1'
      }
    }).as('generateMatch')

    // Visit match page and generate match
    cy.visit('/match')
    cy.contains('button', /^Generate Match!$/i).click()
    cy.wait('@generateMatch')

    // Verify match is displayed
    cy.contains('Your Perfect Match: Max!').should('be.visible')
  })

  it('should validate form fields', () => {
    cy.visit('/login')
    cy.get('button[type="submit"]').click()

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
    cy.visit('/login')
    cy.get('#name').type('John Doe')
    cy.get('#email').type('invalid-email')
    cy.get('button[type="submit"]').click()

    cy.get('#email').then($el => {
      const input = $el[0] as HTMLInputElement
      expect(input.validity.valid).to.be.false
      expect(input.validity.typeMismatch).to.be.true
    })
  })

  it('should handle logout', () => {
    // Mock logout endpoint
    cy.intercept('POST', '**/auth/logout', {
      statusCode: 200
    }).as('logout')
  
    // Login first
    cy.visit('/login')
    cy.get('#name').type('John Doe')
    cy.get('#email').type('john@example.com')
    cy.get('button[type="submit"]').click()
  
    // Verify we're on the home page
    cy.url().should('eq', Cypress.config().baseUrl + '/')
    
    // Verify initial state has user data
    cy.window().its('localStorage').then(localStorage => {
      const userStore = JSON.parse(localStorage['user'])
      expect(userStore.name).to.equal('John Doe')
      expect(userStore.email).to.equal('john@example.com')
    })
  
    // Click logout button
    cy.contains('button', 'Logout').click()
    cy.wait('@logout')
  
    // Verify store is cleared - check for empty or cleared values
    cy.window().its('localStorage').then(localStorage => {
      const userStore = JSON.parse(localStorage['user'] || '{}')
      expect(userStore.name || '').to.be.empty
      expect(userStore.email || '').to.be.empty
      expect(userStore.favorites || []).to.deep.equal([])
      expect(userStore.match || null).to.be.null
    })
  
    // Verify redirect to login
    cy.url().should('include', '/login')
  })
})