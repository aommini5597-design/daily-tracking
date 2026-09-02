export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import Sidebar from '../../../components/sidebar'
import { Edit3, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default async function EditRecordPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

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

  // ดึงข้อมูลรายการที่ต้องการแก้ไข
  const { data: record } = await supabase
    .from('daily_records')
    .select('*')
    .eq('id', id)
    .single()

  if (!record) {
    redirect('/')
  }

  const { data: brandsData } = await supabase.from('brands').select('id, name').order('name')
  const brands = brandsData || []

  // Action บันทึกการแก้ไข
  async function handleUpdateRecord(formData: FormData) {
    'use server'
    const supabase = await createClient()

    const date = formData.get('date') as string
    const brand_id = formData.get('brand_id') as string
    const deposit = parseFloat(formData.get('deposit') as string) || 0
    const withdraw = parseFloat(formData.get('withdraw') as string) || 0

    const ads_expense = parseFloat(formData.get('ads_expense') as string) || 0
    const fee_expense = parseFloat(formData.get('fee_expense') as string) || 0
    const shipping_expense = parseFloat(formData.get('shipping_expense') as string) || 0
    const labor_expense = parseFloat(formData.get('labor_expense') as string) || 0
    const other_expense = parseFloat(formData.get('other_expense') as string) || 0

    const total_expenses = ads_expense + fee_expense + shipping_expense + labor_expense + other_expense
    const notes = (formData.get('notes') as string) || null

    await supabase
      .from('daily_records')
      .update({
        date,
        brand_id,
        deposit,
        withdraw,
        expenses: total_expenses,
        ads_expense,
        fee_expense,
        shipping_expense,
        labor_expense,
        other_expense,
        notes,
      })
      .eq('id', id)

    revalidatePath('/')
    revalidatePath('/expenses-summary')
    redirect('/')
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
      <Sidebar userEmail={user.email} role="super_admin" onLogout={handleLogout} />

      <main className="flex-1 p-6 sm:p-10 max-w-4xl overflow-y-auto">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between pb-6 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Edit3 className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold !text-black">แก้ไขข้อมูลรายการ</h1>
                <p className="text-slate-500 text-xs sm:text-sm mt-0.5">ปรับปรุงตัวเลขยอดเงินหรือหมวดหมู่ค่าใช้จ่าย</p>
              </div>
            </div>

            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>กลับ Dashboard</span>
            </Link>
          </div>

          <form action={handleUpdateRecord} className="space-y-5">
            <div>
              <label className="block text-sm font-bold !text-black mb-1.5">วันที่</label>
              <input
                type="date"
                name="date"
                required
                defaultValue={record.date}
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-sm font-bold !text-black mb-1.5">เลือกแบรนด์</label>
              <select name="brand_id" required defaultValue={record.brand_id} className={inputClass}>
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
                  defaultValue={record.deposit}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-bold !text-black mb-1.5">ยอดถอน (Withdraw)</label>
                <input
                  type="number"
                  step="0.01"
                  name="withdraw"
                  defaultValue={record.withdraw}
                  className={inputClass}
                />
              </div>
            </div>

            <div className="p-5 bg-amber-50/50 rounded-2xl border border-amber-200 space-y-4">
              <span className="text-sm font-bold text-amber-950 block">
                💳 หมวดหมู่ค่าใช้จ่าย (Expenses)
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold !text-black mb-1">📢 ค่าโฆษณา / Ads</label>
                  <input
                    type="number"
                    step="0.01"
                    name="ads_expense"
                    defaultValue={record.ads_expense || 0}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold !text-black mb-1">🏷️ ค่าธรรมเนียม / ค่าคอม</label>
                  <input
                    type="number"
                    step="0.01"
                    name="fee_expense"
                    defaultValue={record.fee_expense || 0}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold !text-black mb-1">📱 ค่าระบบ / ค่าเซิร์ฟ</label>
                  <input
                    type="number"
                    step="0.01"
                    name="shipping_expense"
                    defaultValue={record.shipping_expense || 0}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold !text-black mb-1">👥 ค่าจ้าง / OT</label>
                  <input
                    type="number"
                    step="0.01"
                    name="labor_expense"
                    defaultValue={record.labor_expense || 0}
                    className={inputClass}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold !text-black mb-1">🧩 ค่าใช้จ่ายอื่นๆ</label>
                  <input
                    type="number"
                    step="0.01"
                    name="other_expense"
                    defaultValue={record.other_expense || 0}
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
                defaultValue={record.notes || ''}
                className={inputClass}
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 !text-white font-bold rounded-xl transition shadow-md shadow-blue-500/20 cursor-pointer"
            >
              บันทึกการแก้ไข
            </button>
          </form>
        </div>
      </main>
    </div>
  )
}