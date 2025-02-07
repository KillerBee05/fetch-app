export interface UserStore {
  name: string;
  email: string;
  isLoading: boolean;
  // favorites: Dog[];
  login: (name: string, email: string) => Promise<any>;
  logout: () => void
  addFavorite: (dog: Dog) => void;
  removeFavorite: (dogId: string) => void;
}

export interface DogStore {
  dogs: Dog[];
  breeds: string[];
  isLoading: boolean;
  totalDogs: number;
  currentPage: number;
  fetchBreeds: () => Promise<string[]>;
  searchDogs: (params?: {
    breeds?: string[];
    ageMin?: number;
    ageMax?: number;
    size?: number;
    from?: number;
    page?: number;
    sort?: string;
  }) => Promise<{
    dogs: Dog[];
    total: number;
    next?: string;
    prev?: string;
    currentPage: number;
  }>;
  setCurrentPage: (page: number) => void;
}

export interface Dog {
  id: string;
  breed: string;
  name: string;
  age: number;
  zip_code: string;
  img: string;
}