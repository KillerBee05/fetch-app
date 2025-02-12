import type { Dog, Location } from '@/types/interfaces'
import { createPinia, setActivePinia } from 'pinia'
import { useLocationStore } from '@/stores/location-store'
import { useUserStore } from '@/stores/user-store'
import { useDogStore } from '@/stores/dog-store'

// Move test data outside all describe blocks
const testDogs: Dog[] = [
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

const testLocations: Location[] = [
  {
    zip_code: '12345',
    latitude: 40.7128,
    longitude: -74.0060,
    city: 'New York',
    state: 'NY',
    county: 'New York County'
  },
  {
    zip_code: '12346',
    latitude: 42.8864,
    longitude: -78.8784,
    city: 'Buffalo',
    state: 'NY',
    county: 'Erie County'
  }
]

describe('Location Store', () => {
  beforeEach(() => {
    cy.clearLocalStorage()
    indexedDB.deleteDatabase('firebaseLocalStorageDb')
  
    // Mock both login and breeds endpoints
    cy.intercept('POST', '**/auth/login', {
      statusCode: 200,
      body: {
        data: {
          token: 'test-token'
        }
      }
    }).as('loginRequest')

    // Mock the breeds endpoint that's causing the 401
    cy.intercept('GET', '**/dogs/breeds', {
      statusCode: 200,
      body: ['Labrador', 'Poodle', 'German Shepherd']
    }).as('breedsRequest')
  
    // Visit login page and authenticate
    cy.visit('/login')
    cy.get('#name').type('John Doe')
    cy.get('#email').type('john@example.com')
    cy.get('button[type="submit"]').click()
    cy.wait('@loginRequest')
  
    // After login succeeds, visit home page and set up store
    cy.visit('/', {
      onBeforeLoad(win) {
        // Set auth token in localStorage
        win.localStorage.setItem('auth_token', 'test-token')
        
        const pinia = createPinia()
        setActivePinia(pinia)
        
        const locationStore = useLocationStore()
        const userStore = useUserStore()
        const dogStore = useDogStore()
        
        win.$store = {
          location: locationStore,
          user: userStore,
          dog: dogStore // Add this line
        }
  
        // Set up authentication state
        cy.stub(win.localStorage, 'getItem')
          .callThrough() // Allow other localStorage calls to work normally
          .withArgs('user')
          .returns(JSON.stringify({
            name: 'John Doe',
            email: 'john@example.com',
            favorites: [],
            match: null
          }))
      }
    })
  })

  describe('State Selection', () => {
    it('should handle state selection', () => {
      // Mock location search for NY
      cy.intercept('POST', '**/locations/search', {
        statusCode: 200,
        body: {
          results: testLocations,
          total: testLocations.length
        }
      }).as('locationSearch')
  
      cy.window().then(async (win) => {
        const store = win.$store.location
        expect(store).to.exist
        
        // Explicitly call searchLocations method
        await store.searchLocations({ state: 'NY' })
        
        // Or if you want to simulate UI interaction more closely:
        store.selectedState = 'NY'
        await store.searchLocations({ state: 'NY' })
      })
  
      // Wait for both the breeds and location search requests
      cy.wait(['@breedsRequest', '@locationSearch'])
  
      // Verify cities are cached
      cy.window().then((win) => {
        const store = win.$store.location
        const cities = store.getAvailableCitiesForState
        expect(cities).to.have.length(2)
        expect(cities).to.include('New York')
        expect(cities).to.include('Buffalo')
      })
    })
  })

  describe('Location Search', () => {
    it('should handle location search by state', () => {
      cy.intercept('POST', '**/locations/search', {
        statusCode: 200,
        body: {
          results: testLocations,
          total: testLocations.length
        }
      }).as('locationSearch')

      cy.window().then(async (win) => {
        const store = win.$store.location
        expect(store).to.exist
        const result = await store.searchLocations({ state: 'NY' })
        expect(result.zipCodes).to.have.length(2)
        expect(result.cities).to.have.length(2)
        expect(result.zipCodes).to.include('12345')
        expect(result.cities).to.include('New York')
      })

      cy.wait('@locationSearch')
    })

    it('should handle location search by state and city', () => {
      cy.intercept('POST', '**/locations/search', {
        statusCode: 200,
        body: {
          results: [testLocations[0]],
          total: 1
        }
      }).as('locationSearch')

      cy.window().then(async (win) => {
        const store = win.$store.location
        const result = await store.searchLocations({ 
          state: 'NY',
          city: 'New York'
        })
        expect(result.zipCodes).to.have.length(1)
        expect(result.cities).to.have.length(1)
        expect(result.zipCodes[0]).to.equal('12345')
        expect(result.cities[0]).to.equal('New York')
      })

      cy.wait('@locationSearch')
    })

    it('should return empty results for invalid location search', () => {
      cy.intercept('POST', '**/locations/search', {
        statusCode: 200,
        body: {
          results: [],
          total: 0
        }
      }).as('emptySearch')

      cy.window().then(async (win) => {
        const store = win.$store.location
        const result = await store.searchLocations({ 
          state: 'XX',
          city: 'NonExistent'
        })
        expect(result.zipCodes).to.have.length(0)
        expect(result.cities).to.have.length(0)
      })

      cy.wait('@emptySearch')
    })
  })

  describe('Dog Location Enrichment', () => {
    it('should enrich dogs with location data', () => {
      cy.intercept('POST', '**/locations', {
        statusCode: 200,
        body: testLocations
      }).as('locationBatch')

      cy.window().then(async (win) => {
        const store = win.$store.location
        const enrichedDogs = await store.enrichDogsWithLocations(testDogs)
        
        expect(enrichedDogs[0].city).to.equal('New York')
        expect(enrichedDogs[0].state).to.equal('NY')
        expect(enrichedDogs[1].city).to.equal('Buffalo')
        expect(enrichedDogs[1].state).to.equal('NY')
      })

      cy.wait('@locationBatch')
    })

    it('should handle location enrichment errors gracefully', () => {
      cy.intercept('POST', '**/locations', {
        statusCode: 500,
        body: 'Server Error'
      }).as('locationError')

      cy.window().then(async (win) => {
        const store = win.$store.location
        const enrichedDogs = await store.enrichDogsWithLocations(testDogs)
        
        enrichedDogs.forEach(dog => {
          expect(dog.city).to.equal('Unknown')
          expect(dog.state).to.equal('Unknown')
        })
      })

      cy.wait('@locationError')
    })

    it('should handle location caching', () => {
      // First request - should hit API
      cy.intercept('POST', '**/locations/search', {
        statusCode: 200,
        body: {
          results: testLocations,
          total: testLocations.length
        }
      }).as('initialSearch')

      cy.window().then(async (win) => {
        const store = win.$store.location
        
        // First search
        await store.searchLocations({ state: 'NY' })
        cy.wait('@initialSearch')

        // Second search - should use cache
        const cachedResult = await store.searchLocations({ state: 'NY' })
        expect(cachedResult.zipCodes).to.have.length(2)
        expect(cachedResult.cities).to.have.length(2)
      })

      // Verify only one API call was made
      cy.get('@initialSearch.all').should('have.length', 1)
    })
  })
})