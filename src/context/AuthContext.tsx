import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, AvatarConfig, DEFAULT_AVATAR_CONFIG } from '../types/auth';

interface AuthContextType {
  currentUser: UserProfile | null;
  allUsers: UserProfile[];
  isCustomizingAvatar: boolean;
  setIsCustomizingAvatar: (val: boolean) => void;
  login: (username: string, password?: string) => { success: boolean; error?: string };
  signup: (username: string, password?: string, displayName?: string) => { success: boolean; error?: string };
  guestLogin: () => void;
  logout: () => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
  updateAvatar: (avatarConfig: AvatarConfig, newDisplayName?: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USERS_STORAGE_KEY = 'wb_users_roster';
const ACTIVE_USER_ID_KEY = 'wb_active_user_id';

function loadStoredUsers(): UserProfile[] {
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Error loading users:', err);
  }

  // Pre-seed a default friendly starter explorer profile for quick testing
  const defaultUser: UserProfile = {
    id: 'explorer-ember',
    username: 'explorer',
    displayName: 'Lexi Explorer',
    passwordHash: '1234',
    avatarConfig: { ...DEFAULT_AVATAR_CONFIG },
    avatarEmoji: '🦊',
    lexiCoins: 450,
    fusionTokens: 14,
    streak: 5,
    level: 8,
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
    onboardingComplete: true,
  };

  return [defaultUser];
}

function getInitialUser(users: UserProfile[]): UserProfile | null {
  try {
    const activeId = localStorage.getItem(ACTIVE_USER_ID_KEY);
    if (activeId) {
      const found = users.find((u) => u.id === activeId || u.username.toLowerCase() === activeId.toLowerCase());
      if (found) return found;
    }
  } catch {}
  return null;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [allUsers, setAllUsers] = useState<UserProfile[]>(loadStoredUsers);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => getInitialUser(allUsers));
  const [isCustomizingAvatar, setIsCustomizingAvatar] = useState<boolean>(false);

  // Sync users list to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(allUsers));
    } catch {}
  }, [allUsers]);

  // Sync active user ID & profile to localStorage
  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem(ACTIVE_USER_ID_KEY, currentUser.id);
        localStorage.setItem(
          'wb_player_profile',
          JSON.stringify({
            username: currentUser.displayName,
            avatar: currentUser.avatarEmoji,
            lexiCoins: currentUser.lexiCoins,
            fusionTokens: currentUser.fusionTokens,
            streak: currentUser.streak,
          })
        );
      } else {
        localStorage.removeItem(ACTIVE_USER_ID_KEY);
      }
    } catch {}
  }, [currentUser]);

  const login = (username: string, password = ''): { success: boolean; error?: string } => {
    const cleanUser = username.trim().toLowerCase();
    if (!cleanUser) {
      return { success: false, error: 'Please enter your Explorer Name.' };
    }

    const match = allUsers.find(
      (u) => u.username.toLowerCase() === cleanUser || u.displayName.toLowerCase() === cleanUser
    );

    if (!match) {
      return {
        success: false,
        error: `Explorer "${username}" not found. Click "Sign Up" to create this explorer!`,
      };
    }

    // Elementary friendly: check password if set
    if (match.passwordHash && password && match.passwordHash !== password) {
      return { success: false, error: 'Secret Word does not match. Try again!' };
    }

    const updatedUser: UserProfile = {
      ...match,
      lastLoginAt: new Date().toISOString(),
    };

    setCurrentUser(updatedUser);
    setAllUsers((prev) => prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)));
    return { success: true };
  };

  const signup = (
    username: string,
    password = '',
    displayName?: string
  ): { success: boolean; error?: string } => {
    const cleanUser = username.trim();
    if (!cleanUser) {
      return { success: false, error: 'Please choose an Explorer Name.' };
    }
    if (cleanUser.length < 2) {
      return { success: false, error: 'Explorer Name must be at least 2 characters.' };
    }

    const existing = allUsers.find((u) => u.username.toLowerCase() === cleanUser.toLowerCase());
    if (existing) {
      return { success: false, error: 'This Explorer Name already exists! Please log in or pick another.' };
    }

    const newId = `user-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const finalDisplayName = displayName?.trim() || cleanUser;

    const newUser: UserProfile = {
      id: newId,
      username: cleanUser,
      displayName: finalDisplayName,
      passwordHash: password,
      avatarConfig: {
        ...DEFAULT_AVATAR_CONFIG,
        title: 'Word Wizard',
      },
      avatarEmoji: DEFAULT_AVATAR_CONFIG.emoji,
      lexiCoins: 450,
      fusionTokens: 14,
      streak: 1,
      level: 1,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      onboardingComplete: false,
    };

    setAllUsers((prev) => [...prev, newUser]);
    setCurrentUser(newUser);
    // Direct immediately to character customizer
    setIsCustomizingAvatar(true);

    return { success: true };
  };

  const guestLogin = () => {
    const guestId = `guest-${Date.now()}`;
    const guestUser: UserProfile = {
      id: guestId,
      username: `Guest-${Math.floor(100 + Math.random() * 900)}`,
      displayName: 'Guest Explorer',
      passwordHash: '',
      avatarConfig: { ...DEFAULT_AVATAR_CONFIG },
      avatarEmoji: '🦊',
      lexiCoins: 300,
      fusionTokens: 10,
      streak: 1,
      level: 1,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      onboardingComplete: false,
    };

    setAllUsers((prev) => [...prev, guestUser]);
    setCurrentUser(guestUser);
    setIsCustomizingAvatar(true);
  };

  const logout = () => {
    setCurrentUser(null);
    setIsCustomizingAvatar(false);
  };

  const updateProfile = (updates: Partial<UserProfile>) => {
    if (!currentUser) return;
    const updated: UserProfile = {
      ...currentUser,
      ...updates,
    };
    setCurrentUser(updated);
    setAllUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
  };

  const updateAvatar = (avatarConfig: AvatarConfig, newDisplayName?: string) => {
    if (!currentUser) return;
    const updated: UserProfile = {
      ...currentUser,
      avatarConfig,
      avatarEmoji: avatarConfig.emoji,
      displayName: newDisplayName?.trim() || currentUser.displayName,
    };
    setCurrentUser(updated);
    setAllUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
    setIsCustomizingAvatar(false);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        allUsers,
        isCustomizingAvatar,
        setIsCustomizingAvatar,
        login,
        signup,
        guestLogin,
        logout,
        updateProfile,
        updateAvatar,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
