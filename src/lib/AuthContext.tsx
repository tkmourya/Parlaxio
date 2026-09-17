import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { account, ID } from './appwrite';

export interface User {
  id: string;
  name: string;
  email: string;
  avatarInitials: string;
  plan?: string;
  createdAt?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (name: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  updateProfile: async () => {}
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Check session on mount
  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const currentAccount = await account.get();
      if (currentAccount) {
        setUser(mapAppwriteUser(currentAccount));
      } else {
        setUser(null);
      }
    } catch (error) {
      console.log('No active session found.');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const mapAppwriteUser = (appwriteUser: any): User => {
    const displayName = appwriteUser.name || appwriteUser.email.split('@')[0];
    const initials = displayName
      .split(' ')
      .map((part: string) => part[0])
      .join('')
      .substring(0, 2)
      .toUpperCase() || 'P';

    return {
      id: appwriteUser.$id,
      name: displayName,
      email: appwriteUser.email,
      avatarInitials: initials,
      plan: 'VIP Ultra 4K', // Simulated plan
      createdAt: appwriteUser.$createdAt
    };
  };

  const login = async (email: string, password: string) => {
    try {
      await account.createEmailPasswordSession(email, password);
      await checkSession();
    } catch (error: any) {
      // If a session is already active, just sync the user state and return success
      if (error?.message?.includes('prohibited when a session is active') || error?.code === 401) {
         console.log("Session already active, syncing session state...");
         await checkSession();
         return;
      }
      console.error('Login error:', error);
      throw error;
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      await account.create(ID.unique(), email, password, name);
      await login(email, password); // auto login after register
    } catch (error: any) {
      console.error('Register error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await account.deleteSession('current');
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const updateProfile = async (name: string) => {
    try {
      await account.updateName(name);
      await checkSession();
    } catch (error) {
      console.error('Update Profile Error:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
