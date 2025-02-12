import type { Dog } from '@/types/interfaces'

describe('Match View', () => {
  const testFavorites: Dog[] = [
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
    // Clear storage and set up initial state
    cy.clearLocalStorage()
    indexedDB.deleteDatabase('firebaseLocalStorageDb')
    
    // Set up our initial state
    const initialState = {
      name: 'John Doe',
      email: 'john@example.com',
      favorites: testFavorites,
      match: null,
      isLoading: false
    }

    // Mock the initial state before visiting the page
    cy.visit('/match', {
      onBeforeLoad(win) {
        // Create a stub of localStorage.getItem for the user store
        cy.stub(win.localStorage, 'getItem')
          .callsFake((key) => {
            if (key === 'user') {
              return JSON.stringify(initialState)
            }
            return null
          })
      }
    })

    // Mock the match API endpoint
    cy.intercept('POST', '**/dogs/match', {
      statusCode: 200,
      body: {
        match: 'dog1'
      }
    }).as('generateMatch')
  })

  it('should show "Generate Match!" button when favorites exist', () => {
    cy.contains('button', /^Generate Match!$/i).should('be.visible')
  })

  it('should show loading state when generating match', () => {
    // Mock with longer delay to ensure we catch the loading state
    cy.intercept('POST', '**/dogs/match', (req) => {
      req.reply({
        delay: 2000, // Increased delay
        body: { match: 'dog1' }
      })
    }).as('delayedMatch')
  
    // Click and verify loading state
    cy.contains('button', /^Generate Match!$/i).click()
    
    // Wait for loading spinner with retry
    cy.get('[data-cy="loading-spinner"]', { timeout: 5000 }).should('be.visible')
    cy.contains('Finding your perfect match...').should('be.visible')
    
    // Wait for API response and verify spinner disappears
    cy.wait('@delayedMatch')
    cy.get('[data-cy="loading-spinner"]').should('not.exist')
  })
  
  it('should display match details correctly', () => {
    cy.contains('button', /^Generate Match!$/i).click()
    cy.wait('@generateMatch')
  
    // Add retries and longer timeout for header
    cy.get('[data-cy="match-header"]', { timeout: 10000 })
      .should('be.visible')
      .and('contain', 'Your Perfect Match: Max!')
  
    cy.get('[data-cy="match-details"]', { timeout: 10000 }).within(() => {
      cy.contains('Breed').parent().should('contain', 'Labrador')
      cy.contains('Age').parent().should('contain', '3 years')
      cy.contains('Location').parent()
        .should('contain', 'New York, NY, 12345')
    })
  })

  it('should display match details correctly', () => {
    cy.contains('button', /^Generate Match!$/i).click()
    cy.wait('@generateMatch')

    // Test match details display
    cy.get('[data-cy="match-header"]')
      .should('contain', 'Your Perfect Match: Max!')

    cy.get('[data-cy="match-details"]').within(() => {
      cy.contains('Breed').parent().should('contain', 'Labrador')
      cy.contains('Age').parent().should('contain', '3 years')
      cy.contains('Location').parent()
        .should('contain', 'New York, NY, 12345')
    })
  })

  it('should allow regenerating match', () => {
    // Setup alternating matches
    let matchCount = 0
    cy.intercept('POST', '**/dogs/match', (req) => {
      matchCount++
      req.reply({
        body: { match: matchCount === 1 ? 'dog1' : 'dog2' }
      })
    }).as('alternatingMatch')

    // First match
    cy.contains('button', /^Generate Match!$/i).click()
    cy.wait('@alternatingMatch')
    cy.contains('Your Perfect Match: Max!').should('be.visible')

    // Second match
    cy.contains('button', 'Try Another Match').click()
    cy.wait('@alternatingMatch')
    cy.contains('Your Perfect Match: Bella!').should('be.visible')
  })

  it('should allow returning to favorites list', () => {
    cy.contains('button', /^Generate Match!$/i).click()
    cy.wait('@generateMatch')

    cy.contains('button', 'Show All Favorites').click()
    
    cy.get('[data-cy="favorites-grid"]').should('be.visible')
    cy.contains('Max').should('be.visible')
    cy.contains('Bella').should('be.visible')
  })

  it('should show "Browse Dogs" button when no favorites exist', () => {
    // Visit with empty favorites state
    cy.visit('/match', {
      onBeforeLoad(win) {
        cy.stub(win.localStorage, 'getItem')
          .callsFake((key) => {
            if (key === 'user') {
              return JSON.stringify({
                name: 'John Doe',
                email: 'john@example.com',
                favorites: [],
                match: null,
                isLoading: false
              })
            }
            return null
          })
      }
    })

    cy.contains('You haven\'t added any favorites yet').should('be.visible')
    cy.get('[data-cy="browse-dogs-button"]')
      .should('be.visible')
      .and('contain', 'Browse Dogs')
  })
})