'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createDailyRecord(formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'กรุณาเข้าสู่ระบบก่อนทำรายการ' }
  }

  const date = formData.get('date') as string
  const brand_id = formData.get('brand_id') as string
  const revenue = parseFloat(formData.get('revenue') as string) || 0

  const ads_expense = parseFloat(formData.get('ads_expense') as string) || 0
  const fee_expense = parseFloat(formData.get('fee_expense') as string) || 0
  const shipping_expense = parseFloat(formData.get('shipping_expense') as string) || 0
  const labor_expense = parseFloat(formData.get('labor_expense') as string) || 0
  const other_expense = parseFloat(formData.get('other_expense') as string) || 0

  const total_expenses = ads_expense + fee_expense + shipping_expense + labor_expense + other_expense
  const notes = (formData.get('notes') as string) || null

  const { error } = await supabase.from('daily_records').insert([
    {
      date,
      brand_id,
      revenue,
      expenses: total_expenses,
      ads_expense,
      fee_expense,
      shipping_expense,
      labor_expense,
      other_expense,
      notes,
      created_by: user.id,
    },
  ])

  if (error) {
    console.error('Error inserting record:', error)
    return { error: 'ไม่สามารถบันทึกข้อมูลได้: ' + error.message }
  }

  revalidatePath('/records')
  revalidatePath('/')
  return { success: true }
}

export async function getBrands() {
  const supabase = await createClient()
  const { data, error } = await supabase.from('brands').select('id, name').order('name')
  if (error) {
    console.error('Error fetching brands:', error)
    return []
  }
  return data || []
}

export async function getDailyRecords() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('daily_records')
    .select('*, brands(name)')
    .order('date', { ascending: false })

  if (error) {
    console.error('Error fetching records:', error)
    return []
  }
  return data || []
}