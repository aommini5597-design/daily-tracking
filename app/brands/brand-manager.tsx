'use client'

import { useState } from 'react'
import { addBrand, deleteBrand } from '@/actions/brands'
import { Trash2, Plus, Building2 } from 'lucide-react'

export default function BrandManager({
  initialBrands,
}: {
  initialBrands: { id: string; name: string; created_at: string }[]
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleAddBrand(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const form = e.currentTarget
    const formData = new FormData(form)
    const res = await addBrand(formData)

    if (res?.error) {
      setError(res.error)
    } else {
      form.reset()
    }
    setLoading(false)
  }

  async function handleDelete(id: string, name: string) {
    const confirm = window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบแบรนด์ "${name}"?`)
    if (!confirm) return

    setLoading(true)
    setError(null)
    const res = await deleteBrand(id)
    if (res?.error) {
      setError(res.error)
    }
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-600 rounded-lg text-sm text-center">
          {error}
        </div>
      )}

      {/* Form เพิ่มแบรนด์ */}
      <form onSubmit={handleAddBrand} className="flex gap-2">
        <input
          name="name"
          type="text"
          required
          placeholder="กรอกชื่อแบรนด์ใหม่ เช่น Brand Delta"
          className="flex-1 px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2.5 rounded-lg transition duration-200 flex items-center gap-1 text-sm disabled:opacity-50"
        >
          <Plus className="w-4 h-4" /> เพิ่มแบรนด์
        </button>
      </form>

      {/* รายการแบรนด์ */}
      <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 overflow-hidden">
        {initialBrands.length === 0 ? (
          <div className="p-6 text-center text-slate-400 text-sm">
            ยังไม่มีรายชื่อแบรนด์ในระบบ
          </div>
        ) : (
          initialBrands.map((b) => (
            <div
              key={b.id}
              className="p-4 flex items-center justify-between hover:bg-slate-50 transition"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-semibold text-slate-800 text-sm">{b.name}</p>
                  <p className="text-xs text-slate-400">
                    สร้างเมื่อ: {new Date(b.created_at).toLocaleDateString('th-TH')}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleDelete(b.id, b.name)}
                disabled={loading}
                className="text-slate-400 hover:text-rose-600 p-2 rounded-lg hover:bg-rose-50 transition disabled:opacity-50"
                title="ลบแบรนด์"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}