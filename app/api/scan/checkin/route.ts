import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'

export async function POST(req: NextRequest) {
  try {
    const { qrValue, eventId, scannerEmail, scannerName } = await req.json()

    if (!qrValue || !eventId) {
      return NextResponse.json({ valid: false, result: 'invalid', message: 'Datos incompletos' })
    }

    const admin = createAdminClient()

    // Decode QR
    let decoded: any = null
    try {
      decoded = JSON.parse(atob(qrValue))
    } catch {
      try {
        decoded = JSON.parse(decodeURIComponent(escape(atob(qrValue))))
      } catch {
        return NextResponse.json({ valid: false, result: 'invalid', message: 'QR Inválido' })
      }
    }

    const isMember = decoded.type === 'member'
    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)

    let attendeeData: {
      id: string
      name: string
      email: string
      dni?: string
      event_id: string
    } | null = null

    if (isMember) {
      // Look up in member_list
      const { data: member } = await admin
        .from('member_list')
        .select('id, name, email, event_id')
        .eq('id', decoded.id)
        .maybeSingle()

      if (!member) {
        return NextResponse.json({ valid: false, result: 'not_found', message: 'No encontrado' })
      }
      if (member.event_id !== eventId) {
        return NextResponse.json({ valid: false, result: 'wrong_event', message: 'Evento incorrecto' })
      }

      // Check duplicate for today
      const { data: existing } = await admin
        .from('door_checkins')
        .select('id')
        .eq('member_list_id', member.id)
        .eq('event_id', eventId)
        .gte('scanned_at', startOfDay.toISOString())
        .maybeSingle()

      if (existing) {
        return NextResponse.json({ valid: false, result: 'duplicate', message: 'Ya ingresó' })
      }

      attendeeData = { id: member.id, name: member.name ?? '', email: member.email, event_id: member.event_id }
    } else {
      // Regular registration
      const regId = decoded.id ?? decoded.registration_id
      if (!regId) {
        return NextResponse.json({ valid: false, result: 'invalid', message: 'QR Inválido' })
      }

      const { data: reg } = await admin
        .from('registrations')
        .select('id, first_name, last_name, email, dni, event_id, status')
        .eq('id', regId)
        .maybeSingle()

      if (!reg) {
        return NextResponse.json({ valid: false, result: 'not_found', message: 'No encontrado' })
      }
      if (reg.event_id !== eventId) {
        return NextResponse.json({ valid: false, result: 'wrong_event', message: 'Evento incorrecto' })
      }
      if (!['confirmed', 'vip', 'member', 'purchased'].includes(reg.status)) {
        return NextResponse.json({ valid: false, result: 'invalid', message: 'No confirmado' })
      }

      // Check duplicate
      const { data: existing } = await admin
        .from('door_checkins')
        .select('id')
        .eq('registration_id', reg.id)
        .eq('event_id', eventId)
        .gte('scanned_at', startOfDay.toISOString())
        .maybeSingle()

      if (existing) {
        return NextResponse.json({ valid: false, result: 'duplicate', message: 'Ya ingresó' })
      }

      attendeeData = {
        id: reg.id,
        name: `${reg.first_name} ${reg.last_name}`,
        email: reg.email,
        dni: reg.dni,
        event_id: reg.event_id,
      }
    }

    // Insert checkin
    const checkinData: any = {
      event_id: eventId,
      scanner_email: scannerEmail,
      scanner_name: scannerName,
      is_member: isMember,
      result: 'valid',
      attendee_name: attendeeData.name,
      attendee_email: attendeeData.email,
      attendee_dni: attendeeData.dni ?? null,
      scanned_at: new Date().toISOString(),
    }
    if (isMember) {
      checkinData.member_list_id = attendeeData.id
    } else {
      checkinData.registration_id = attendeeData.id
    }

    await admin.from('door_checkins').insert(checkinData)

    // Update scanner last_scan_at
    if (scannerEmail) {
      await admin
        .from('scanner_permissions')
        .update({ last_scan_at: new Date().toISOString() })
        .eq('email', scannerEmail)
    }

    return NextResponse.json({
      valid: true,
      isMember,
      attendee: {
        name: attendeeData.name,
        email: attendeeData.email,
        dni: attendeeData.dni,
      },
    })
  } catch (err) {
    console.error('checkin route:', err)
    return NextResponse.json({ valid: false, result: 'invalid', message: 'Error interno' })
  }
}
