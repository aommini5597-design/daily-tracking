export const dynamic = 'force-dynamic'
import { getBrands, getDailyRecords } from '@/actions/records'
import RecordForm from './record-form'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default async function RecordsPage() {
  const brands = await getBrands()
  const { isSuperAdmin } = await getDailyRecords()

  return (
    <main className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-xl mx-auto space-y-6">
        <Link
          href="/"
          className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-800 transition"
        >
          <ArrowLeft className="w-4 h-4 mr-1" /> กลับหน้า Dashboard
        </Link>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h1 className="text-xl font-bold text-slate-800 mb-1">บันทึกยอดรายวัน</h1>
          <p className="text-sm text-slate-500 mb-6">กรอกข้อมูลยอดเงินประจำวันตามแบรนด์</p>

          <RecordForm brands={brands} isSuperAdmin={isSuperAdmin} />
        </div>
      </div>
    </main>
  )
}