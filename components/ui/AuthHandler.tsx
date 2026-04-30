'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AuthHandler() {
  const router = useRouter()

  useEffect(() => {
    const hash = window.location.hash

    // Token landed on wrong page — forward to callback processor
    if (hash.includes('access_token')) {
      router.replace('/auth/callback' + hash)
    }
  }, [router])

  return null
}
