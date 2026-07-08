import React from 'react'
import { cn } from '../lib/utils'

const badgeVariants = {
  color: {
    blue: 'bg-blue-100 text-blue-800',
    green: 'bg-green-100 text-green-800',
    red: 'bg-red-100 text-red-800',
    yellow: 'bg-yellow-100 text-yellow-800',
    purple: 'bg-purple-100 text-purple-800',
    gray: 'bg-gray-100 text-gray-800',
  },
  size: {
    sm: 'px-1.5 py-0.5 text-xs',
    md: 'px-2 py-1 text-sm',
  },
} as const

export interface BadgeProps {
  children: React.ReactNode
  color?: keyof typeof badgeVariants.color
  size?: keyof typeof badgeVariants.size
  className?: string
  dot?: boolean
}

export function Badge({ children, color = 'gray', size = 'sm', className, dot = false }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-medium',
        badgeVariants.color[color],
        badgeVariants.size[size],
        className,
      )}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  )
}
