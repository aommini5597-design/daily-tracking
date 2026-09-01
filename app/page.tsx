import { getDailyRecords } from '@/actions/records'
import { DollarSign, ArrowDownRight, ArrowUpRight, ReceiptText } from 'lucide-react'
import Link from 'next/link'

export default async function DashboardPage() {
  const { records, isSuperAdmin } = await getDailyRecords()

  const totalDeposit = records?.reduce((acc, curr: any) => acc + Number(curr.deposit || 0), 0) || 0
  const totalWithdraw = records?.reduce((acc, curr: any) => acc + Number(curr.withdraw || 0), 0) || 0
  const totalProfit = records?.reduce((acc, curr: any) => acc + Number(curr.profit || 0), 0) || 0
  const totalExpense = isSuperAdmin
    ? records?.reduce((acc, curr: any) => acc + Number(curr.expense || 0), 0) || 0
    : 0

  return (
    <main className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header Section พร้อมปุ่ม + บันทึกยอดรายวัน */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Daily Tracking Dashboard</h1>
            <span className="inline-block mt-1 text-xs px-2.5 py-0.5 bg-slate-200 text-slate-700 rounded-full font-semibold">
              Role: {isSuperAdmin ? 'Super Admin' : 'Admin'}
            </span>
          </div>
         <div className="flex items-center gap-3">
  {isSuperAdmin && (
    <Link
      href="/brands"
      className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium px-4 py-2 rounded-lg transition"
    >
      จัดการแบรนด์
    </Link>
  )}
  <Link
    href="/records"
    className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
  >
    + บันทึกยอดรายวัน
  </Link>
</div>
        </div>

        {/* Cards Summary */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-center text-slate-500 mb-2">
              <span className="text-sm font-medium">Total Deposit</span>
              <ArrowDownRight className="w-5 h-5 text-emerald-500" />
            </div>
            <div className="text-2xl font-bold text-slate-900">฿{totalDeposit.toLocaleString()}</div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-center text-slate-500 mb-2">
              <span className="text-sm font-medium">Total Withdraw</span>
              <ArrowUpRight className="w-5 h-5 text-rose-500" />
            </div>
            <div className="text-2xl font-bold text-slate-900">฿{totalWithdraw.toLocaleString()}</div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-center text-slate-500 mb-2">
              <span className="text-sm font-medium">Total Profit</span>
              <DollarSign className="w-5 h-5 text-blue-500" />
            </div>
            <div className="text-2xl font-bold text-slate-900">฿{totalProfit.toLocaleString()}</div>
          </div>

          {isSuperAdmin && (
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex justify-between items-center text-slate-500 mb-2">
                <span className="text-sm font-medium">Total Expense</span>
                <ReceiptText className="w-5 h-5 text-amber-500" />
              </div>
              <div className="text-2xl font-bold text-slate-900">฿{totalExpense.toLocaleString()}</div>
            </div>
          )}
        </div>

        {/* Table Records */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold text-slate-800">Recent Records</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-medium">Date</th>
                  <th className="px-5 py-3 font-medium">Brand</th>
                  <th className="px-5 py-3 font-medium">Deposit</th>
                  <th className="px-5 py-3 font-medium">Withdraw</th>
                  <th className="px-5 py-3 font-medium">Profit</th>
                  {isSuperAdmin && <th className="px-5 py-3 font-medium">Expense</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {records.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-slate-400">
                      ยังไม่มีข้อมูลยอดบันทึกในระบบ
                    </td>
                  </tr>
                ) : (
                  records.map((row: any) => (
                    <tr key={row.id} className="hover:bg-slate-50 transition">
                      <td className="px-5 py-3 text-slate-600">{row.date}</td>
                      <td className="px-5 py-3 font-medium text-slate-900">{row.brand?.name || '-'}</td>
                      <td className="px-5 py-3 text-emerald-600 font-medium">฿{Number(row.deposit).toLocaleString()}</td>
                      <td className="px-5 py-3 text-rose-600 font-medium">฿{Number(row.withdraw).toLocaleString()}</td>
                      <td className="px-5 py-3 font-semibold text-slate-900">฿{Number(row.profit).toLocaleString()}</td>
                      {isSuperAdmin && (
                        <td className="px-5 py-3 text-amber-600 font-medium">฿{Number(row.expense || 0).toLocaleString()}</td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  )
}