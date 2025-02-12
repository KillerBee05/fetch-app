describe('Home View', () => {
  beforeEach(() => {
    cy.clearLocalStorage()
    
    // Mock login
    cy.intercept('POST', '/auth/login', {
      statusCode: 200,
      headers: {
        'Set-Cookie': 'auth=test-auth-cookie; Path=/; HttpOnly'
      }
    }).as('login')

    // Login first
    cy.visit('/login')
    cy.get('#name').type('John Doe')
    cy.get('#email').type('john@example.com')
    cy.get('button[type="submit"]').click()
    cy.wait('@login')

    // Mock locations search
    cy.intercept('POST', '/locations/search', {
      statusCode: 200,
      body: {
        results: [
          { zip_code: '12345', city: 'New York', state: 'NY' },
          { zip_code: '12346', city: 'Buffalo', state: 'NY' }
        ],
        total: 2
      }
    }).as('searchLocations')

    // Mock locations details
    cy.intercept('POST', '/locations', {
      statusCode: 200,
      body: [
        { zip_code: '12345', city: 'New York', state: 'NY' },
        { zip_code: '12346', city: 'Buffalo', state: 'NY' }
      ]
    }).as('fetchLocations')

    // Mock breeds
    cy.intercept('GET', '/dogs/breeds', {
      statusCode: 200,
      body: ['Labrador', 'Poodle', 'Golden Retriever']
    }).as('fetchBreeds')

    // Mock dogs search
    cy.intercept('GET', '/dogs/search*', {
      statusCode: 200,
      body: {
        resultIds: ['dog1', 'dog2'],
        total: 2
      }
    }).as('searchDogs')

    // Mock dogs details
    cy.intercept('POST', '/dogs', {
      statusCode: 200,
      body: [
        {
          id: 'dog1',
          img: 'test-image-1.jpg',
          name: 'Max',
          breed: 'Labrador',
          age: 3,
          zip_code: '12345'
        },
        {
          id: 'dog2',
          img: 'test-image-2.jpg',
          name: 'Bella',
          breed: 'Poodle',
          age: 2,
          zip_code: '12346'
        }
      ]
    }).as('fetchDogDetails')

    cy.visit('/')
  })

  it('should display the basic page structure', () => {
    cy.contains('Dog Search').should('be.visible')
    cy.contains('Additional Filters').should('be.visible')
    cy.contains('Sort by:').should('be.visible')
  })

  it('should initialize with breed dropdown', () => {
    cy.wait('@fetchBreeds')
    cy.get('[aria-label="Select Breed"]').should('exist').should('be.visible')
  })

  it('should handle sorting', () => {
    cy.get('button').contains('Name').click()
    cy.contains('Name ↑').should('be.visible')
    cy.get('button').contains('Name ↑').click()
    cy.contains('Name ↓').should('be.visible')
  })

  it('should handle state and city selection', () => {
    cy.wait('@fetchBreeds')
    cy.wait('@searchDogs')
    cy.wait('@fetchDogDetails')
    cy.wait('@fetchLocations')
    cy.get('.p-progressspinner').should('not.exist')
    
    // Now look for dropdown elements
    cy.get('.p-inputwrapper')
      .first()
      .find('.p-select-label')
      .should('contain', 'Select State (Optional)')
    
    // Verify city dropdown is disabled initially
    cy.get('.p-inputwrapper')
      .eq(1)
      .should('have.class', 'p-disabled')
      .find('.p-select-label')
      .should('contain', 'Select City (Optional)')
  })

  it('should handle age filters', () => {
    cy.get('input[placeholder="Min Age"]').should('exist')
    cy.get('input[placeholder="Max Age"]').should('exist')
  })

  it('should show loading state while fetching dogs', () => {
    // Mock a slow search
    cy.intercept('GET', '/dogs/search*', (req) => {
      // Simulate a delay to trigger loading state
      req.on('response', (res) => {
        res.setDelay(1000)
      })
      req.reply({
        statusCode: 200,
        body: {
          resultIds: ['dog1', 'dog2'],
          total: 2
        }
      })
    }).as('slowSearch')
    
    // Trigger a slow search
    cy.get('button').contains('Apply Filters').click()
    
    // Check for loading spinner and text
    cy.get('.p-progressspinner').should('be.visible')
    cy.contains('Loading dogs...').should('be.visible')
    
    // Wait for the slow search to complete
    cy.wait('@slowSearch')
    
    // Verify loading state disappears
    cy.get('.p-progressspinner').should('not.exist')
    cy.contains('Loading dogs...').should('not.exist')
  })

  it('should display no results message when appropriate', () => {
    cy.intercept('GET', '/dogs/search*', {
      statusCode: 200,
      body: { resultIds: [], total: 0 }
    }).as('emptySearch')
    
    cy.get('button').contains('Apply Filters').click()
    cy.wait('@emptySearch')
    cy.contains('No dogs found matching your criteria').should('be.visible')
  })

  it('should handle favorites functionality', () => {
    cy.wait('@fetchBreeds')
    cy.wait('@searchDogs')
    cy.wait('@fetchDogDetails')
    cy.wait('@fetchLocations')
    cy.get('.p-progressspinner').should('not.exist')
    
    // Using the class from your component template
    cy.get('.p-button-help.p-button-rounded')
      .first()
      .should('contain', 'Add to Favorite')
      .click()
    
    cy.get('.p-button-help.p-button-rounded')
      .first()
      .should('contain', 'Remove Favorite')
  })
})