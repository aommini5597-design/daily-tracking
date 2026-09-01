export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getBrands } from '@/actions/records'
import RecordForm from './record-form'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default async function RecordsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const brands = await getBrands()

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-2xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-slate-600 hover:text-black mb-6 font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>กลับหน้า Dashboard</span>
        </Link>

        <RecordForm brands={brands as any} />
      </div>
    </div>
  )
}