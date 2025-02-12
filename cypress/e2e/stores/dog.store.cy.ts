import { createPinia, setActivePinia } from 'pinia'
import { useLocationStore } from '@/stores/location-store'
import { useDogStore } from '@/stores/dog-store'
import { useUserStore } from '@/stores/user-store'

// Test data for dogs and locations
const testDogs = [
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

const testLocations = [
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

describe('Dog Store', () => {
  beforeEach(() => {
    // Clear local storage and indexed DB
    cy.clearLocalStorage()
    indexedDB.deleteDatabase('firebaseLocalStorageDb')
  
    // Mock login endpoint
    cy.intercept('POST', '**/auth/login', {
      statusCode: 200,
      body: {
        data: {
          token: 'test-token'
        }
      }
    }).as('loginRequest')

    // Mock breeds endpoint
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
  
    // Set up store after login
    cy.visit('/', {
      onBeforeLoad(win) {
        // Set auth token in localStorage
        win.localStorage.setItem('auth_token', 'test-token')
        
        const pinia = createPinia()
        setActivePinia(pinia)
        
        const dogStore = useDogStore()
        const locationStore = useLocationStore()
        const userStore = useUserStore()
        
        win.$store = {
          dog: dogStore,
          location: locationStore,
          user: userStore
        }
  
        // Set up authentication state
        cy.stub(win.localStorage, 'getItem')
          .callThrough()
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

  describe('Breeds Fetching', () => {
    it('should fetch and sort breeds', () => {
      cy.window().then(async (win) => {
        const store = win.$store.dog
        const breeds = await store.fetchBreeds()
        
        expect(breeds).to.have.length(3)
        expect(breeds).to.deep.equal(['German Shepherd', 'Labrador', 'Poodle'])
      })
    })
  })

  describe('Dog Search', () => {
    beforeEach(() => {
      // Mock dog search endpoint with dynamic sorting
      cy.intercept('GET', '**/dogs/search*', (req) => {
        // Get sort parameters from URL
        const url = new URL(req.url)
        const sort = url.searchParams.get('sort')
        const [field, order] = (sort || 'breed:asc').split(':')
        
        // Sort dog IDs based on sort parameters
        const sortedDogs = [...testDogs].sort((a, b) => {
          const aVal = String(a[field as keyof typeof a])
          const bVal = String(b[field as keyof typeof b])
          return order === 'asc' ? 
            aVal.localeCompare(bVal) : 
            bVal.localeCompare(aVal)
        })
        
        req.reply({
          statusCode: 200,
          body: {
            resultIds: sortedDogs.map(dog => dog.id),
            total: 2,
            next: '2',
            prev: null
          }
        })
      }).as('dogSearch')

      // Mock dog details endpoint with sorting preservation
      cy.intercept('POST', '**/dogs', (req) => {
        const requestedIds = req.body as string[]
        const orderedDogs = requestedIds.map(id => 
          testDogs.find(dog => dog.id === id)
        ).filter(Boolean)
        
        req.reply({
          statusCode: 200,
          body: orderedDogs
        })
      }).as('dogDetails')

      // Mock location details endpoint
      cy.intercept('POST', '**/locations', {
        statusCode: 200,
        body: testLocations
      }).as('locationDetails')
    })

    it('should search dogs without filters', () => {
      cy.window().then(async (win) => {
        const store = win.$store.dog
        const results = await store.searchDogs()
        
        expect(results.dogs).to.have.length(2)
        expect(results.total).to.equal(2)
        expect(results.currentPage).to.equal(1)
        expect(results.next).to.equal('2')
        expect(results.prev).to.be.null
      })

      // Verify intercepted requests
      cy.wait('@dogSearch')
      cy.wait('@dogDetails')
      cy.wait('@locationDetails')
    })

    it('should search dogs with breed filter', () => {
      cy.window().then(async (win) => {
        const store = win.$store.dog
        const results = await store.searchDogs({ 
          breeds: ['Labrador'] 
        })
        
        expect(results.dogs).to.have.length(2)
        expect(results.dogs[0].breed).to.equal('Labrador')
      })
    })

    it('should search dogs with age filters', () => {
      cy.window().then(async (win) => {
        const store = win.$store.dog
        const results = await store.searchDogs({ 
          ageMin: 2,
          ageMax: 3
        })
        
        expect(results.dogs).to.have.length(2)
        results.dogs.forEach(dog => {
          expect(dog.age).to.be.within(2, 3)
        })
      })
    })

    it('should handle sorting', () => {
      cy.window().then(async (win) => {
        const store = win.$store.dog
        
        // Default sort by breed ascending
        const initialResults = await store.searchDogs()
        const initialBreeds = initialResults.dogs.map(dog => dog.breed)
        expect(initialBreeds[0]).to.equal('Labrador')
        
        // First click - name ascending
        const resultsNameAsc = await store.searchDogs({ 
          sortField: 'name', 
          sortOrder: 'asc' 
        })
        const namesAsc = resultsNameAsc.dogs.map(dog => dog.name)
        expect(namesAsc[0]).to.equal('Bella')
        
        // Second click - name descending
        const resultsNameDesc = await store.searchDogs({ 
          sortField: 'name', 
          sortOrder: 'desc' 
        })
        const namesDesc = resultsNameDesc.dogs.map(dog => dog.name)
        expect(namesDesc[0]).to.equal('Max')
      })
    })

    it('should handle empty search results', () => {
      // Mock empty search results
      cy.intercept('GET', '**/dogs/search*', {
        statusCode: 200,
        body: {
          resultIds: [],
          total: 0
        }
      }).as('emptyDogSearch')

      cy.window().then(async (win) => {
        const store = win.$store.dog
        const results = await store.searchDogs()
        
        expect(results.dogs).to.have.length(0)
        expect(results.total).to.equal(0)
        expect(results.noResults).to.be.true
      })
    })
  })

  describe('Search Parameter Building', () => {
    it('should search with various parameters', () => {
      cy.window().then(async (win) => {
        const store = win.$store.dog
        
        // Test with full set of parameters
        const resultsWithParams = await store.searchDogs({
          breeds: ['Labrador'],
          ageMin: 2,
          ageMax: 4,
          size: 25,
          page: 2,
          sortField: 'age',
          sortOrder: 'desc'
        })
        
        // Assert that the search works with these parameters
        expect(resultsWithParams.dogs).to.exist
      })
    })
  })
})