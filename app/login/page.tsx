'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { login } from '@/lib/login/action'
import { Field, FieldLabel } from '@/components/ui/field'
import Image from 'next/image'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export default function LoginPage() {
  const [loading, setLoading] = useState(false)

  const handleGoogleSignIn = async () => {
    setLoading(true)

    const origin = window.location.origin
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${origin}/api/auth/callback`,
      },
    })

    if (error) {
      console.error(error)
      setLoading(false)
      return
    }

    if (data.url) {
      window.location.href = data.url
    } else {
      setLoading(false)
    }
  }

  return (
	
  <main className='relative min-h-screen overflow-hidden'>
    <Image
      src="/white-green-bg.jpg"
      alt="Background of a farmer planting rice"
      fill
      priority
      className="object-cover opacity-75 brightness-125"
    />
    <div className='absolute inset-0 bg-black/45' />
    <div className='relative z-10 flex min-h-screen items-center justify-center p-6'>
    <Card className='flex flex-col items-center p-6 shadow-2xl'>
      <form className='flex w-full flex-col items-center gap-4' action={login}>
			<h1 className='text-2xl font-semibold'>Masuk ke akun Anda</h1>
			<Field>
				<FieldLabel>Masukkan email Anda</FieldLabel>
				<Input
            name='email'
					type='email'
					placeholder='Masukkan email Anda'
				/>
			</Field>
			<Field>
				<FieldLabel>Masukkan kata sandi Anda</FieldLabel>
				<Input
            name='password'
					type='password'
					placeholder='Masukkan kata sandi Anda'
				/>
			</Field>
        <Button type='submit' disabled={loading}>
				{loading ? 'Loading...' : 'Masuk'}
			</Button>
      </form>
    </Card>
    </div>
    </main>
  )
}
