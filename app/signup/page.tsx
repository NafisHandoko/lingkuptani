'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Leaf, UserPlus, Mail, Lock } from 'lucide-react'

export default function SignupPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

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
    <main className="min-h-screen flex" style={{ backgroundColor: '#EEEEEE' }}>
      {/* Left panel – form */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 lg:px-12 order-2 lg:order-1">
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-2 mb-8">
          <div
            className="flex items-center justify-center w-10 h-10 rounded-xl"
            style={{ background: 'linear-gradient(135deg, #2FA084, #6FCF97)' }}
          >
            <Leaf className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold" style={{ color: '#1F6F5F' }}>LingkupTani</span>
        </div>

        <div
          className="w-full max-w-md rounded-3xl shadow-2xl p-8"
          style={{ background: '#ffffff', border: '1px solid rgba(111,207,151,0.25)' }}
        >
          {/* Header */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-1" style={{ color: '#1F6F5F' }}>Buat Akun Baru</h2>
            <p className="text-sm" style={{ color: '#5a7a6e' }}>
              Sudah punya akun?{' '}
              <a
                href="/login"
                className="font-semibold transition-colors hover:underline"
                style={{ color: '#2FA084' }}
              >
                Masuk di sini
              </a>
            </p>
          </div>

          <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-sm font-semibold" style={{ color: '#1F6F5F' }}>
                Email
              </label>
              <div className="relative">
                <Mail
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                  style={{ color: '#6FCF97' }}
                />
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="petani@email.com"
                  required
                  className="w-full h-11 pl-10 pr-4 rounded-xl text-sm transition-all outline-none"
                  style={{
                    border: '1.5px solid #c5dbd3',
                    background: '#f7fcf9',
                    color: '#1a2e28',
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = '#6FCF97'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(111,207,151,0.2)'; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = '#c5dbd3'; e.currentTarget.style.boxShadow = 'none'; }}
                />
              </div>
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-sm font-semibold" style={{ color: '#1F6F5F' }}>
                Kata Sandi
              </label>
              <div className="relative">
                <Lock
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                  style={{ color: '#6FCF97' }}
                />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Buat kata sandi yang kuat"
                  required
                  className="w-full h-11 pl-10 pr-10 rounded-xl text-sm transition-all outline-none"
                  style={{
                    border: '1.5px solid #c5dbd3',
                    background: '#f7fcf9',
                    color: '#1a2e28',
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = '#6FCF97'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(111,207,151,0.2)'; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = '#c5dbd3'; e.currentTarget.style.boxShadow = 'none'; }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: '#5a7a6e' }}
                  aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div
                className="px-4 py-3 rounded-xl text-sm"
                style={{ background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.2)', color: '#dc2626' }}
              >
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              id="signup-submit"
              type="submit"
              disabled={pending}
              className="h-12 w-full rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all duration-200 mt-1 disabled:opacity-60 disabled:cursor-not-allowed"
              style={{
                background: pending
                  ? '#a8dfc2'
                  : 'linear-gradient(135deg, #6FCF97 0%, #2FA084 100%)',
                boxShadow: pending ? 'none' : '0 4px 15px rgba(111,207,151,0.4)',
              }}
              onMouseEnter={(e) => {
                if (!pending) {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #2FA084 0%, #1F6F5F 100%)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(47,160,132,0.45)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }
              }}
              onMouseLeave={(e) => {
                if (!pending) {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #6FCF97 0%, #2FA084 100%)';
                  e.currentTarget.style.boxShadow = '0 4px 15px rgba(111,207,151,0.4)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }
              }}
            >
              {pending ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Memproses…
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  Buat Akun
                </>
              )}
            </button>
          </form>

          {/* Terms */}
          <p className="text-xs text-center mt-6" style={{ color: '#85b5a5' }}>
            Dengan mendaftar, Anda menyetujui syarat dan ketentuan LingkupTani.
          </p>
        </div>
      </div>

      {/* Right panel – branding */}
      <div
        className="hidden lg:flex lg:w-1/2 xl:w-2/5 relative flex-col items-center justify-center overflow-hidden order-1 lg:order-2"
        style={{ background: 'linear-gradient(135deg, #1F6F5F 0%, #2FA084 50%, #6FCF97 100%)' }}
      >
        {/* Decorative circles */}
        <div
          className="absolute -top-32 -right-32 w-96 h-96 rounded-full opacity-20"
          style={{ background: 'rgba(255,255,255,0.3)' }}
        />
        <div
          className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full opacity-15"
          style={{ background: 'rgba(255,255,255,0.25)' }}
        />

        <div className="relative z-10 flex flex-col items-center text-center px-12 max-w-lg">
          {/* Logo */}
          <div className="flex items-center justify-center w-20 h-20 rounded-2xl mb-6 shadow-2xl"
            style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.3)' }}
          >
            <Leaf className="w-10 h-10 text-white" />
          </div>

          <h1 className="text-4xl font-bold text-white mb-4 leading-tight">
            Bergabung dengan<br />
            <span style={{ color: '#d4f0e2' }}>LingkupTani</span>
          </h1>
          <p className="text-white/80 text-lg leading-relaxed">
            Daftarkan toko Anda dan jadilah bagian dari ekosistem pertanian digital Indonesia.
          </p>

          {/* Steps */}
          <div className="flex flex-col gap-4 mt-8 w-full">
            {[
              { step: '1', text: 'Buat akun gratis Anda' },
              { step: '2', text: 'Tambahkan lokasi toko' },
              { step: '3', text: 'Ditemukan petani sekitar' },
            ].map(({ step, text }) => (
              <div
                key={step}
                className="flex items-center gap-4 px-4 py-3 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)' }}
              >
                <span
                  className="flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold shrink-0"
                  style={{ background: 'rgba(255,255,255,0.3)', color: '#fff' }}
                >
                  {step}
                </span>
                <span className="text-white/90 text-sm font-medium">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}
