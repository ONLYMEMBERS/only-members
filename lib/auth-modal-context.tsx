'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

type AuthModalContextType = {
  isOpen: boolean
  openModal: () => void
  closeModal: () => void
}

const AuthModalContext = createContext<AuthModalContextType>({
  isOpen: false,
  openModal: () => {},
  closeModal: () => {},
})

export function AuthModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  return (
    <AuthModalContext.Provider value={{
      isOpen,
      openModal: () => setIsOpen(true),
      closeModal: () => setIsOpen(false),
    }}>
      {children}
    </AuthModalContext.Provider>
  )
}

export function useAuthModal() {
  return useContext(AuthModalContext)
}
