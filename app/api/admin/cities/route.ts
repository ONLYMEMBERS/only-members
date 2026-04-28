import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'

export async function POST(req: NextRequest) {
  try {
    const { name, slug, country } = await req.json()
    if (!name || !slug || !country) {
      return NextResponse.json({ error: 'Nombre, slug y país son requeridos.' }, { status: 400 })
    }
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('cities')
      .insert({ name: name.trim(), slug: slug.trim(), country: country.trim(), active: true })
      .select()
      .single()
    if (error) throw error
    return NextResponse.json({ city: data })
  } catch (err: any) {
    console.error('admin/cities POST:', err)
    return NextResponse.json({ error: err?.message ?? 'Error al agregar ciudad.' }, { status: 500 })
  }
}
