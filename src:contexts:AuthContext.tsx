import React, { createContext, useEffect, useState, ReactNode } from 'react'
import { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabaseClient'

interface AuthContextProps {
  user: User | null
  session: Session | null
}

export const AuthContext = createContext<AuthContextProps>({
  user: null,
  session: null
})

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  const value = {
    user: session?.user ?? null,
    session
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}