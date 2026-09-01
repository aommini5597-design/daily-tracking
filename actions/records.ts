'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getDailyRecords() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let isSuperAdmin = false

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    isSuperAdmin = profile?.role === 'super_admin'
  }

  const { data, error } = await supabase
    .from('daily_records')
    .select(`
      id,
      date,
      deposit,
      withdraw,
      profit,
      ${isSuperAdmin ? 'expense,' : ''}
      brand:brands(id, name)
    `)
    .order('date', { ascending: false })

  if (error) return { records: [], isSuperAdmin }
  return { records: data || [], isSuperAdmin }
}

export async function getBrands() {
  const supabase = await createClient()
  const { data } = await supabase.from('brands').select('id, name').order('name')
  return data || []
}

export async function saveRecord(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'กรุณาเข้าสู่ระบบก่อนทำรายการ' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const isSuperAdmin = profile?.role === 'super_admin'

  const date = formData.get('date') as string
  const brand_id = formData.get('brand_id') as string
  const deposit = parseFloat(formData.get('deposit') as string) || 0
  const withdraw = parseFloat(formData.get('withdraw') as string) || 0
  const expense = isSuperAdmin ? (parseFloat(formData.get('expense') as string) || 0) : 0

  const payload: any = {
    date,
    brand_id,
    deposit,
    withdraw,
    created_by: user.id,
  }

  if (isSuperAdmin) {
    payload.expense = expense
  }

  const { error } = await supabase
    .from('daily_records')
    .upsert(payload, { onConflict: 'date,brand_id' })

  if (error) return { error: error.message }

  revalidatePath('/')
  revalidatePath('/records')
  return { success: true }
}