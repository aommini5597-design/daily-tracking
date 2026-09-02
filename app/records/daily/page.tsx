export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import Sidebar from '../../components/sidebar'
import { BadgePercent, AlertCircle, CheckCircle2 } from 'lucide-react'

export default async function DailyRecordPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>
}) {
  const supabase = await createClient()

  // 1. ตรวจสอบการ Login
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
  const errorMessage = resolvedParams?.error

  // Server Action สำหรับบันทึกยอด (ตรวจเช็กถ้ามีข้อมูลแล้วให้อัปเดตแทน)
  async function handleDailySubmit(formData: FormData) {
    'use server'
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      redirect('/records/daily?error=' + encodeURIComponent('ไม่พบข้อมูลผู้ใช้งาน กรุณาเข้าสู่ระบบใหม่'))
    }

    const date = formData.get('date') as string
    const brand_id = formData.get('brand_id') as string
    const depositRaw = formData.get('deposit') as string
    const withdrawRaw = formData.get('withdraw') as string
    const notesRaw = formData.get('notes') as string

    if (!date || !brand_id) {
      redirect('/records/daily?error=' + encodeURIComponent('กรุณาเลือกวันที่และแบรนด์ให้ครบถ้วน'))
    }

    const deposit = depositRaw && !isNaN(Number(depositRaw)) ? Number(depositRaw) : 0
    const withdraw = withdrawRaw && !isNaN(Number(withdrawRaw)) ? Number(withdrawRaw) : 0
    const notes = notesRaw?.trim() ? notesRaw.trim() : null

    // ตรวจสอบว่าในวันนั้น แบรนด์นั้น มีบันทึกอยู่แล้วหรือไม่
    const { data: existingRecord } = await supabase
      .from('daily_records')
      .select('id, notes')
      .eq('date', date)
      .eq('brand_id', brand_id)
      .maybeSingle()

    let dbError = null

    if (existingRecord) {
      // มีอยู่แล้ว (เช่น มีค่าใช้จ่ายอยู่ก่อน) -> ให้อัปเดตยอดฝาก-ถอนเพิ่มเข้าไป
      const { error: updateError } = await supabase
        .from('daily_records')
        .update({
          deposit,
          withdraw,
          notes: notes || existingRecord.notes,
        })
        .eq('id', existingRecord.id)
      dbError = updateError
    } else {
      // ยังไม่มีข้อมูล -> สร้างแถวใหม่
      const { error: insertError } = await supabase.from('daily_records').insert([
        {
          date,
          brand_id,
          deposit,
          withdraw,
          expenses: 0,
          notes,
          created_by: user.id,
        },
      ])
      dbError = insertError
    }

    if (dbError) {
      redirect('/records/daily?error=' + encodeURIComponent(dbError.message))
    }

    revalidatePath('/', 'layout')
    revalidatePath('/')
    revalidatePath('/brands-summary')
    revalidatePath('/records/daily')
    redirect('/?date=' + date)
  }

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

          {errorMessage && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-sm font-bold flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-black">เกิดข้อผิดพลาด:</p>
                <p className="font-mono text-xs mt-1 text-rose-800 break-all">{errorMessage}</p>
              </div>
            </div>
          )}

          {isSuccess && (
            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-sm font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>บันทึกยอดฝาก-ถอนเรียบร้อยแล้ว</span>
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