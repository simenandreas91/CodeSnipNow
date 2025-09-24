import { useState, useEffect } from 'react';
import { supabase, hasValidSupabaseCredentials } from '../lib/supabase';
import type { User } from '../types/snippet';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hasValidSupabaseCredentials || !supabase) {
      setLoading(false);
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          username: session.user.user_metadata?.username || session.user.email?.split('@')[0] || 'user',
          email: session.user.email
        });
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUser({
            id: session.user.id,
            username: session.user.user_metadata?.username || session.user.email?.split('@')[0] || 'user',
            email: session.user.email
          });
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (username: string, password: string) => {
    console.log('Attempting to sign in user:', username);
    setLoading(true);
    try {
      if (!hasValidSupabaseCredentials || !supabase) {
        throw new Error('Authentication not available');
      }

      // Use email format for sign in (username@domain.com or treat username as email)
      const email = username.includes('@') ? username : `${username}@example.com`;
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw new Error(error.message);
      }

      console.log('Sign in successful for:', username);
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const signUp = async (username: string, password: string, email?: string) => {
    console.log('Attempting to sign up user:', username);
    setLoading(true);
    try {
      if (!hasValidSupabaseCredentials || !supabase) {
        throw new Error('Authentication not available');
      }

      // Use provided email or create one from username
      const userEmail = email || `${username}@example.com`;
      
      const { data, error } = await supabase.auth.signUp({
        email: userEmail,
        password,
        options: {
          data: {
            username: username,
          }
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      console.log('Sign up successful for:', username);
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const signOut = async () => {
    console.log('Signing out user:', user?.username);
    setLoading(true);
    try {
      if (!hasValidSupabaseCredentials || !supabase) {
        throw new Error('Authentication not available');
      }

      const { error } = await supabase.auth.signOut();
      if (error) {
        throw new Error(error.message);
      }

      console.log('Sign out successful');
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  return {
    user,
    loading,
    signIn,
    signUp,
    signOut,
  };
}