export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import Sidebar from '../components/sidebar'
import { TrendingDown, Calendar, RotateCcw, Trash2, Filter } from 'lucide-react'

export default async function ExpensesSummaryPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; date?: string; brand_id?: string }>
}) {
  const supabase = await createClient()

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

  const { data: brandsData } = await supabase.from('brands').select('id, name').order('name')
  const brands = brandsData || []

  const resolvedParams = await searchParams
  const selectedDate = resolvedParams?.date?.trim() || ''
  const selectedMonth = resolvedParams?.month?.trim() || ''
  const selectedBrand = resolvedParams?.brand_id?.trim() || ''

  let query = supabase
    .from('daily_records')
    .select('*, brands(name)')
    .order('date', { ascending: false })

  if (selectedDate) {
    query = query.eq('date', selectedDate)
  } else if (selectedMonth) {
    const [year, month] = selectedMonth.split('-').map(Number)
    if (year && month) {
      const startDate = `${selectedMonth}-01`
      const lastDay = new Date(year, month, 0).getDate()
      const endDate = `${selectedMonth}-${String(lastDay).padStart(2, '0')}`
      query = query.gte('date', startDate).lte('date', endDate)
    }
  }

  if (selectedBrand) {
    query = query.eq('brand_id', selectedBrand)
  }

  const { data: recordsData } = await query
  const records = recordsData || []

  const totalAds = records.reduce((acc: number, r: any) => acc + (Number(r.ads_expense) || 0), 0)
  const totalFee = records.reduce((acc: number, r: any) => acc + (Number(r.fee_expense) || 0), 0)
  const totalServer = records.reduce((acc: number, r: any) => acc + (Number(r.shipping_expense) || 0), 0)
  const totalLabor = records.reduce((acc: number, r: any) => acc + (Number(r.labor_expense) || 0), 0)
  const totalOther = records.reduce((acc: number, r: any) => acc + (Number(r.other_expense) || 0), 0)
  const grandTotal = totalAds + totalFee + totalServer + totalLabor + totalOther

  const categories = [
    { name: '📢 ค่าโฆษณา / Ads', amount: totalAds, color: 'text-blue-600', bg: 'bg-blue-50' },
    { name: '🏷️ ค่าธรรมเนียม / ค่าคอม', amount: totalFee, color: 'text-purple-600', bg: 'bg-purple-50' },
    { name: '📱 ค่าระบบ / ค่าเซิร์ฟ', amount: totalServer, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { name: '👥 ค่าจ้าง / OT', amount: totalLabor, color: 'text-orange-600', bg: 'bg-orange-50' },
    { name: '🧩 ค่าใช้จ่ายอื่นๆ', amount: totalOther, color: 'text-slate-600', bg: 'bg-slate-100' },
  ]

  const filterLabel = selectedDate
    ? `แสดงข้อมูลประจำวันที่ ${selectedDate}`
    : selectedMonth
    ? `แสดงข้อมูลประจำเดือน ${selectedMonth}`
    : 'แสดงข้อมูลค่าใช้จ่ายทั้งหมดทุกช่วงเวลา'

  async function handleDeleteExpenseRecord(formData: FormData) {
    'use server'
    const id = formData.get('id') as string
    if (!id) return

    const supabase = await createClient()
    await supabase.from('daily_records').delete().eq('id', id)
    revalidatePath('/expenses-summary')
    revalidatePath('/')
  }

  async function handleLogout() {
    'use server'
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/login')
  }

  const expenseRecords = records.filter((r) => Number(r.expenses) > 0)

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar userEmail={user.email} role={profile?.role} onLogout={handleLogout} />

      <main className="flex-1 p-6 sm:p-10 overflow-y-auto max-w-7xl">
        <div className="space-y-8">
          {/* Header & Filter Bar */}
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold !text-black flex items-center gap-2">
                <TrendingDown className="w-7 h-7 text-amber-600" />
                <span>วิเคราะห์หมวดค่าใช้จ่าย</span>
              </h1>
              <p className="text-amber-600 font-semibold text-sm mt-1">{filterLabel}</p>
            </div>

            <form method="get" className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-2 rounded-2xl border border-slate-200">
                <Filter className="w-3.5 h-3.5 text-slate-500" />
                <select
                  name="brand_id"
                  defaultValue={selectedBrand}
                  className="bg-transparent text-xs font-bold !text-black outline-none cursor-pointer"
                >
                  <option value="">ทุกแบรนด์</option>
                  {brands.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-2 rounded-2xl border border-slate-200">
                <span className="text-xs font-bold text-slate-500">วัน:</span>
                <input
                  type="date"
                  name="date"
                  defaultValue={selectedDate}
                  className="bg-transparent text-xs font-bold !text-black outline-none cursor-pointer"
                />
              </div>

              <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-2 rounded-2xl border border-slate-200">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <input
                  type="month"
                  name="month"
                  defaultValue={selectedMonth}
                  className="bg-transparent text-xs font-bold !text-black outline-none cursor-pointer"
                />
              </div>

              <button
                type="submit"
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 !text-white text-xs font-bold rounded-2xl transition cursor-pointer shadow-sm"
              >
                กรองข้อมูล
              </button>

              {(selectedDate || selectedMonth || selectedBrand) && (
                <a
                  href="/expenses-summary"
                  className="inline-flex items-center gap-1 px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-2xl transition"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>ล้างตัวกรอง</span>
                </a>
              )}
            </form>
          </div>

          {/* Grand Total */}
          <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-3xl p-6 sm:p-8 text-white shadow-lg shadow-amber-500/20">
            <span className="text-sm font-semibold opacity-90">ยอดรวมค่าใช้จ่ายทุกหมวด</span>
            <h2 className="text-3xl sm:text-4xl font-black mt-2">
              ฿{grandTotal.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
            </h2>
          </div>

          {/* Categorized Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {categories.map((cat) => {
              const percentage = grandTotal > 0 ? ((cat.amount / grandTotal) * 100).toFixed(1) : '0.0'
              return (
                <div key={cat.name} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold !text-black">{cat.name}</span>
                    <span className={`text-xs font-extrabold px-2.5 py-1 rounded-full ${cat.bg} ${cat.color}`}>
                      {percentage}%
                    </span>
                  </div>
                  <p className={`text-2xl font-black ${cat.color}`}>
                    ฿{cat.amount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              )
            })}
          </div>

          {/* Detailed Expense Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold !text-black">รายละเอียดค่าใช้จ่าย</h2>
                <p className="text-xs text-slate-400 mt-0.5">ตารางแจกแจงตามหมวดหมู่ของแต่ละรายการ</p>
              </div>
              <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3.5 py-1 rounded-full">
                ทั้งหมด {expenseRecords.length} รายการ
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-xs uppercase font-bold text-slate-700 border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-4">วันที่</th>
                    <th className="px-5 py-4">แบรนด์</th>
                    <th className="px-5 py-4 text-right">ค่าแอด</th>
                    <th className="px-5 py-4 text-right">ค่าคอม/ธรรมเนียม</th>
                    <th className="px-5 py-4 text-right">ค่าระบบ/เซิร์ฟ</th>
                    <th className="px-5 py-4 text-right">ค่าจ้าง</th>
                    <th className="px-5 py-4 text-right">อื่นๆ</th>
                    <th className="px-5 py-4 text-right font-black !text-black">รวมวันนั้น</th>
                    <th className="px-5 py-4 text-center">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {expenseRecords.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-6 py-12 text-center text-slate-400 font-medium">
                        ไม่พบข้อมูลค่าใช้จ่ายตามเงื่อนไขที่เลือก
                      </td>
                    </tr>
                  ) : (
                    expenseRecords.map((r: any) => (
                      <tr key={r.id} className="hover:bg-slate-50/80 transition">
                        <td className="px-5 py-4 font-bold !text-black whitespace-nowrap">{r.date}</td>
                        <td className="px-5 py-4 font-bold !text-black">{r.brands?.name || '-'}</td>
                        <td className="px-5 py-4 text-right text-slate-600 whitespace-nowrap">
                          {r.ads_expense ? `฿${Number(r.ads_expense).toLocaleString('th-TH', { minimumFractionDigits: 2 })}` : '-'}
                        </td>
                        <td className="px-5 py-4 text-right text-slate-600 whitespace-nowrap">
                          {r.fee_expense ? `฿${Number(r.fee_expense).toLocaleString('th-TH', { minimumFractionDigits: 2 })}` : '-'}
                        </td>
                        <td className="px-5 py-4 text-right text-slate-600 whitespace-nowrap">
                          {r.shipping_expense ? `฿${Number(r.shipping_expense).toLocaleString('th-TH', { minimumFractionDigits: 2 })}` : '-'}
                        </td>
                        <td className="px-5 py-4 text-right text-slate-600 whitespace-nowrap">
                          {r.labor_expense ? `฿${Number(r.labor_expense).toLocaleString('th-TH', { minimumFractionDigits: 2 })}` : '-'}
                        </td>
                        <td className="px-5 py-4 text-right text-slate-600 whitespace-nowrap">
                          {r.other_expense ? `฿${Number(r.other_expense).toLocaleString('th-TH', { minimumFractionDigits: 2 })}` : '-'}
                        </td>
                        <td className="px-5 py-4 text-right font-black text-amber-600 whitespace-nowrap">
                          ฿{Number(r.expenses).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-5 py-4 text-center">
                          <form action={handleDeleteExpenseRecord}>
                            <input type="hidden" name="id" value={r.id} />
                            <button
                              type="submit"
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                              title="ลบรายการนี้"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </form>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}