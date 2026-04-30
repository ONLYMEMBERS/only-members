'use client'

import { useState, useEffect } from 'react'
import { QRCodeSVG } from 'qrcode.react'

function generateToken(registrationId: string) {
  return btoa(JSON.stringify({
    registration_id: registrationId,
    expires: Date.now() + 15 * 60 * 1000,
  }))
}

export function QRExito({ registrationId }: { registrationId: string }) {
  const [token, setToken] = useState(() => generateToken(registrationId))

  useEffect(() => {
    const interval = setInterval(() => setToken(generateToken(registrationId)), 15 * 60 * 1000)
    return () => clearInterval(interval)
  }, [registrationId])

  return (
    <div style={{ padding: '16px', background: '#fff', borderRadius: '12px' }}>
      <QRCodeSVG value={token} size={200} />
    </div>
  )
}
