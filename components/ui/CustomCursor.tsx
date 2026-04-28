'use client'

import { useEffect, useRef } from 'react'

export function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null)
  const posRef = useRef({ x: -100, y: -100 })
  const targetRef = useRef({ x: -100, y: -100 })
  const rafRef = useRef<number>(0)
  const isHoveringRef = useRef(false)

  useEffect(() => {
    // Only on pointer devices
    if (window.matchMedia('(hover: none) and (pointer: coarse)').matches) return

    const cursor = cursorRef.current
    if (!cursor) return

    const onMouseMove = (e: MouseEvent) => {
      targetRef.current = { x: e.clientX, y: e.clientY }
    }

    const onMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const clickable = target.closest('a, button, [role="button"], [data-cursor-hover]')
      if (clickable && !isHoveringRef.current) {
        isHoveringRef.current = true
        cursor.style.width = '20px'
        cursor.style.height = '20px'
        cursor.style.background = 'transparent'
        cursor.style.border = '1.5px solid var(--gold)'
        cursor.style.marginLeft = '-10px'
        cursor.style.marginTop = '-10px'
      } else if (!clickable && isHoveringRef.current) {
        isHoveringRef.current = false
        cursor.style.width = '8px'
        cursor.style.height = '8px'
        cursor.style.background = 'var(--gold)'
        cursor.style.border = 'none'
        cursor.style.marginLeft = '-4px'
        cursor.style.marginTop = '-4px'
      }
    }

    const animate = () => {
      // Lerp factor
      const lerp = 0.12
      posRef.current.x += (targetRef.current.x - posRef.current.x) * lerp
      posRef.current.y += (targetRef.current.y - posRef.current.y) * lerp

      if (cursor) {
        cursor.style.transform = `translate(${posRef.current.x}px, ${posRef.current.y}px)`
      }
      rafRef.current = requestAnimationFrame(animate)
    }

    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseover', onMouseOver)
    rafRef.current = requestAnimationFrame(animate)

    return () => {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseover', onMouseOver)
      cancelAnimationFrame(rafRef.current)
    }
  }, [])

  return (
    <div
      ref={cursorRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '8px',
        height: '8px',
        marginLeft: '-4px',
        marginTop: '-4px',
        borderRadius: '50%',
        background: 'var(--gold)',
        pointerEvents: 'none',
        zIndex: 9999,
        transition: 'width 200ms ease, height 200ms ease, background 200ms ease, border 200ms ease, margin 200ms ease',
        willChange: 'transform',
      }}
    />
  )
}
