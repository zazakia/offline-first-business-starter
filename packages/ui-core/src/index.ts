/**
 * ─── @repo/ui-core — Barrel Export ───────────────────────────
 */

// Utilities
export { cn, formatTimestamp, formatCurrency, truncate, parseTags } from './lib/utils'

// Primitives
export { Button } from './primitives/Button'
export type { ButtonProps } from './primitives/Button'

export { Input } from './primitives/Input'
export type { InputProps } from './primitives/Input'

export { Badge } from './primitives/Badge'
export type { BadgeProps } from './primitives/Badge'

export { Card, CardHeader, CardContent } from './primitives/Card'
export type { CardProps, CardHeaderProps, CardContentProps } from './primitives/Card'

export { Modal } from './primitives/Modal'
export type { ModalProps } from './primitives/Modal'

// Feedback
export { ErrorBoundary } from './feedback/ErrorBoundary'
export { ToastProvider, useToast } from './feedback/Toast'
export type { ToastData, ToastType } from './feedback/Toast'

// Hooks
export { useOnlineStatus } from './hooks/useOnlineStatus'
