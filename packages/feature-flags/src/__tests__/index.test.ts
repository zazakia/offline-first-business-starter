import { describe, it, expect, beforeEach } from 'vitest'
import { featureFlags } from '../index'

describe('FeatureFlags', () => {
  beforeEach(() => {
    // Reset by re-defining defaults
    featureFlags.setEnabled('test.feature', false)
  })

  it('should return false for unknown flags', () => {
    expect(featureFlags.isEnabled('nonexistent')).toBe(false)
  })

  it('should define and check a flag', () => {
    featureFlags.define({ key: 'test.feature', description: 'Test', enabled: true })
    expect(featureFlags.isEnabled('test.feature')).toBe(true)
  })

  it('should return false for disabled flags', () => {
    featureFlags.define({ key: 'test.disabled', description: 'Test', enabled: false })
    expect(featureFlags.isEnabled('test.disabled')).toBe(false)
  })

  it('should toggle flags at runtime', () => {
    featureFlags.define({ key: 'test.toggle', description: 'Test', enabled: true })
    featureFlags.setEnabled('test.toggle', false)
    expect(featureFlags.isEnabled('test.toggle')).toBe(false)
  })

  it('should default to true when no rules', () => {
    featureFlags.define({ key: 'test.default', description: 'Test', enabled: true, default: true })
    expect(featureFlags.isEnabled('test.default')).toBe(true)
  })

  it('should filter by environment', () => {
    featureFlags.define({
      key: 'test.env',
      description: 'Test',
      enabled: true,
      rules: [{ target: 'environment', environments: ['production'] }],
    })
    expect(featureFlags.isEnabled('test.env', { environment: 'development' })).toBe(false)
    expect(featureFlags.isEnabled('test.env', { environment: 'production' })).toBe(true)
  })

  it('should return all defined flags', () => {
    const all = featureFlags.getAll()
    expect(Array.isArray(all)).toBe(true)
    expect(all.length).toBeGreaterThan(0)
  })
})
