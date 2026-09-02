import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const date = searchParams.get('date')?.trim() || ''
  const month = searchParams.get('month')?.trim() || ''
  const brand_id = searchParams.get('brand_id')?.trim() || ''

  const supabase = await createClient()

  // 1. ตรวจสอบสิทธิ์ผู้ใช้
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const isSuperAdmin = profile?.role === 'super_admin'

  // 2. Query ข้อมูลตามเงื่อนไขที่เลือก
  let query = supabase
    .from('daily_records')
    .select('*, brands(name)')
    .order('date', { ascending: true })

  if (date) {
    query = query.eq('date', date)
  } else if (month) {
    const [year, m] = month.split('-').map(Number)
    if (year && m) {
      const startDate = `${month}-01`
      const lastDay = new Date(year, m, 0).getDate()
      const endDate = `${month}-${String(lastDay).padStart(2, '0')}`
      query = query.gte('date', startDate).lte('date', endDate)
    }
  }

  if (brand_id) {
    query = query.eq('brand_id', brand_id)
  }

  const { data: records } = await query
  const rows = records || []

  // 3. จัดทำส่วนหัวคอลัมน์ CSV
  const headers = ['วันที่', 'แบรนด์', 'ยอดฝาก', 'ยอดถอน']
  if (isSuperAdmin) {
    headers.push('ค่าแอด', 'ค่าคอม/ธรรมเนียม', 'ค่าระบบ/เซิร์ฟ', 'ค่าจ้าง', 'ค่าใช้จ่ายอื่นๆ', 'รวมค่าใช้จ่าย')
  }
  headers.push('หมายเหตุ')

  const csvRows: string[] = []
  csvRows.push(headers.join(','))

  // 4. แปลงข้อมูลแถวเป็น CSV (ใส่ Double Quotes ครอบข้อความเพื่อป้องกันลูกน้ำในข้อความ)
  rows.forEach((r: any) => {
    const row = [
      `"${r.date || ''}"`,
      `"${r.brands?.name || ''}"`,
      Number(r.deposit || 0).toFixed(2),
      Number(r.withdraw || 0).toFixed(2),
    ]

    if (isSuperAdmin) {
      row.push(
        Number(r.ads_expense || 0).toFixed(2),
        Number(r.fee_expense || 0).toFixed(2),
        Number(r.shipping_expense || 0).toFixed(2),
        Number(r.labor_expense || 0).toFixed(2),
        Number(r.other_expense || 0).toFixed(2),
        Number(r.expenses || 0).toFixed(2)
      )
    }

    row.push(`"${(r.notes || '').replace(/"/g, '""')}"`)
    csvRows.push(row.join(','))
  })

  // ใส่ UTF-8 BOM (\uFEFF) เพื่อให้ Excel เปิดภาษาไทยได้โดยตรง
  const csvContent = '\uFEFF' + csvRows.join('\r\n')
  const fileName = `financial-report-${month || date || 'all'}.csv`

  return new NextResponse(csvContent, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${fileName}"`,
    },
  })
}