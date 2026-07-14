import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'

type ToastType = 'success' | 'error' | 'info'

interface Toast {
  id: string
  type: ToastType
  message: string
}

interface ToastContextValue {
  addToast: (message: string, type?: ToastType) => void
  toast: (message: string, type?: ToastType) => void
}

type ToastHookValue = ToastContextValue & ((message: string, type?: ToastType) => void)

const ToastContext = createContext<ToastContextValue | undefined>(undefined)

export function useToast(): ToastHookValue {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within ToastProvider')
  }

  return Object.assign(context.toast, context)
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random()}`

    setToasts((current) => [...current, { id, type, message }])
  }, [])

  const toast = useCallback((message: string, type: ToastType = 'info') => {
    addToast(message, type)
  }, [addToast])

  useEffect(() => {
    if (!toasts.length) {
      return
    }

    const timers = toasts.map((toastItem) =>
      window.setTimeout(() => {
        setToasts((current) => current.filter((item) => item.id !== toastItem.id))
      }, 4500),
    )

    return () => {
      timers.forEach(window.clearTimeout)
    }
  }, [toasts])

  return (
    <ToastContext.Provider value={{ addToast, toast }}>
      {children}
      <div className="toast-container" aria-live="polite" aria-atomic="true">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast-${toast.type}`}>
            <span>{toast.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
