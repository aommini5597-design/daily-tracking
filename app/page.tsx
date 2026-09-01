export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { PlusCircle, Building2, LogOut, UserCheck } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()

  // 1. ตรวจสอบ User
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // 2. ตรวจสอบ Role จากตาราง profiles
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, email')
    .eq('id', user.id)
    .single()

  const isSuperAdmin = profile?.role === 'super_admin'

  // 3. ดึงข้อมูลบันทึกยอด
  const { data: recordsData } = await supabase
    .from('daily_records')
    .select('*, brands(name)')
    .order('date', { ascending: false })

  const records = recordsData || []

  // คำนวณสรุปยอด
  const totalDeposit = records.reduce((acc: number, r: any) => acc + (Number(r.deposit) || 0), 0)
  const totalWithdraw = records.reduce((acc: number, r: any) => acc + (Number(r.withdraw) || 0), 0)
  const totalExpenses = records.reduce((acc: number, r: any) => acc + (Number(r.expenses) || 0), 0)
  const netProfit = totalDeposit - totalWithdraw - totalExpenses

  // Server Action สำหรับ Logout
  async function handleLogout() {
    'use server'
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-bold !text-black">Dashboard สรุปภาพรวม</h1>
              <span
                className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                  isSuperAdmin
                    ? 'bg-purple-100 text-purple-700'
                    : 'bg-blue-100 text-blue-700'
                }`}
              >
                {isSuperAdmin ? 'Super Admin' : 'Admin'}
              </span>
            </div>
            <p className="text-slate-500 text-sm mt-1">ผู้ใช้งาน: {user.email}</p>
          </div>

          <div className="flex items-center gap-3">
            {/* ปุ่มจัดการแบรนด์ จะแสดงเฉพาะ Super Admin เท่านั้น */}
            {isSuperAdmin && (
              <Link
                href="/brands"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 !text-black font-semibold rounded-xl transition"
              >
                <Building2 className="w-4 h-4" />
                <span>จัดการแบรนด์</span>
              </Link>
            )}

            <Link
              href="/records"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 !text-white font-semibold rounded-xl transition shadow-md shadow-blue-500/20"
            >
              <PlusCircle className="w-4 h-4" />
              <span>บันทึกยอดรายวัน</span>
            </Link>

            <form action={handleLogout}>
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 font-semibold rounded-xl transition cursor-pointer"
                title="ออกจากระบบ"
              >
                <LogOut className="w-4 h-4" />
                <span>ออกจากระบบ</span>
              </button>
            </form>
          </div>
        </div>

        {/* กล่องสรุปตัวเลข 4 ช่อง */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <span className="text-sm font-semibold text-slate-500">ยอดฝากรวม (Deposit)</span>
            <p className="text-2xl font-bold !text-emerald-600 mt-2">
              ฿{totalDeposit.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <span className="text-sm font-semibold text-slate-500">ยอดถอนรวม (Withdraw)</span>
            <p className="text-2xl font-bold !text-rose-600 mt-2">
              ฿{totalWithdraw.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <span className="text-sm font-semibold text-slate-500">ค่าใช้จ่ายรวม (Expenses)</span>
            <p className="text-2xl font-bold !text-amber-600 mt-2">
              ฿{totalExpenses.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <span className="text-sm font-semibold text-slate-500">กำไรสุทธิ (Net Profit)</span>
            <p className={`text-2xl font-bold mt-2 ${netProfit >= 0 ? '!text-blue-600' : '!text-rose-600'}`}>
              ฿{netProfit.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        {/* ตารางประวัติบันทึกยอด */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h2 className="text-lg font-bold !text-black">ประวัติการบันทึกยอด</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs uppercase font-bold text-slate-700 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">วันที่</th>
                  <th className="px-6 py-4">แบรนด์</th>
                  <th className="px-6 py-4 text-right">ยอดฝาก</th>
                  <th className="px-6 py-4 text-right">ยอดถอน</th>
                  <th className="px-6 py-4 text-right">ค่าใช้จ่าย</th>
                  <th className="px-6 py-4">หมายเหตุ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {records.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                      ยังไม่มีรายการบันทึก
                    </td>
                  </tr>
                ) : (
                  records.map((r: any) => (
                    <tr key={r.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-6 py-4 font-medium !text-black">{r.date}</td>
                      <td className="px-6 py-4 font-semibold !text-black">{r.brands?.name || '-'}</td>
                      <td className="px-6 py-4 text-right font-medium text-emerald-600">
                        {r.deposit ? `฿${Number(r.deposit).toLocaleString('th-TH', { minimumFractionDigits: 2 })}` : '-'}
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-rose-600">
                        {r.withdraw ? `฿${Number(r.withdraw).toLocaleString('th-TH', { minimumFractionDigits: 2 })}` : '-'}
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-amber-600">
                        {r.expenses ? `฿${Number(r.expenses).toLocaleString('th-TH', { minimumFractionDigits: 2 })}` : '-'}
                      </td>
                      <td className="px-6 py-4 text-slate-500">{r.notes || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}