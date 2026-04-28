'use client'

import { useEffect, useRef } from 'react'

export function PageTransition() {
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const overlay = overlayRef.current
    if (!overlay) return

    // Fade out on mount (page loaded)
    overlay.style.opacity = '1'
    overlay.style.pointerEvents = 'all'

    const timer = setTimeout(() => {
      overlay.style.opacity = '0'
      overlay.style.pointerEvents = 'none'
    }, 50)

    return () => clearTimeout(timer)
  }, [])

  return (
    <div
      ref={overlayRef}
      style={{
        position: 'fixed',
        inset: 0,
        background: '#000',
        zIndex: 9000,
        transition: 'opacity 300ms ease',
        pointerEvents: 'none',
      }}
    />
  )
}
