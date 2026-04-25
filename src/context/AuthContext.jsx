import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, apiFetch } from '../lib/supabase';

const AuthContext = createContext({});

const fetchProfileFromSupabase = async (authUserId) => {
  const { data, error } = await supabase
    .from('usuarios')
    .select('id, auth_id, nome, email, role, restaurante_id, avatar_url, ativo')
    .eq('auth_id', authUserId)
    .eq('ativo', true)
    .single();

  if (error || !data) return null;

  return {
    ...data,
    restauranteId: data.restaurante_id,
    forcarTrocaSenha: data.avatar_url === 'FORCE_RESET',
  };
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timeout = setTimeout(() => setLoading(false), 6000);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'INITIAL_SESSION') {
          if (session?.user) {
            const profileData = await fetchProfileFromSupabase(session.user.id);
            if (profileData) {
              setUser(session.user);
              setProfile(profileData);
            } else {
              setUser(null);
              setProfile(null);
            }
          } else {
            setUser(null);
            setProfile(null);
          }
          clearTimeout(timeout);
          setLoading(false);
        }

        if (event === 'SIGNED_OUT') {
          setUser(null);
          setProfile(null);
        }

        if (event === 'TOKEN_REFRESHED' && session?.user) {
          const profileData = await fetchProfileFromSupabase(session.user.id);
          if (profileData) {
            setUser(session.user);
            setProfile(profileData);
          }
        }
      }
    );

    return () => {
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;

    const profileData = await fetchProfileFromSupabase(data.user.id);

    if (!profileData) {
      await supabase.auth.signOut();
      throw new Error('Usuário não encontrado ou inativo.');
    }

    setUser(data.user);
    setProfile(profileData);
    return { ...data, profileData };
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  const refreshProfile = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;
    const profileData = await fetchProfileFromSupabase(session.user.id);
    if (profileData) {
      setUser(session.user);
      setProfile(profileData);
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, login, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
