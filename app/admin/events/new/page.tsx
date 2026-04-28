import { EventForm } from '@/components/admin/EventForm'

export default function NewEventPage() {
  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '24px 32px', borderBottom: '0.5px solid rgba(201,168,76,0.1)' }}>
        <h1 style={{ fontFamily: 'var(--font-cormorant)', fontWeight: 300, fontSize: '26px', color: '#F5F0E8' }}>
          Nuevo evento
        </h1>
      </div>
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <EventForm />
      </div>
    </div>
  )
}
