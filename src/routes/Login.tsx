import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export default function Login() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)

    // Store for verification step later
    localStorage.setItem('pendingEmail', email)

    // Send the magic link, redirecting back to /public
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/public`
      }
    })

    if (error) {
      setMessage(`Error: ${error.message}`)
    } else {
      setMessage('Check your inbox for the magic link!')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto mt-20 max-w-sm space-y-4">
      <h1 className="text-center text-2xl font-bold">Sign in</h1>
      <Input
        type="email"
        required
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <Button type="submit" className="w-full">
        Send magic link
      </Button>
      {message && <p className="mt-4 text-center">{message}</p>}
    </form>
  )
}
