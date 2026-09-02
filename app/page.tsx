export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Sidebar from './components/sidebar'
import { Calendar, TrendingUp, TrendingDown, Wallet, DollarSign } from 'lucide-react'
export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>
}) {
  const supabase = await createClient()

  // 1. ตรวจสอบการ Login
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // 2. ดึงสิทธิ์ User
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, email')
    .eq('id', user.id)
    .single()

  const isSuperAdmin = profile?.role === 'super_admin'

  // 3. กำหนดตัวกรองเดือน (ค่าเริ่มต้นคือเดือนปัจจุบัน YYYY-MM)
  const resolvedParams = await searchParams
  const today = new Date()
  const currentMonthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`
  const selectedMonth = resolvedParams?.month || currentMonthStr

  // 4. ดึงข้อมูลบันทึกยอดทั้งหมดที่ตรงกับเดือนที่เลือก
  const startDate = `${selectedMonth}-01`
  const endDate = `${selectedMonth}-31`

  const { data: recordsData } = await supabase
    .from('daily_records')
    .select('*, brands(name)')
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: false })

  const records = recordsData || []

  // คำนวณสรุปยอดรวมทั้งเดือน
  const totalDeposit = records.reduce((acc: number, r: any) => acc + (Number(r.deposit) || 0), 0)
  const totalWithdraw = records.reduce((acc: number, r: any) => acc + (Number(r.withdraw) || 0), 0)
  const totalExpenses = records.reduce((acc: number, r: any) => acc + (Number(r.expenses) || 0), 0)
  const netProfit = totalDeposit - totalWithdraw - totalExpenses

  // Server Action ออกจากระบบ
  async function handleLogout() {
    'use server'
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* เมนูด้านข้าง Sidebar */}
      <Sidebar
        userEmail={user.email}
        role={profile?.role}
        onLogout={handleLogout}
      />

      {/* เนื้อหาหลัก Main Content */}
      <main className="flex-1 p-6 sm:p-10 overflow-y-auto max-w-7xl">
        <div className="space-y-8">
          {/* Header Bar ด้านบน */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold !text-black">Dashboard ภาพรวม</h1>
              <p className="text-slate-500 text-sm mt-1">สรุปข้อมูลยอดเงินรายวันและยอดรวมประจำเดือน</p>
            </div>

            {/* ช่องเลือกเดือนสำหรับกรองข้อมูล */}
            <form method="get" className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-200">
              <Calendar className="w-4 h-4 text-slate-500 ml-2" />
              <input
                type="month"
                name="month"
                defaultValue={selectedMonth}
                className="bg-transparent text-sm font-bold !text-black outline-none px-2 py-1 cursor-pointer"
              />
              <button
                type="submit"
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 !text-white text-xs font-bold rounded-xl transition cursor-pointer"
              >
                กรองเดือน
              </button>
            </form>
          </div>

          {/* การ์ดสรุปยอดรวมประจำเดือน */}
          <div
            className={`grid grid-cols-1 sm:grid-cols-2 ${
              isSuperAdmin ? 'lg:grid-cols-4' : 'lg:grid-cols-2'
            } gap-5`}
          >
            {/* ยอดฝาก */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-500 uppercase">ยอดฝากรวมเดือนนี้</span>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl sm:text-3xl font-black !text-emerald-600">
                ฿{totalDeposit.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
              </p>
            </div>

            {/* ยอดถอน */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-500 uppercase">ยอดถอนรวมเดือนนี้</span>
                <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <TrendingDown className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl sm:text-3xl font-black !text-rose-600">
                ฿{totalWithdraw.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
              </p>
            </div>

            {/* ซ่อนค่าใช้จ่ายและกำไรสุทธิ ถ้าไม่ใช่ Super Admin */}
            {isSuperAdmin && (
              <>
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-slate-500 uppercase">ค่าใช้จ่ายรวมเดือนนี้</span>
                    <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                      <Wallet className="w-4 h-4" />
                    </div>
                  </div>
                  <p className="text-2xl sm:text-3xl font-black !text-amber-600">
                    ฿{totalExpenses.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                  </p>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-slate-500 uppercase">กำไรสุทธิประจำเดือน</span>
                    <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                      <DollarSign className="w-4 h-4" />
                    </div>
                  </div>
                  <p
                    className={`text-2xl sm:text-3xl font-black ${
                      netProfit >= 0 ? '!text-blue-600' : '!text-rose-600'
                    }`}
                  >
                    ฿{netProfit.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </>
            )}
          </div>

          {/* ตารางแสดงรายการแจกแจงรายวัน */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold !text-black">รายการประจำวัน ({selectedMonth})</h2>
                <p className="text-xs text-slate-400 mt-0.5">แสดงเรียงตามลำดับวันที่ล่าสุด</p>
              </div>
              <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                ทั้งหมด {records.length} รายการ
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-xs uppercase font-bold text-slate-700 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4">วันที่</th>
                    <th className="px-6 py-4">แบรนด์</th>
                    <th className="px-6 py-4 text-right">ยอดฝาก</th>
                    <th className="px-6 py-4 text-right">ยอดถอน</th>
                    {isSuperAdmin && <th className="px-6 py-4 text-right">ค่าใช้จ่าย</th>}
                    <th className="px-6 py-4">หมายเหตุ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {records.length === 0 ? (
                    <tr>
                      <td
                        colSpan={isSuperAdmin ? 6 : 5}
                        className="px-6 py-12 text-center text-slate-400 font-medium"
                      >
                        ไม่มีรายการบันทึกในเดือนนี้
                      </td>
                    </tr>
                  ) : (
                    records.map((r: any) => (
                      <tr key={r.id} className="hover:bg-slate-50/80 transition">
                        <td className="px-6 py-4 font-bold !text-black whitespace-nowrap">{r.date}</td>
                        <td className="px-6 py-4 font-bold !text-black">{r.brands?.name || '-'}</td>
                        <td className="px-6 py-4 text-right font-bold text-emerald-600 whitespace-nowrap">
                          {r.deposit ? `฿${Number(r.deposit).toLocaleString('th-TH', { minimumFractionDigits: 2 })}` : '-'}
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-rose-600 whitespace-nowrap">
                          {r.withdraw ? `฿${Number(r.withdraw).toLocaleString('th-TH', { minimumFractionDigits: 2 })}` : '-'}
                        </td>
                        {isSuperAdmin && (
                          <td className="px-6 py-4 text-right font-bold text-amber-600 whitespace-nowrap">
                            {r.expenses ? `฿${Number(r.expenses).toLocaleString('th-TH', { minimumFractionDigits: 2 })}` : '-'}
                          </td>
                        )}
                        <td className="px-6 py-4 text-slate-500 max-w-xs truncate">{r.notes || '-'}</td>
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