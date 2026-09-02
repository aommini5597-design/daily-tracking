export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Sidebar from '../components/sidebar'
import { Building2, Calendar, RotateCcw, TrendingUp, TrendingDown, Wallet, DollarSign } from 'lucide-react'

export default async function BrandsSummaryPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; date?: string }>
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
    .select('role, email')
    .eq('id', user.id)
    .single()

  const isSuperAdmin = profile?.role === 'super_admin'

  // 2. รับค่าตัวกรองวัน / เดือน
  const resolvedParams = await searchParams
  const selectedDate = resolvedParams?.date?.trim() || ''
  const selectedMonth = resolvedParams?.month?.trim() || ''

  // 3. ดึงรายชื่อแบรนด์ทั้งหมด
  const { data: brandsData } = await supabase.from('brands').select('id, name').order('name')
  const brands = brandsData || []

  // 4. Query บันทึกข้อมูลตามช่วงเวลา
  let query = supabase.from('daily_records').select('*')

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

  const { data: recordsData } = await query
  const records = recordsData || []

  // 5. คำนวณจัดกลุ่มสรุปยอดตามแต่ละแบรนด์
  const brandStats = brands.map((brand) => {
    const brandRecords = records.filter((r) => r.brand_id === brand.id)
    const deposit = brandRecords.reduce((acc, r) => acc + (Number(r.deposit) || 0), 0)
    const withdraw = brandRecords.reduce((acc, r) => acc + (Number(r.withdraw) || 0), 0)
    const expenses = brandRecords.reduce((acc, r) => acc + (Number(r.expenses) || 0), 0)
    const ads = brandRecords.reduce((acc, r) => acc + (Number(r.ads_expense) || 0), 0)
    const fee = brandRecords.reduce((acc, r) => acc + (Number(r.fee_expense) || 0), 0)
    const server = brandRecords.reduce((acc, r) => acc + (Number(r.shipping_expense) || 0), 0)
    const labor = brandRecords.reduce((acc, r) => acc + (Number(r.labor_expense) || 0), 0)
    const other = brandRecords.reduce((acc, r) => acc + (Number(r.other_expense) || 0), 0)
    const profit = deposit - withdraw - expenses

    return {
      id: brand.id,
      name: brand.name,
      count: brandRecords.length,
      deposit,
      withdraw,
      expenses,
      ads,
      fee,
      server,
      labor,
      other,
      profit,
    }
  })

  // สรุปยอดรวมใหญ่ทุกแบรนด์
  const grandDeposit = brandStats.reduce((acc, b) => acc + b.deposit, 0)
  const grandWithdraw = brandStats.reduce((acc, b) => acc + b.withdraw, 0)
  const grandExpenses = brandStats.reduce((acc, b) => acc + b.expenses, 0)
  const grandProfit = grandDeposit - grandWithdraw - grandExpenses

  const filterLabel = selectedDate
    ? `แสดงข้อมูลประจำวันที่ ${selectedDate}`
    : selectedMonth
    ? `แสดงข้อมูลประจำเดือน ${selectedMonth}`
    : 'แสดงข้อมูลทั้งหมดทุกช่วงเวลา'

  async function handleLogout() {
    'use server'
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar userEmail={user.email} role={profile?.role} onLogout={handleLogout} />

      <main className="flex-1 p-4 sm:p-8 md:p-10 overflow-y-auto max-w-7xl">
        <div className="space-y-8 mt-12 md:mt-0">
          {/* Header & Filter Bar */}
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold !text-black flex items-center gap-2.5">
                <Building2 className="w-8 h-8 text-blue-600" />
                <span>สรุปยอดแยกตามแบรนด์</span>
              </h1>
              <p className="text-blue-600 font-semibold text-sm mt-1">{filterLabel}</p>
            </div>

            {/* กล่องเลือกกรองวัน / เดือน */}
            <form method="get" className="flex flex-wrap items-center gap-2">
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
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 !text-white text-xs font-bold rounded-2xl transition cursor-pointer shadow-sm"
              >
                กรองข้อมูล
              </button>

              {(selectedDate || selectedMonth) && (
                <a
                  href="/brands-summary"
                  className="inline-flex items-center gap-1 px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-2xl transition"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>ล้างตัวกรอง</span>
                </a>
              )}
            </form>
          </div>

          {/* การ์ดแยกแต่ละแบรนด์ (Brand Cards) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {brandStats.map((b) => (
              <div
                key={b.id}
                className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4 hover:shadow-md transition"
              >
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 font-bold flex items-center justify-center text-sm">
                      {b.name.charAt(0).toUpperCase()}
                    </div>
                    <h3 className="font-bold text-lg !text-black">{b.name}</h3>
                  </div>
                  <span className="text-xs font-semibold text-slate-400 bg-slate-50 px-2.5 py-1 rounded-full">
                    {b.count} รายการ
                  </span>
                </div>

                <div className="space-y-2.5 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 flex items-center gap-1">
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-600" /> ยอดฝาก:
                    </span>
                    <span className="font-bold text-emerald-600">
                      ฿{b.deposit.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 flex items-center gap-1">
                      <TrendingDown className="w-3.5 h-3.5 text-rose-600" /> ยอดถอน:
                    </span>
                    <span className="font-bold text-rose-600">
                      ฿{b.withdraw.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  {isSuperAdmin && (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 flex items-center gap-1">
                          <Wallet className="w-3.5 h-3.5 text-amber-600" /> ค่าใช้จ่าย:
                        </span>
                        <span className="font-bold text-amber-600">
                          ฿{b.expenses.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                        </span>
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
                        <span className="font-bold !text-black flex items-center gap-1">
                          <DollarSign className="w-3.5 h-3.5 text-blue-600" /> กำไรสุทธิ:
                        </span>
                        <span
                          className={`font-black text-base ${
                            b.profit >= 0 ? '!text-blue-600' : '!text-rose-600'
                          }`}
                        >
                          ฿{b.profit.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* ตารางเปรียบเทียบภาพรวมทุกแบรนด์ */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold !text-black">ตารางเปรียบเทียบผลประกอบการรายแบรนด์</h2>
                <p className="text-xs text-slate-400 mt-0.5">วิเคราะห์เจาะลึกยอดเงินและค่าใช้จ่ายของแต่ละแบรนด์</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-xs uppercase font-bold text-slate-700 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4">ชื่อแบรนด์</th>
                    <th className="px-6 py-4 text-right">ยอดฝาก</th>
                    <th className="px-6 py-4 text-right">ยอดถอน</th>
                    {isSuperAdmin && (
                      <>
                        <th className="px-6 py-4 text-right">ค่าแอด</th>
                        <th className="px-6 py-4 text-right">ค่าใช้จ่ายรวม</th>
                        <th className="px-6 py-4 text-right">กำไรสุทธิ</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {brandStats.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50/80 transition font-medium">
                      <td className="px-6 py-4 font-bold !text-black">{b.name}</td>
                      <td className="px-6 py-4 text-right font-bold text-emerald-600 whitespace-nowrap">
                        ฿{b.deposit.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-rose-600 whitespace-nowrap">
                        ฿{b.withdraw.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                      </td>
                      {isSuperAdmin && (
                        <>
                          <td className="px-6 py-4 text-right text-slate-600 whitespace-nowrap">
                            ฿{b.ads.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-6 py-4 text-right font-bold text-amber-600 whitespace-nowrap">
                            ฿{b.expenses.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                          </td>
                          <td
                            className={`px-6 py-4 text-right font-black whitespace-nowrap ${
                              b.profit >= 0 ? '!text-blue-600' : '!text-rose-600'
                            }`}
                          >
                            ฿{b.profit.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                  {/* แถวยอดรวมทั้งหมด (Grand Total) */}
                  <tr className="bg-slate-50/80 font-black border-t-2 border-slate-200">
                    <td className="px-6 py-4 !text-black">รวมทุกแบรนด์</td>
                    <td className="px-6 py-4 text-right text-emerald-600 whitespace-nowrap">
                      ฿{grandDeposit.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 text-right text-rose-600 whitespace-nowrap">
                      ฿{grandWithdraw.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                    </td>
                    {isSuperAdmin && (
                      <>
                        <td className="px-6 py-4 text-right text-slate-500">-</td>
                        <td className="px-6 py-4 text-right text-amber-600 whitespace-nowrap">
                          ฿{grandExpenses.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                        </td>
                        <td
                          className={`px-6 py-4 text-right whitespace-nowrap ${
                            grandProfit >= 0 ? '!text-blue-600' : '!text-rose-600'
                          }`}
                        >
                          ฿{grandProfit.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                        </td>
                      </>
                    )}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}