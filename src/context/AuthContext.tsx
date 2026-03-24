"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: any | null;
  profile: any | null;
  loading: boolean;
  signOut: () => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchSession = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setUser(data.user);
          // For traditional login, profile is often the same as user data from session
          setProfile(data.user);
          // But we can also fetch the live profile for role updates
          await fetchProfile(data.user.id);
        }
      }
    } catch (err) {
      console.error('Session fetch failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (data) {
        setProfile(data);
        localStorage.setItem('user_role', data.role);
      }
    } catch (err) {
      console.error('Profile fetch exception:', err);
    }
  };

  const signOut = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      setProfile(null);
      localStorage.removeItem('user_role');
      window.location.replace('/login');
    } catch (error) {
       console.error('Sign Out Error:', error);
    }
  };

  const isAdmin = profile?.role?.toLowerCase() === 'admin';

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
