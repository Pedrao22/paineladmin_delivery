import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, apiFetch } from '../lib/supabase';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const getFullProfile = async (authUser) => {
    // Tenta via backend primeiro
    try {
      const result = await apiFetch('/auth/me');
      if (result.success) {
        setUser(authUser);
        setProfile(result.data);
        return result.data;
      }
    } catch (backendError) {
      console.warn('Backend indisponível, usando Supabase direto:', backendError.message);
    }

    // Fallback: lê perfil direto do Supabase (não depende do backend)
    try {
      const { data: usuario, error } = await supabase
        .from('usuarios')
        .select('id, auth_id, nome, email, role, restaurante_id, avatar_url, ativo, ultimo_login')
        .eq('auth_id', authUser.id)
        .eq('ativo', true)
        .single();

      if (!error && usuario) {
        const profileData = {
          ...usuario,
          restauranteId: usuario.restaurante_id,
          forcarTrocaSenha: usuario.avatar_url === 'FORCE_RESET',
        };
        setUser(authUser);
        setProfile(profileData);
        return profileData;
      }
    } catch (supabaseError) {
      console.warn('Falha no fallback Supabase:', supabaseError.message);
    }

    setUser(null);
    setProfile(null);
    await supabase.auth.signOut();
    return null;
  };

  useEffect(() => {
    const timeout = setTimeout(() => setLoading(false), 5000);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (
          session &&
          (event === 'INITIAL_SESSION' ||
            event === 'SIGNED_IN' ||
            event === 'TOKEN_REFRESHED')
        ) {
          await getFullProfile(session.user);
        } else if (
          event === 'SIGNED_OUT' ||
          (event === 'INITIAL_SESSION' && !session)
        ) {
          setUser(null);
          setProfile(null);
        }

        if (event === 'INITIAL_SESSION') {
          clearTimeout(timeout);
          setLoading(false);
        }
      }
    );

    return () => {
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  const refreshProfile = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) await getFullProfile(session.user);
  };

  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    const profileData = await getFullProfile(data.user);
    return { ...data, profileData };
  };

  const logout = async () => {
    await supabase.auth.signOut();
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
