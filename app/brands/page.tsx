export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import Sidebar from '../components/sidebar'
import { Building2, Plus, Trash2 } from 'lucide-react'

export default async function BrandsPage() {
  const supabase = await createClient()

  // 1. ตรวจสอบสิทธิ์ Super Admin
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, email')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'super_admin') {
    redirect('/')
  }

  // 2. ดึงรายชื่อแบรนด์ทั้งหมด
  const { data: brandsData } = await supabase
    .from('brands')
    .select('*')
    .order('name')

  const brands = brandsData || []

  // Server Action: เพิ่มแบรนด์ใหม่
  async function addBrand(formData: FormData) {
    'use server'
    const name = formData.get('name') as string
    if (!name?.trim()) return

    const supabase = await createClient()
    await supabase.from('brands').insert([{ name: name.trim() }])
    revalidatePath('/brands')
    revalidatePath('/records/daily')
    revalidatePath('/records/expenses')
    revalidatePath('/')
  }

  // Server Action: ลบแบรนด์
  async function deleteBrand(formData: FormData) {
    'use server'
    const id = formData.get('id') as string
    if (!id) return

    const supabase = await createClient()
    await supabase.from('brands').delete().eq('id', id)
    revalidatePath('/brands')
    revalidatePath('/records/daily')
    revalidatePath('/records/expenses')
    revalidatePath('/')
  }

  async function handleLogout() {
    'use server'
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar userEmail={user.email} role={profile?.role} onLogout={handleLogout} />

      <main className="flex-1 p-6 sm:p-10 max-w-4xl">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-3 pb-6 border-b border-slate-100">
            <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold !text-black">จัดการรายชื่อแบรนด์</h1>
              <p className="text-slate-500 text-xs sm:text-sm mt-0.5">เพิ่มหรือลบแบรนด์สำหรับบันทึกยอดเงิน</p>
            </div>
          </div>

          {/* ฟอร์มเพิ่มแบรนด์ */}
          <form action={addBrand} className="flex gap-3">
            <input
              type="text"
              name="name"
              required
              placeholder="กรอกชื่อแบรนด์ใหม่..."
              className="flex-1 px-4 py-3 bg-white !text-black placeholder:text-gray-400 border border-slate-300 rounded-xl font-semibold focus:ring-2 focus:ring-purple-500 outline-none transition"
            />
            <button
              type="submit"
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 !text-white font-bold rounded-xl transition shadow-md shadow-purple-500/20 flex items-center gap-2 cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-5 h-5" />
              <span>เพิ่มแบรนด์</span>
            </button>
          </form>

          {/* ตารางรายชื่อแบรนด์ */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100">
            {brands.length === 0 ? (
              <div className="p-8 text-center text-slate-400 font-medium">ยังไม่มีรายชื่อแบรนด์ในระบบ</div>
            ) : (
              brands.map((brand: any) => (
                <div
                  key={brand.id}
                  className="p-4 flex items-center justify-between hover:bg-slate-50 transition"
                >
                  <span className="font-bold !text-black text-base">{brand.name}</span>
                  <form action={deleteBrand}>
                    <input type="hidden" name="id" value={brand.id} />
                    <button
                      type="submit"
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                      title="ลบแบรนด์"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </form>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  )
}