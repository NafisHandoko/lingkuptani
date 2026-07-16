import { signup } from '@/lib/signup/action'
import {
  Field,
  FieldDescription,
  FieldLabel,
} from "@/components/ui/field"
import Image from "next/image"
import { Input } from "@/components/ui/input"
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export default function SignupPage() {
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
		  <form className='flex w-full flex-col items-center gap-4' action={signup}>
				<h1 className='text-2xl font-semibold'>Buat akun baru</h1>
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
			<Button type='submit'>Buat akun</Button>
			<a href="/login" className='flex items-center gap-2 text-sm font-medium text-zinc-950 dark:text-zinc-50'>
				Sudah punya akun? Masuk di sini
			</a>
		  </form>
		</Card>
		</div>
		</main>
  )
}