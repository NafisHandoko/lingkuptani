// Login now goes through the JSON route handler `POST /api/auth/login`
// (called via fetch from app/login/page.tsx), so this Server Action is unused.

// 'use server'

// import { revalidatePath } from 'next/cache'
// import { redirect } from 'next/navigation'
// import { createSupabaseServer } from '@/lib/supabase/server'

// export type AuthState = { error?: string }

// export async function login(
//   _prevState: AuthState,
//   formData: FormData,
// ): Promise<AuthState> {
//   const supabase = await createSupabaseServer()

//   const data = {
//     email: formData.get('email') as string,
//     password: formData.get('password') as string,
//   }

//   const { error } = await supabase.auth.signInWithPassword(data)

//   if (error) {
//     const message =
//       error.message === 'Invalid login credentials'
//         ? 'Email atau kata sandi salah.'
//         : error.message
//     return { error: message }
//   }

//   revalidatePath('/', 'layout')
//   redirect('/map')
// }

export {}
