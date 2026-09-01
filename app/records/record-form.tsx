'use client'

import { useState } from 'react'
import { saveRecord } from '@/actions/records'
import { useRouter } from 'next/navigation'

export default function RecordForm({
  brands,
  isSuperAdmin,
}: {
  brands: { id: string; name: string }[]
  isSuperAdmin: boolean
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

  const today = new Date().toISOString().split('T')[0]

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setMsg(null)

    const formData = new FormData(e.currentTarget)
    const res = await saveRecord(formData)

    if (res?.error) {
      setMsg({ text: res.error, type: 'error' })
    } else {
      setMsg({ text: 'บันทึกข้อมูลเรียบร้อยแล้ว!', type: 'success' })
      setTimeout(() => router.push('/'), 1200)
    }
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {msg && (
        <div
          className={`p-3 rounded-lg text-sm text-center ${
            msg.type === 'success'
              ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
              : 'bg-rose-50 text-rose-600 border border-rose-200'
          }`}
        >
          {msg.text}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">วันที่</label>
        <input
          type="date"
          name="date"
          required
          defaultValue={today}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">เลือกแบรนด์</label>
        <select
          name="brand_id"
          required
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="">-- กรุณาเลือกแบรนด์ --</option>
          {brands.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">ยอดฝาก (Deposit)</label>
          <input
            type="number"
            step="0.01"
            name="deposit"
            required
            placeholder="0.00"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">ยอดถอน (Withdraw)</label>
          <input
            type="number"
            step="0.01"
            name="withdraw"
            required
            placeholder="0.00"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {isSuperAdmin && (
        <div>
          <label className="block text-sm font-medium text-amber-700 mb-1">
            ค่าใช้จ่าย (Expense) - เฉพาะ Super Admin
          </label>
          <input
            type="number"
            step="0.01"
            name="expense"
            placeholder="0.00"
            className="w-full px-3 py-2 border border-amber-300 bg-amber-50/40 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition duration-200 disabled:opacity-50 mt-4"
      >
        {loading ? 'กำลังบันทึก...' : 'บันทึกยอดเงิน'}
      </button>
    </form>
  )
}