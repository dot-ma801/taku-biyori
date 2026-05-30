import { reactive } from 'vue'

export type ToastVariant = 'info' | 'success' | 'warning' | 'error'

export interface Toast {
  id: number
  message: string
  variant: ToastVariant
  duration: number
}

// Module-scope singletons: all callers share the same queue
let nextId = 0
const toasts = reactive<Toast[]>([])

export function useToast() {
  function show(message: string, variant: ToastVariant = 'info', duration = 4000) {
    const id = nextId++
    toasts.push({ id, message, variant, duration })
    setTimeout(() => dismiss(id), duration)
  }

  function dismiss(id: number) {
    const idx = toasts.findIndex(t => t.id === id)
    if (idx !== -1) toasts.splice(idx, 1)
  }

  return {
    toasts,
    show,
    dismiss,
    success: (msg: string, duration?: number) => show(msg, 'success', duration),
    error: (msg: string, duration?: number) => show(msg, 'error', duration),
    warning: (msg: string, duration?: number) => show(msg, 'warning', duration),
    info: (msg: string, duration?: number) => show(msg, 'info', duration),
  }
}
