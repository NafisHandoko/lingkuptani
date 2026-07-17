// Signup now goes through the JSON route handler `POST /api/auth/register`
// (called via fetch from app/signup/page.tsx), so this Server Action is unused.

// 'use server'

// import { revalidatePath } from 'next/cache'
// import { redirect } from 'next/navigation'
// import { createSupabaseServer } from '../supabase/server'

// export type AuthState = { error?: string }

// export async function signup(
//   _prevState: AuthState,
//   formData: FormData,
// ): Promise<AuthState> {
//   const supabase = await createSupabaseServer()

//   const data = {
//     email: formData.get('email') as string,
//     password: formData.get('password') as string,
//   }

//   const { error } = await supabase.auth.signUp(data)

//   if (error) {
//     const message =
//       error.message === 'User already registered'
//         ? 'Email sudah terdaftar. Silakan masuk.'
//         : error.message
//     return { error: message }
//   }

//   revalidatePath('/', 'layout')
//   redirect('/login')
// }

export {}
