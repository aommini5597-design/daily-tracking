'use client'

import { useState } from 'react'
import { createDailyRecord } from '@/actions/records'
import { Loader2 } from 'lucide-react'

interface Brand {
  id: string
  name: string
}

export default function RecordForm({
  brands,
  isSuperAdmin = false,
}: {
  brands: Brand[]
  isSuperAdmin?: boolean
}) {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [adsExpense, setAdsExpense] = useState<number | ''>('')
  const [feeExpense, setFeeExpense] = useState<number | ''>('')
  const [shippingExpense, setShippingExpense] = useState<number | ''>('')
  const [laborExpense, setLaborExpense] = useState<number | ''>('')
  const [otherExpense, setOtherExpense] = useState<number | ''>('')

  const totalExpenses =
    (Number(adsExpense) || 0) +
    (Number(feeExpense) || 0) +
    (Number(shippingExpense) || 0) +
    (Number(laborExpense) || 0) +
    (Number(otherExpense) || 0)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    const formData = new FormData(e.currentTarget)

    try {
      const res = await createDailyRecord(formData)
      if (res?.error) {
        setError(res.error)
      } else {
        setSuccess(true)
        e.currentTarget.reset()
        setAdsExpense('')
        setFeeExpense('')
        setShippingExpense('')
        setLaborExpense('')
        setOtherExpense('')
        setTimeout(() => setSuccess(false), 4000)
      }
    } catch (err: any) {
      setError(err?.message || 'เกิดข้อผิดพลาด')
    } finally {
      setLoading(false)
    }
  }

  const inputClass =
    'w-full px-4 py-3 bg-white !text-black placeholder:text-gray-400 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition'

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 max-w-2xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold !text-black">บันทึกยอดรายวัน</h2>
        <p className="text-slate-500 text-sm mt-1">กรอกข้อมูลยอดเงินและค่าใช้จ่ายประจำวันตามแบรนด์</p>
      </div>

      {success && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm font-semibold">
          ✓ บันทึกข้อมูลเรียบร้อยแล้ว
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-sm font-semibold">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
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
            {brands.map((brand) => (
              <option key={brand.id} value={brand.id} className="!text-black">
                {brand.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

        {/* กล่องหมวดหมู่ค่าใช้จ่าย */}
        <div className="p-5 bg-amber-50/60 rounded-2xl border border-amber-200 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-amber-950">
              ค่าใช้จ่าย (Expense) - แยกตามหมวดหมู่
            </span>
            <span className="text-xs font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
              รวม: ฿{totalExpenses.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold !text-black mb-1">📢 ค่าโฆษณา / Ads</label>
              <input
                type="number"
                step="0.01"
                name="ads_expense"
                placeholder="0.00"
                value={adsExpense}
                onChange={(e) => setAdsExpense(e.target.value === '' ? '' : Number(e.target.value))}
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
                value={feeExpense}
                onChange={(e) => setFeeExpense(e.target.value === '' ? '' : Number(e.target.value))}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-bold !text-black mb-1">📦 ค่าส่ง / พัสดุ</label>
              <input
                type="number"
                step="0.01"
                name="shipping_expense"
                placeholder="0.00"
                value={shippingExpense}
                onChange={(e) => setShippingExpense(e.target.value === '' ? '' : Number(e.target.value))}
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
                value={laborExpense}
                onChange={(e) => setLaborExpense(e.target.value === '' ? '' : Number(e.target.value))}
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
                value={otherExpense}
                onChange={(e) => setOtherExpense(e.target.value === '' ? '' : Number(e.target.value))}
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
          disabled={loading}
          className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 !text-white font-bold rounded-xl transition shadow-md cursor-pointer flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>กำลังบันทึก...</span>
            </>
          ) : (
            <span>บันทึกยอดเงิน</span>
          )}
        </button>
      </form>
    </div>
  )
}