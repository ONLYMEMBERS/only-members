'use client'

import { useEffect, useRef } from 'react'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
}

export function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const MAX_PARTICLES = 60
    const CONNECTION_DIST = 120
    const GOLD = 'rgba(201,168,76,'

    let width = canvas.offsetWidth
    let height = canvas.offsetHeight
    canvas.width = width
    canvas.height = height

    const particles: Particle[] = Array.from({ length: MAX_PARTICLES }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
    }))

    let rafId: number

    const draw = () => {
      ctx.clearRect(0, 0, width, height)

      // Update positions
      for (const p of particles) {
        p.x += p.vx
        p.y += p.vy

        // Brownian nudge
        p.vx += (Math.random() - 0.5) * 0.02
        p.vy += (Math.random() - 0.5) * 0.02

        // Dampen
        p.vx *= 0.99
        p.vy *= 0.99

        // Bounce
        if (p.x < 0 || p.x > width) p.vx *= -1
        if (p.y < 0 || p.y > height) p.vy *= -1

        // Draw dot
        ctx.beginPath()
        ctx.arc(p.x, p.y, 1, 0, Math.PI * 2)
        ctx.fillStyle = GOLD + '0.3)'
        ctx.fill()
      }

      // Draw connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)

          if (dist < CONNECTION_DIST) {
            const alpha = (1 - dist / CONNECTION_DIST) * 0.12
            ctx.beginPath()
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y)
            ctx.strokeStyle = GOLD + alpha + ')'
            ctx.lineWidth = 0.5
            ctx.stroke()
          }
        }
      }

      rafId = requestAnimationFrame(draw)
    }

    const onResize = () => {
      width = canvas.offsetWidth
      height = canvas.offsetHeight
      canvas.width = width
      canvas.height = height
    }

    window.addEventListener('resize', onResize)
    rafId = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('resize', onResize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ pointerEvents: 'none' }}
    />
  )
}
