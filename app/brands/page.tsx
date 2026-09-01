import { getBrandsList } from '@/actions/brands'
import { getDailyRecords } from '@/actions/records'
import BrandManager from './brand-manager'
import Link from 'next/link'
import { ArrowLeft, ShieldAlert } from 'lucide-react'

export default async function BrandsPage() {
  const { isSuperAdmin } = await getDailyRecords()
  const brands = await getBrandsList()

  // ป้องกันกรณี User ทั่วไปเข้ามา
  if (!isSuperAdmin) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center max-w-md shadow-sm">
          <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-slate-800 mb-2">จำกัดสิทธิ์การเข้าถึง</h1>
          <p className="text-sm text-slate-500 mb-6">
            หน้านี้สงวนสิทธิ์สำหรับ Super Admin เท่านั้น
          </p>
          <Link
            href="/"
            className="inline-block bg-slate-800 text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-slate-900 transition"
          >
            กลับหน้า Dashboard
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <Link
          href="/"
          className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-800 transition"
        >
          <ArrowLeft className="w-4 h-4 mr-1" /> กลับหน้า Dashboard
        </Link>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h1 className="text-xl font-bold text-slate-800 mb-1">จัดการรายชื่อแบรนด์</h1>
          <p className="text-sm text-slate-500 mb-6">
            เพิ่มแบรนด์ใหม่ หรือลบแบรนด์ที่ไม่ใช้งานออกจากระบบ
          </p>

          <BrandManager initialBrands={brands} />
        </div>
      </div>
    </main>
  )
}