/**
 * ─── Customer Service ────────────────────────────────────────
 * Pure business logic for Customers.
 * Zero I/O — operates on data in memory.
 * All side effects (DB, sync, audit) are handled by the middleware pipeline.
 */

import type { Customer, CreateCustomerSchema, UpdateCustomerSchema } from './customer.schema'
import { AppError } from '@repo/core'

export interface ValidateEmailResult {
  valid: boolean
  normalizedEmail?: string
  reason?: string
}

export class CustomerService {
  /**
   * Validate and normalize customer data before creation.
   */
  static prepareForCreate(input: Record<string, unknown>): Record<string, unknown> {
    const data = { ...input }

    // Normalize email
    if (typeof data.email === 'string') {
      data.email = data.email.toLowerCase().trim()
    }

    // Normalize name
    const nameVal = data.name
    if (typeof nameVal === 'string') {
      data.name = nameVal.trim().replace(/\b\w/g, (c: string) => c.toUpperCase())
    }

    // Set default status if not provided
    if (!data.status) {
      data.status = 'active'
    }

    // Initialize tags
    if (!data.tags) {
      data.tags = []
    }

    return data
  }

  /**
   * Validate email format and business rules.
   */
  static validateEmail(email: string): ValidateEmailResult {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return { valid: false, reason: 'Invalid email format' }
    }

    // Block disposable email domains (business rule)
    const disposableDomains = ['mailinator.com', 'tempmail.com', 'throwaway.email']
    const domain = email.split('@')[1]?.toLowerCase()
    if (domain && disposableDomains.includes(domain)) {
      return { valid: false, reason: 'Disposable email domains are not allowed' }
    }

    return { valid: true, normalizedEmail: email.toLowerCase().trim() }
  }

  /**
   * Check if customer can be upgraded from lead to active (business rule).
   */
  static canActivate(customer: Customer): { allowed: boolean; reason?: string } {
    if (customer.status !== 'lead') {
      return { allowed: false, reason: 'Only lead customers can be activated' }
    }

    if (!customer.email) {
      return { allowed: false, reason: 'Email is required to activate a customer' }
    }

    return { allowed: true }
  }

  /**
   * Calculate customer lifetime value segment (business logic).
   */
  static getLTVSegment(lifetimeValue: number): 'low' | 'medium' | 'high' | 'vip' {
    if (lifetimeValue >= 100000) return 'vip'
    if (lifetimeValue >= 25000) return 'high'
    if (lifetimeValue >= 5000) return 'medium'
    return 'low'
  }

  /**
   * Merge two customer records (for deduplication).
   */
  static merge(primary: Customer, secondary: Customer): Partial<Customer> {
    return {
      name: primary.name || secondary.name,
      email: primary.email || secondary.email,
      phone: primary.phone || secondary.phone,
      company: primary.company || secondary.company,
      website: primary.website || secondary.website,
      status: primary.status === 'active' ? 'active' : secondary.status,
      tags: [...new Set([...primary.tags, ...secondary.tags])],
      notes: [primary.notes, secondary.notes].filter(Boolean).join('\n---\n'),
      lifetimeValue: (primary.lifetimeValue ?? 0) + (secondary.lifetimeValue ?? 0),
      lastContactedAt: Math.max(
        primary.lastContactedAt ?? 0,
        secondary.lastContactedAt ?? 0,
      ),
    }
  }

  /**
   * Check if a customer should be automatically churned (business rule).
   */
  static shouldAutoChurn(customer: Customer): boolean {
    if (customer.status === 'churned') return false
    if (customer.status === 'inactive' && customer.lastContactedAt) {
      const daysSinceContact = (Date.now() - customer.lastContactedAt) / (1000 * 60 * 60 * 24)
      return daysSinceContact > 365 // No contact for over a year
    }
    return false
  }
}
