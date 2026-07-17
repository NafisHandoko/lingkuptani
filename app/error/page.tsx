import Image from 'next/image'
import { Card } from '@/components/ui/card'
import { TriangleAlert } from 'lucide-react'

export default async function ErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>
}) {
  const { message } = await searchParams

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
        <Card className='flex max-w-sm flex-col items-center gap-4 p-6 text-center shadow-2xl'>
          <TriangleAlert className='size-10 text-destructive' />
          <h1 className='text-2xl font-semibold'>Terjadi kesalahan</h1>
          <p className='text-sm text-muted-foreground'>
            {message ?? 'Maaf, terjadi kesalahan. Silakan coba lagi.'}
          </p>
          <a
            href="/login"
            className='text-sm font-medium text-zinc-950 dark:text-zinc-50'
          >
            Kembali ke halaman masuk
          </a>
        </Card>
      </div>
    </main>
  )
}
