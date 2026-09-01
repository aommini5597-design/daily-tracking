export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import Link from 'next/link'
import { ArrowLeft, Building2, Plus, Trash2 } from 'lucide-react'

export default async function BrandsPage() {
  const supabase = await createClient()

  // ดึงรายชื่อแบรนด์ทั้งหมด
  const { data: brandsData } = await supabase
    .from('brands')
    .select('*')
    .order('name')

  const brands = brandsData || []

  // Server Action สำหรับเพิ่มแบรนด์ใหม่
  async function addBrand(formData: FormData) {
    'use server'
    const name = formData.get('name') as string
    if (!name?.trim()) return

    const supabase = await createClient()
    await supabase.from('brands').insert([{ name: name.trim() }])
    revalidatePath('/brands')
    revalidatePath('/records')
    revalidatePath('/')
  }

  // Server Action สำหรับลบแบรนด์
  async function deleteBrand(formData: FormData) {
    'use server'
    const id = formData.get('id') as string
    if (!id) return

    const supabase = await createClient()
    await supabase.from('brands').delete().eq('id', id)
    revalidatePath('/brands')
    revalidatePath('/records')
    revalidatePath('/')
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* ปุ่มกลับหน้า Dashboard */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-slate-600 hover:text-black font-semibold transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>กลับหน้า Dashboard</span>
        </Link>

        {/* Card จัดการแบรนด์ */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 sm:p-8 space-y-6">
          <div>
            <h1 className="text-2xl font-bold !text-black flex items-center gap-2">
              <Building2 className="w-7 h-7 text-blue-600" />
              <span>จัดการแบรนด์ (Brands Management)</span>
            </h1>
            <p className="text-slate-500 text-sm mt-1">เพิ่มหรือลบรายชื่อแบรนด์ในระบบ</p>
          </div>

          {/* ฟอร์มเพิ่มแบรนด์ */}
          <form action={addBrand} className="flex gap-3">
            <input
              type="text"
              name="name"
              required
              placeholder="กรอกชื่อแบรนด์ใหม่..."
              className="flex-1 px-4 py-3 bg-white !text-black placeholder:text-gray-400 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-blue-600 outline-none transition"
            />
            <button
              type="submit"
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 !text-white font-bold rounded-xl transition shadow-md shadow-blue-500/20 flex items-center gap-2 cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-5 h-5" />
              <span>เพิ่มแบรนด์</span>
            </button>
          </form>

          {/* รายการแบรนด์ */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100">
            {brands.length === 0 ? (
              <div className="p-8 text-center text-slate-400">ยังไม่มีแบรนด์ในระบบ</div>
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
      </div>
    </div>
  )
}