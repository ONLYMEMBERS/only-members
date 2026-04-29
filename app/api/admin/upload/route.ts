import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const formData = await req.formData()
    const file = formData.get('file') as File
    const folder = (formData.get('folder') as string) || 'covers'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const ext = file.name.split('.').pop()
    const filename = `${folder}/${Date.now()}.${ext}`

    const arrayBuffer = await file.arrayBuffer()
    const buffer = new Uint8Array(arrayBuffer)

    const { error } = await supabase.storage
      .from('event-images')
      .upload(filename, buffer, {
        contentType: file.type,
        upsert: true
      })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const { data: { publicUrl } } = supabase.storage
      .from('event-images')
      .getPublicUrl(filename)

    return NextResponse.json({ url: publicUrl })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
