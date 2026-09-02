export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import Sidebar from '../../components/sidebar'
import { BadgePercent } from 'lucide-react'

export default async function DailyRecordPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string }>
}) {
  const supabase = await createClient()

  // 1. ตรวจสอบสิทธิ์ผู้ใช้
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  // 2. ดึงรายชื่อแบรนด์
  const { data: brandsData } = await supabase
    .from('brands')
    .select('id, name')
    .order('name')

  const brands = brandsData || []
  const resolvedParams = await searchParams
  const isSuccess = resolvedParams?.success === 'true'

  // Server Action สำหรับบันทึกยอด
  async function handleDailySubmit(formData: FormData) {
    'use server'
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    const date = formData.get('date') as string
    const brand_id = formData.get('brand_id') as string
    const deposit = parseFloat(formData.get('deposit') as string) || 0
    const withdraw = parseFloat(formData.get('withdraw') as string) || 0
    const notes = (formData.get('notes') as string) || null

    await supabase.from('daily_records').insert([
      {
        date,
        brand_id,
        deposit,
        withdraw,
        notes,
        created_by: user.id,
      },
    ])

    // ล้างแคชทุกหน้า และพาเด้งกลับไปหน้าแรกทันที
    revalidatePath('/', 'layout')
    revalidatePath('/')
    revalidatePath('/brands-summary')
    revalidatePath('/records/daily')
    redirect('/?success=true')
  }

  // Server Action สำหรับ Logout
  async function handleLogout() {
    'use server'
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/login')
  }

  const inputClass =
    'w-full px-4 py-3 bg-white !text-black placeholder:text-gray-400 border border-slate-300 rounded-xl font-semibold focus:ring-2 focus:ring-blue-600 outline-none transition'

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar
        userEmail={user.email}
        role={profile?.role}
        onLogout={handleLogout}
      />

      <main className="flex-1 p-4 sm:p-8 md:p-10 max-w-4xl overflow-y-auto">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 mt-12 md:mt-0">
          <div className="flex items-center gap-3 mb-6 pb-6 border-slate-100 border-b">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <BadgePercent className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold !text-black">บันทึกยอดฝาก-ถอน ประจำวัน</h1>
              <p className="text-slate-500 text-xs sm:text-sm mt-0.5">เฉพาะยอดเงินฝากและยอดเงินถอนของแต่ละแบรนด์</p>
            </div>
          </div>

          {isSuccess && (
            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-sm font-semibold">
              ✓ บันทึกยอดฝาก-ถอนเรียบร้อยแล้ว
            </div>
          )}

          <form action={handleDailySubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-bold !text-black mb-1.5">วันที่</label>
              <input
                type="date"
                name="date"
                required
                defaultValue={new Date().toISOString().split('T')[0]}
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-sm font-bold !text-black mb-1.5">เลือกแบรนด์</label>
              <select name="brand_id" required defaultValue="" className={inputClass}>
                <option value="" disabled className="text-gray-400">
                  -- กรุณาเลือกแบรนด์ --
                </option>
                {brands.map((b) => (
                  <option key={b.id} value={b.id} className="!text-black">
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold !text-black mb-1.5">ยอดฝาก (Deposit)</label>
                <input
                  type="number"
                  step="0.01"
                  name="deposit"
                  placeholder="0.00"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-bold !text-black mb-1.5">ยอดถอน (Withdraw)</label>
                <input
                  type="number"
                  step="0.01"
                  name="withdraw"
                  placeholder="0.00"
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold !text-black mb-1.5">หมายเหตุ</label>
              <input
                type="text"
                name="notes"
                placeholder="รายละเอียดเพิ่มเติม (ถ้ามี)"
                className={inputClass}
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 !text-white font-bold rounded-xl transition shadow-md shadow-blue-500/20 cursor-pointer"
            >
              บันทึกยอดฝาก-ถอน
            </button>
          </form>
        </div>
      </main>
    </div>
  )
}