export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  color?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface AppState {
  user: User | null;
  isAuthenticated: boolean;
  notes: Note[];
  isLoading: boolean;
}