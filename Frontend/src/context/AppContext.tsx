import { ReactNode, useEffect, useState, useCallback, useRef, createContext, useContext } from 'react';
import { CognitoUserPool } from 'amazon-cognito-identity-js';
import { Note, User } from '../utils/types';
import { cognitoGlobalSignOut } from '../utils/cognitoAuth';
import * as notesApi from '../utils/notesApi';
interface AppContextType {
  user: User | null;
  isAuthenticated: boolean;
  notes: Note[];
  isLoading: boolean;
  login: (user: User) => Promise<void>;
  logout: () => Promise<void>;
  loadNotes: () => Promise<void>;
  addNote: (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateNote: (id: string, note: Partial<Note>) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
}
const AppContext = createContext<AppContextType | undefined>(undefined);

const userPool = new CognitoUserPool({
  UserPoolId: 'us-east-1_UhvfJZNSU',
  ClientId: '6vtp7h07uuo2trafec2v0r55a4',
});

export const AppProvider = ({ children }: {children: ReactNode;}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  // Validate Cognito session on mount before trusting localStorage
  useEffect(() => {
    const validateSession = async () => {
      const storedUser = localStorage.getItem('user');
      if (!storedUser) {
        setIsLoading(false);
        return;
      }

      const cognitoUser = userPool.getCurrentUser();
      if (!cognitoUser) {
        // No Cognito session — stale localStorage, clean up
        console.log('[AppContext] No Cognito session, clearing stale user data');
        localStorage.removeItem('user');
        setIsLoading(false);
        return;
      }

      // Verify the session is actually valid
      cognitoUser.getSession((err: any, session: any) => {
        if (err || !session || !session.isValid()) {
          console.log('[AppContext] Cognito session invalid, clearing user data');
          localStorage.removeItem('user');
          cognitoUser.signOut();
        } else {
          console.log('[AppContext] Cognito session valid, restoring user');
          const parsed = JSON.parse(storedUser);
          setUser(parsed);
          setIsAuthenticated(true);
        }
        setIsLoading(false);
      });
    };
    validateSession();
  }, []);

  const isFetchingNotes = useRef(false);

  const loadNotes = useCallback(async () => {
    if (isFetchingNotes.current) return;
    isFetchingNotes.current = true;
    try {
      const data = await notesApi.fetchNotes();
      setNotes(data);
    } finally {
      isFetchingNotes.current = false;
    }
  }, []);

  const login = async (userData: User) => {
    setUser(userData);
    setIsAuthenticated(true);
    localStorage.setItem('user', JSON.stringify(userData));
  };
  const logout = async () => {
    try {
      await cognitoGlobalSignOut();
    } catch (err) {
      console.error('Global sign out error:', err);
    }
    setUser(null);
    setIsAuthenticated(false);
    setNotes([]);
    localStorage.removeItem('user');
  };
  const addNote = async (
  noteData: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) =>
  {
    const newNote = await notesApi.createNote(noteData);
    setNotes((prev) => [newNote, ...prev]);
  };
  const updateNote = async (id: string, noteData: Partial<Note>) => {
    const updated = await notesApi.updateNote(id, noteData);
    setNotes((prev) =>
      prev.map((note) => (note.id === id ? updated : note))
    );
  };
  const deleteNote = async (id: string) => {
    await notesApi.deleteNote(id);
    setNotes((prev) => prev.filter((note) => note.id !== id));
  };
  return (
    <AppContext.Provider
      value={{
        user,
        isAuthenticated,
        notes,
        isLoading,
        login,
        logout,
        loadNotes,
        addNote,
        updateNote,
        deleteNote
      }}>
      
      {children}
    </AppContext.Provider>);

};
export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};