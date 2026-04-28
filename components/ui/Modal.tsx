'use client'

import { useEffect, useRef } from 'react'
import { useI18n } from '@/lib/i18n'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  eventName?: string
}

export function Modal({ isOpen, onClose, eventName }: ModalProps) {
  const { t } = useI18n()
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 flex items-center justify-center z-[8000] px-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
      onClick={(e) => { if (e.target === overlayRef.current) onClose() }}
    >
      <div
        className="relative w-full max-w-md rounded-2xl p-8"
        style={{
          background: 'var(--bg-secondary)',
          border: '0.5px solid var(--border-gold)',
        }}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 flex items-center justify-center w-8 h-8 rounded-full"
          style={{
            background: 'rgba(201,168,76,0.08)',
            border: '0.5px solid var(--border-gold)',
            color: 'var(--gold)',
          }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M1 1L11 11M11 1L1 11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
        </button>

        <h2
          className="mb-1"
          style={{ fontFamily: 'var(--font-cormorant)', fontWeight: 300, fontSize: '28px', color: 'var(--bone)' }}
        >
          {t.modalTitle}
        </h2>
        {eventName && (
          <p className="mb-4" style={{ fontFamily: 'var(--font-cormorant)', fontStyle: 'italic', fontSize: '14px', color: 'var(--text-secondary)' }}>
            {eventName}
          </p>
        )}
        <p className="mb-6" style={{ fontFamily: 'var(--font-inter)', fontWeight: 300, fontSize: '13px', color: 'var(--text-secondary)' }}>
          {t.modalSubtitle}
        </p>

        <form className="flex flex-col gap-4" onSubmit={(e) => e.preventDefault()}>
          <input
            type="text"
            placeholder={t.namePlaceholder}
            className="w-full px-4 py-3 rounded-lg outline-none bg-transparent"
            style={{
              fontFamily: 'var(--font-inter)',
              fontWeight: 300,
              fontSize: '13px',
              color: 'var(--bone)',
              border: '0.5px solid var(--border-gold)',
            }}
          />
          <input
            type="email"
            placeholder={t.emailPlaceholder}
            className="w-full px-4 py-3 rounded-lg outline-none bg-transparent"
            style={{
              fontFamily: 'var(--font-inter)',
              fontWeight: 300,
              fontSize: '13px',
              color: 'var(--bone)',
              border: '0.5px solid var(--border-gold)',
            }}
          />
          <button
            type="submit"
            className="w-full py-3 mt-2 rounded-lg relative overflow-hidden"
            style={{
              fontFamily: 'var(--font-inter)',
              fontWeight: 500,
              fontSize: '11px',
              letterSpacing: '0.1em',
              color: 'var(--gold)',
              border: '0.5px solid rgba(201,168,76,0.4)',
              background: 'rgba(201,168,76,0.08)',
            }}
          >
            {t.submitLabel}
          </button>
        </form>
      </div>
    </div>
  )
}
