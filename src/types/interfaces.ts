export interface UserStore {
  name: string,
  email: string,
  isLoading: boolean,
  // favorites: Dog[],
  login: (name: string, email: string) => Promise<any>,
  logout: () => void
  addFavorite: (dog: Dog) => void;
  removeFavorite: (dogId: string) => void;
}

export interface Dog {
  id: string,
  breed: string,
  name: string,
  age: number
}