import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { account, ID } from './appwrite';
import { loadTheme } from './preferences';

export interface User {
  id: string;
  name: string;
  email: string;
  emailVerification: boolean;
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
  sendVerificationEmail: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  completeVerification: (userId: string, secret: string) => Promise<void>;
  completeResetPassword: (userId: string, secret: string, newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  updateProfile: async () => {},
  sendVerificationEmail: async () => {},
  resetPassword: async () => {},
  completeVerification: async () => {},
  completeResetPassword: async () => {}
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
        const mappedUser = mapAppwriteUser(currentAccount);
        setUser(mappedUser);
        localStorage.setItem('parlaxio_user_cache', JSON.stringify(mappedUser));
        
        // Sync preferences from Cloud to Local
        try {
          const prefs = await account.getPrefs();
          if (prefs.theme) {
            localStorage.setItem('parlaxio_theme', prefs.theme);
            loadTheme();
          }
          if (prefs.defaultServer !== undefined) {
            localStorage.setItem('parlaxio_default_server', prefs.defaultServer.toString());
          }
        } catch (prefError) {
          console.error("Failed to sync prefs", prefError);
        }
      } else {
        setUser(null);
        localStorage.removeItem('parlaxio_user_cache');
      }
    } catch (error: any) {
      console.log('Session check failed:', error.message);
      
      // Fallback to local cache if we get a network error
      if (error?.message?.toLowerCase().includes('failed to fetch') || error?.message?.includes('Network Error')) {
        const cachedUser = localStorage.getItem('parlaxio_user_cache');
        if (cachedUser) {
          console.log('Using cached user data as fallback');
          setUser(JSON.parse(cachedUser));
          setLoading(false);
          return;
        }
      }
      
      setUser(null);
      localStorage.removeItem('parlaxio_user_cache');
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
      emailVerification: appwriteUser.emailVerification === true,
      avatarInitials: initials,
      plan: 'VIP Ultra 4K', // Simulated plan
      createdAt: appwriteUser.$createdAt
    };
  };

  const login = async (email: string, password: string) => {
    try {
      try {
        await account.createEmailPasswordSession(email, password);
      } catch (sessionError: any) {
        if (sessionError?.message?.includes('prohibited when a session is active')) {
           console.log("Session already active, proceeding to get account...");
        } else {
           throw sessionError;
        }
      }
      
      const currentAccount = await account.get();
      const mappedUser = mapAppwriteUser(currentAccount);
      setUser(mappedUser);
      localStorage.setItem('parlaxio_user_cache', JSON.stringify(mappedUser));
      
    } catch (error: any) {
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

  const sendVerificationEmail = async () => {
    try {
      const appUrl = import.meta.env.VITE_BACKEND_URL || window.location.origin;
      const currentUrl = appUrl + '/?verify=true';
      await account.createVerification(currentUrl);
    } catch (error) {
      console.error('Send verification error:', error);
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const appUrl = import.meta.env.VITE_BACKEND_URL || window.location.origin;
      const currentUrl = appUrl + '/?reset=true';
      await account.createRecovery(email, currentUrl);
    } catch (error) {
      console.error('Reset password error:', error);
      throw error;
    }
  };

  const completeVerification = async (userId: string, secret: string) => {
    try {
      await account.updateVerification(userId, secret);
      await checkSession();
    } catch (e) {
      console.error('Verification completion error:', e);
      throw e;
    }
  };

  const completeResetPassword = async (userId: string, secret: string, newPassword: string) => {
    try {
      await account.updateRecovery(userId, secret, newPassword);
    } catch (e) {
      console.error('Reset completion error:', e);
      throw e;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateProfile, sendVerificationEmail, resetPassword, completeVerification, completeResetPassword }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
