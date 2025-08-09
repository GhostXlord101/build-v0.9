import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const UserContext = createContext();

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) throw new Error('useUser must be used within a UserProvider');
  return context;
};

export const UserProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch user profile by user ID from crm.users
  const fetchUserProfile = useCallback(async (user) => {
    if (!user) return null;

    try {
      const { data, error: profileError } = await supabase
        .from('crm.users')
        .select('id, name, email, role, org_id')
        .eq('id', user.id)
        .limit(1)
        .single();

      if (profileError) {
        setError(profileError.message);
        return null;
      }

      return {
        id: data.id,
        name: data.name,
        email: data.email,
        role: data.role,
        orgId: data.org_id,
      };
    } catch (err) {
      setError(err.message || 'Unknown error');
      return null;
    }
  }, []);

  // Initialize user session and listen to auth state changes
  useEffect(() => {
    let isMounted = true;

    const initUser = async () => {
      setLoading(true);
      setError(null);

      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) throw sessionError;

        if (session?.user) {
          const profile = await fetchUserProfile(session.user);
          if (isMounted) setCurrentUser(profile);
        } else {
          if (isMounted) setCurrentUser(null);
        }
      } catch (err) {
        if (isMounted) setError(err.message || 'Failed to get session');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    initUser();

    // Set up auth state listener with proper unsubscribe handling
    const { data: { subscription } = {} } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;
        
        // Don't show loading for sign out events
        if (event !== 'SIGNED_OUT') {
          setLoading(true);
        }
        setError(null);

        try {
          if (session?.user) {
            const profile = await fetchUserProfile(session.user);
            if (isMounted) setCurrentUser(profile);
          } else {
            if (isMounted) setCurrentUser(null);
          }
        } catch (err) {
          if (isMounted) setError(err.message || 'Auth state change error');
        } finally {
          if (isMounted) setLoading(false);
        }
      }
    );

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, [fetchUserProfile]);

  // Sign in method with email and password (calls Supabase Auth)
  const signIn = useCallback(
    async (email, password) => {
      setLoading(true);
      setError(null);

      try {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) {
          setError(signInError.message);
          return null;
        }

        if (data?.user) {
          const profile = await fetchUserProfile(data.user);
          setCurrentUser(profile);
          return data.user;
        }

        return null;
      } catch (err) {
        setError(err.message || 'Sign-in failed');
        return null;
      } finally {
        setLoading(false);
      }
    },
    [fetchUserProfile]
  );

  // Sign up method: creates user and inserts profile record in crm.users
  const signUp = useCallback(
    async (email, password, name) => {
      setLoading(true);
      setError(null);

      try {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });

        if (signUpError) {
          setError(signUpError.message);
          return null;
        }

        // If sign-up succeeds, create profile in crm.users
        if (data?.user) {
          const { error: insertError } = await supabase.from('crm.users').insert({
            id: data.user.id,
            email,
            name,
            role: 'user',    // default role, adjust as needed
            org_id: 'default_org', // default org, adjust or make dynamic
          });
          
          if (insertError) {
            setError(insertError.message);
            return null;
          }

          return data.user;
        }

        return null;
      } catch (err) {
        setError(err.message || 'Sign-up failed');
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Sign out currently logged in user
  const signOut = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { error: signOutError } = await supabase.auth.signOut();

      if (signOutError) {
        setError(signOutError.message);
        return false;
      }

      setCurrentUser(null);
      return true;
    } catch (err) {
      setError(err.message || 'Sign-out failed');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <UserContext.Provider
      value={{
        currentUser,
        loading,
        error,
        signIn,
        signUp,
        signOut,
        clearError: () => setError(null),
      }}
    >
      {children}
    </UserContext.Provider>
  );
};
