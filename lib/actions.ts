'use server'
import { createSupabaseServer } from './supabase/server'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

const signInWithGoogle = (provider: any) => async () => {
  const supabase = await createSupabaseServer()

  const requestHeaders = await headers()
  const origin = requestHeaders.get('origin') ?? process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  const auth_callback_url = `${origin}/api/auth/callback`

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: auth_callback_url,
    },
  })

  if (error) {
    console.log(error)
  }

  if (data.url) {
    redirect(data.url)
  }
}

export const signinWithGoogle = signInWithGoogle('google')