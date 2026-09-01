'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// ตรวจสอบว่าเป็น Super Admin หรือไม่
async function verifySuperAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  return profile?.role === 'super_admin'
}

// 1. ดึงรายชื่อแบรนด์ทั้งหมด
export async function getBrandsList() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('brands')
    .select('id, name, created_at')
    .order('created_at', { ascending: false })

  if (error) return []
  return data || []
}

// 2. เพิ่มแบรนด์ใหม่
export async function addBrand(formData: FormData) {
  const isSuper = await verifySuperAdmin()
  if (!isSuper) return { error: 'คุณไม่มีสิทธิ์ในการจัดการแบรนด์ (Super Admin Only)' }

  const name = (formData.get('name') as string)?.trim()
  if (!name) return { error: 'กรุณากรอกชื่อแบรนด์' }

  const supabase = await createClient()
  const { error } = await supabase.from('brands').insert([{ name }])

  if (error) {
    if (error.code === '23505') {
      return { error: 'ชื่อแบรนด์นี้มีอยู่ในระบบแล้ว' }
    }
    return { error: error.message }
  }

  revalidatePath('/brands')
  revalidatePath('/records')
  revalidatePath('/')
  return { success: true }
}

// 3. ลบแบรนด์
export async function deleteBrand(brandId: string) {
  const isSuper = await verifySuperAdmin()
  if (!isSuper) return { error: 'คุณไม่มีสิทธิ์ในการจัดการแบรนด์ (Super Admin Only)' }

  const supabase = await createClient()
  const { error } = await supabase.from('brands').delete().eq('id', brandId)

  if (error) return { error: error.message }

  revalidatePath('/brands')
  revalidatePath('/records')
  revalidatePath('/')
  return { success: true }
}