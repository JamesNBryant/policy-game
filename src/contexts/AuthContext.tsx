import React, { createContext, useEffect, useState, ReactNode } from 'react'
import { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabaseClient'

interface AuthContextProps {
  user: User | null
  session: Session | null
  initialised: boolean
}

export const AuthContext = createContext<AuthContextProps>({
  user: null,
  session: null,
  initialised: false
})

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession]   = useState<Session | null>(null)
  const [initialised, setInit]  = useState(false)

  useEffect(() => {
    let unsubscribe: () => void

    (async () => {
      /* ── 1️⃣ Grab any tokens in the URL hash (magic-link flow) ───────── */
      const hash = window.location.hash.substring(1)     // trim leading #
      const params = new URLSearchParams(hash)
      const access_token  = params.get('access_token')
      const refresh_token = params.get('refresh_token')

      if (access_token && refresh_token) {
        const { data, error } = await supabase.auth.setSession({
          access_token,
          refresh_token
        })

        if (error) {
          console.error('setSession failed:', error.message)
        } else {
          setSession(data.session)
        }

        // Clean the hash from the address bar
        window.history.replaceState({}, document.title, window.location.pathname)
      }

      /* ── 2️⃣ Load whatever session is now in storage ─────────────────── */
      const { data: { session: boot } } = await supabase.auth.getSession()
      setSession(boot)

      /* ── 3️⃣ Subscribe to future changes ─────────────────────────────── */
      const { data: { subscription } } =
        supabase.auth.onAuthStateChange((_evt, newSession) => setSession(newSession))
      unsubscribe = () => subscription.unsubscribe()

      /* ── 4️⃣ Unblock the UI ──────────────────────────────────────────── */
      setInit(true)
    })()

    return () => { if (unsubscribe) unsubscribe() }
  }, [])

  return (
    <AuthContext.Provider value={{ user: session?.user ?? null, session, initialised }}>
      {children}
    </AuthContext.Provider>
  )
}
