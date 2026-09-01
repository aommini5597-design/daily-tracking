'use client'

import { useState } from 'react'
import { createDailyRecord } from '@/actions/records'
import { PlusCircle, Loader2, CheckCircle2 } from 'lucide-react'

interface Brand {
  id: string
  name: string
}

export default function RecordForm({ brands }: { brands: Brand[] }) {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [revenue, setRevenue] = useState<number | ''>('')
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

  const netProfit = (Number(revenue) || 0) - totalExpenses

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
        setRevenue('')
        setAdsExpense('')
        setFeeExpense('')
        setShippingExpense('')
        setLaborExpense('')
        setOtherExpense('')
        setTimeout(() => setSuccess(false), 4000)
      }
    } catch (err: any) {
      setError(err?.message || 'เกิดข้อผิดพลาดในการบันทึก')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle =
    'w-full px-4 py-2.5 bg-white text-black font-medium placeholder:text-gray-400 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition shadow-sm'

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
      <div className="flex items-center justify-between pb-6 mb-6 border-b border-slate-100">
        <div>
          <h2 className="text-xl font-bold text-black">ฟอร์มบันทึกยอดประจำวัน</h2>
          <p className="text-sm text-slate-600 mt-1">กรอกข้อมูลรายรับและค่าใช้จ่ายแยกตามหมวดหมู่</p>
        </div>
      </div>

      {success && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-emerald-800 text-sm font-medium">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>บันทึกข้อมูลเรียบร้อยแล้ว</span>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-sm font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-semibold text-black mb-2">
              วันที่บันทึก <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              name="date"
              required
              defaultValue={new Date().toISOString().split('T')[0]}
              className={inputStyle}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-black mb-2">
              เลือกแบรนด์ <span className="text-rose-500">*</span>
            </label>
            <select name="brand_id" required defaultValue="" className={inputStyle}>
              <option value="" disabled>
                -- กรุณาเลือกแบรนด์ --
              </option>
              {brands.map((brand) => (
                <option key={brand.id} value={brand.id} className="text-black">
                  {brand.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-black mb-2">
            ยอดขายรวม (บาท) <span className="text-rose-500">*</span>
          </label>
          <input
            type="number"
            step="0.01"
            name="revenue"
            required
            placeholder="0.00"
            value={revenue}
            onChange={(e) => setRevenue(e.target.value === '' ? '' : Number(e.target.value))}
            className={`${inputStyle} text-lg font-bold text-blue-600`}
          />
        </div>

        <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-black flex items-center gap-2">
              <span>💳 แยกหมวดหมู่ค่าใช้จ่าย</span>
            </h3>
            <span className="text-xs text-slate-600 bg-white px-2.5 py-1 rounded-md border border-slate-200 font-medium">
              ใส่ 0 หากไม่มี
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-black mb-1.5">
                📢 ค่าโฆษณา / แอด (บาท)
              </label>
              <input
                type="number"
                step="0.01"
                name="ads_expense"
                placeholder="0.00"
                value={adsExpense}
                onChange={(e) => setAdsExpense(e.target.value === '' ? '' : Number(e.target.value))}
                className={inputStyle}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-black mb-1.5">
                🏷️ ค่าธรรมเนียม / คอมมิชชั่น (บาท)
              </label>
              <input
                type="number"
                step="0.01"
                name="fee_expense"
                placeholder="0.00"
                value={feeExpense}
                onChange={(e) => setFeeExpense(e.target.value === '' ? '' : Number(e.target.value))}
                className={inputStyle}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-black mb-1.5">
                📦 ค่าระบบ (บาท)
              </label>
              <input
                type="number"
                step="0.01"
                name="shipping_expense"
                placeholder="0.00"
                value={shippingExpense}
                onChange={(e) => setShippingExpense(e.target.value === '' ? '' : Number(e.target.value))}
                className={inputStyle}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-black mb-1.5">
                👥 เงินเดือน / OT (บาท)
              </label>
              <input
                type="number"
                step="0.01"
                name="labor_expense"
                placeholder="0.00"
                value={laborExpense}
                onChange={(e) => setLaborExpense(e.target.value === '' ? '' : Number(e.target.value))}
                className={inputStyle}
              />
            </div>

            <div className="sm:col-span-2 lg:col-span-2">
              <label className="block text-xs font-semibold text-black mb-1.5">
                🧩 ค่าใช้จ่ายอื่นๆ (บาท)
              </label>
              <input
                type="number"
                step="0.01"
                name="other_expense"
                placeholder="0.00"
                value={otherExpense}
                onChange={(e) => setOtherExpense(e.target.value === '' ? '' : Number(e.target.value))}
                className={inputStyle}
              />
            </div>
          </div>

          <div className="pt-3 mt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4 text-sm">
            <div>
              <span className="text-black font-medium">รวมค่าใช้จ่ายทั้งหมด: </span>
              <span className="text-base font-bold text-rose-600">
                ฿{totalExpenses.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div>
              <span className="text-black font-medium">กำไรสุทธิคำนวณสด: </span>
              <span className={`text-base font-bold ${netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                ฿{netProfit.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-black mb-2">
            หมายเหตุเพิ่มเติม (ถ้ามี)
          </label>
          <textarea
            name="notes"
            rows={2}
            placeholder="ระบุรายละเอียดเพิ่มเติม..."
            className={inputStyle}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 px-6 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold rounded-xl transition shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 cursor-pointer"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>กำลังบันทึกข้อมูล...</span>
            </>
          ) : (
            <>
              <PlusCircle className="w-5 h-5" />
              <span>บันทึกยอดประจำวัน</span>
            </>
          )}
        </button>
      </form>
    </div>
  )
}