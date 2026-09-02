export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; error?: string }>
}) {
  const supabase = await createClient()

  // ถ้าล็อกอินอยู่แล้ว ให้ข้ามไปหน้าแรก
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect('/')
  }

  const resolvedParams = await searchParams
  const errorMessage = resolvedParams?.error || resolvedParams?.message

  async function handleLogin(formData: FormData) {
    'use server'
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    const supabase = await createClient()
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      redirect(`/login?error=${encodeURIComponent('อีเมลหรือรหัสผ่านไม่ถูกต้อง')}`)
    }

    redirect('/')
  }

  const inputClass =
    'w-full px-4 py-3 bg-white !text-black text-slate-900 placeholder:text-gray-400 border border-slate-300 rounded-xl font-semibold focus:ring-2 focus:ring-blue-600 outline-none transition'

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-sm p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl mx-auto flex items-center justify-center text-white font-black text-xl shadow-lg shadow-blue-500/20">
            D
          </div>
          <h1 className="text-2xl font-bold !text-black">เข้าสู่ระบบ</h1>
          <p className="text-slate-500 text-sm">Daily Tracking & Financial System</p>
        </div>

        {errorMessage && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-xl text-center">
            {errorMessage}
          </div>
        )}

        <form action={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-bold !text-black mb-1.5">อีเมล</label>
            <input
              type="email"
              name="email"
              required
              placeholder="name@example.com"
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-sm font-bold !text-black mb-1.5">รหัสผ่าน</label>
            <input
              type="password"
              name="password"
              required
              placeholder="••••••••"
              className={inputClass}
            />
          </div>

          <button
            type="submit"
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 !text-white font-bold rounded-xl transition shadow-md shadow-blue-500/20 cursor-pointer text-sm"
          >
            เข้าสู่ระบบ
          </button>
        </form>
      </div>
    </div>
  )
}