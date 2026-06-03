import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AuthContext = createContext(null);

const STORAGE_KEY = '@sentinel_auth';

export function AuthProvider({ children }) {
  const [user, setUser]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [isGuest, setIsGuest]   = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(raw => {
      if (raw) {
        try {
          const stored = JSON.parse(raw);
          setUser(stored.user);
          setIsGuest(stored.isGuest ?? false);
        } catch (_) {}
      }
      setLoading(false);
    });
  }, []);

  async function login(email, password) {
    // Stub — replace with real API call
    await new Promise(r => setTimeout(r, 800));
    if (!email || !password) throw new Error('Email and password required');
    const newUser = {
      id:               `uid_${Date.now()}`,
      email,
      displayName:      email.split('@')[0],
      subscriptionTier: 'FREE',
      isEmailVerified:  false,
      createdAt:        Date.now(),
    };
    setUser(newUser);
    setIsGuest(false);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ user: newUser, isGuest: false }));
    return newUser;
  }

  async function register(email, password, displayName) {
    await new Promise(r => setTimeout(r, 1000));
    if (!email || !password) throw new Error('Email and password required');
    if (password.length < 8)  throw new Error('Password must be at least 8 characters');
    const newUser = {
      id:               `uid_${Date.now()}`,
      email,
      displayName:      displayName || email.split('@')[0],
      subscriptionTier: 'FREE',
      isEmailVerified:  false,
      createdAt:        Date.now(),
    };
    setUser(newUser);
    setIsGuest(false);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ user: newUser, isGuest: false }));
    return newUser;
  }

  async function continueAsGuest() {
    setUser(null);
    setIsGuest(true);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ user: null, isGuest: true }));
  }

  async function logout() {
    setUser(null);
    setIsGuest(false);
    await AsyncStorage.removeItem(STORAGE_KEY);
  }

  async function forgotPassword(email) {
    await new Promise(r => setTimeout(r, 600));
    if (!email) throw new Error('Email required');
    // Stub — real implementation sends a reset email
  }

  const isAuthenticated = !!user || isGuest;

  return (
    <AuthContext.Provider value={{
      user, loading, isGuest, isAuthenticated,
      login, register, continueAsGuest, logout, forgotPassword,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
