'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Field, FieldLabel } from '@/components/ui/field'
import Image from 'next/image'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export default function SignupPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setPending(true)

    const form = new FormData(e.currentTarget)
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: form.get('email'),
        password: form.get('password'),
      }),
    })
    const body = await res.json()

    if (!res.ok) {
      setError(body.error ?? 'Gagal membuat akun. Coba lagi.')
      setPending(false)
      return
    }

    // Setelah daftar, arahkan ke halaman masuk.
    router.push('/login')
    router.refresh()
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
          <form className='flex w-full flex-col items-center gap-4' onSubmit={handleSubmit}>
            <h1 className='text-2xl font-semibold'>Buat akun baru</h1>
            <Field>
              <FieldLabel>Masukkan email Anda</FieldLabel>
              <Input
                name='email'
                type='email'
                placeholder='Masukkan email Anda'
                required
              />
            </Field>
            <Field>
              <FieldLabel>Masukkan kata sandi Anda</FieldLabel>
              <Input
                name='password'
                type='password'
                placeholder='Masukkan kata sandi Anda'
                required
              />
            </Field>
            {error && (
              <p className='w-full rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive'>
                {error}
              </p>
            )}
            <Button type='submit' disabled={pending}>
              {pending ? 'Memproses…' : 'Buat akun'}
            </Button>
            <a href="/login" className='flex items-center gap-2 text-sm font-medium text-zinc-950 dark:text-zinc-50'>
              Sudah punya akun? Masuk di sini
            </a>
          </form>
        </Card>
      </div>
    </main>
  )
}
