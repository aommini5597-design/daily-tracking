export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import Sidebar from '../../components/sidebar'
import { Receipt } from 'lucide-react'

export default async function ExpensesRecordPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string }>
}) {
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
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'super_admin') {
    redirect('/')
  }

  // 2. ดึงรายชื่อแบรนด์
  const { data: brandsData } = await supabase
    .from('brands')
    .select('id, name')
    .order('name')

  const brands = brandsData || []
  const resolvedParams = await searchParams
  const isSuccess = resolvedParams?.success === 'true'

  // Server Action สำหรับบันทึกค่าใช้จ่าย
  async function handleExpenseSubmit(formData: FormData) {
    'use server'
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    const date = formData.get('date') as string
    const brand_id = formData.get('brand_id') as string

    const ads_expense = parseFloat(formData.get('ads_expense') as string) || 0
    const fee_expense = parseFloat(formData.get('fee_expense') as string) || 0
    const shipping_expense = parseFloat(formData.get('shipping_expense') as string) || 0
    const labor_expense = parseFloat(formData.get('labor_expense') as string) || 0
    const other_expense = parseFloat(formData.get('other_expense') as string) || 0

    const total_expenses =
      ads_expense + fee_expense + shipping_expense + labor_expense + other_expense
    const notes = (formData.get('notes') as string) || null

    await supabase.from('daily_records').insert([
      {
        date,
        brand_id,
        expenses: total_expenses,
        ads_expense,
        fee_expense,
        shipping_expense,
        labor_expense,
        other_expense,
        notes,
        created_by: user.id,
      },
    ])

    revalidatePath('/')
    revalidatePath('/expenses-summary')
    revalidatePath('/records/expenses')
    redirect('/records/expenses?success=true')
  }

  // Server Action สำหรับ Logout
  async function handleLogout() {
    'use server'
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/login')
  }

  const inputClass =
    'w-full px-4 py-3 bg-white !text-black placeholder:text-gray-400 border border-slate-300 rounded-xl font-semibold focus:ring-2 focus:ring-amber-500 outline-none transition'

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar
        userEmail={user.email}
        role="super_admin"
        onLogout={handleLogout}
      />

      <main className="flex-1 p-6 sm:p-10 max-w-4xl overflow-y-auto">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-6 pb-6 border-slate-100 border-b">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold !text-black">บันทึกค่าใช้จ่าย (Expenses)</h1>
              <p className="text-slate-500 text-xs sm:text-sm mt-0.5">เฉพาะผู้ดูแลระบบ (Super Admin)</p>
            </div>
          </div>

          {isSuccess && (
            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-sm font-semibold">
              ✓ บันทึกค่าใช้จ่ายเรียบร้อยแล้ว
            </div>
          )}

          <form action={handleExpenseSubmit} className="space-y-5">
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

            {/* หมวดหมู่ค่าใช้จ่าย */}
            <div className="p-5 bg-amber-50/50 rounded-2xl border border-amber-200 space-y-4">
              <span className="text-sm font-bold text-amber-950 block">
                💳 ระบุยอดค่าใช้จ่ายแต่ละหมวด
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold !text-black mb-1">📢 ค่าโฆษณา / Ads</label>
                  <input
                    type="number"
                    step="0.01"
                    name="ads_expense"
                    placeholder="0.00"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold !text-black mb-1">🏷️ ค่าธรรมเนียม / ค่าคอม</label>
                  <input
                    type="number"
                    step="0.01"
                    name="fee_expense"
                    placeholder="0.00"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold !text-black mb-1">📱 ค่าระบบ / ค่าเซิร์ฟ</label>
                  <input
                    type="number"
                    step="0.01"
                    name="shipping_expense"
                    placeholder="0.00"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold !text-black mb-1">👥 ค่าจ้าง / OT</label>
                  <input
                    type="number"
                    step="0.01"
                    name="labor_expense"
                    placeholder="0.00"
                    className={inputClass}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold !text-black mb-1">🧩 ค่าใช้จ่ายอื่นๆ</label>
                  <input
                    type="number"
                    step="0.01"
                    name="other_expense"
                    placeholder="0.00"
                    className={inputClass}
                  />
                </div>
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
              className="w-full py-3.5 bg-amber-600 hover:bg-amber-700 !text-white font-bold rounded-xl transition shadow-md shadow-amber-600/20 cursor-pointer"
            >
              บันทึกค่าใช้จ่าย
            </button>
          </form>
        </div>
      </main>
    </div>
  )
}