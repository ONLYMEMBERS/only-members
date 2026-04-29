'use client'

import { useEffect, useRef, useState } from 'react'

export function CoverImageReveal({ src, alt }: { src: string; alt: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true) },
      { threshold: 0.1 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      style={{
        maxWidth: '480px',
        margin: '0 auto',
        padding: '48px 24px 0',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(20px)',
        transition: 'opacity 700ms cubic-bezier(0.16,1,0.3,1), transform 700ms cubic-bezier(0.16,1,0.3,1)',
      }}
    >
      <img
        src={src}
        alt={alt}
        style={{
          width: '100%',
          aspectRatio: '4/5',
          objectFit: 'cover',
          borderRadius: '14px',
          border: '0.5px solid rgba(201,168,76,0.2)',
          display: 'block',
        }}
      />
    </div>
  )
}
