/**
 * ─── Department Service ──────────────────────────────────────
 */

import type { Department } from './department.schema'

export class DepartmentService {
  static prepareForCreate(input: Record<string, unknown>): Record<string, unknown> {
    const data = { ...input }

    if (typeof data.name === 'string') {
      data.name = (data.name as string).trim()
    }

    if (typeof data.code === 'string') {
      data.code = (data.code as string).toUpperCase().trim()
    }

    if (data.is24x7) {
      data.operatingHoursStart = '00:00'
      data.operatingHoursEnd = '23:59'
    }

    return data
  }

  /**
   * Check if department is currently open based on its hours.
   */
  static isCurrentlyOpen(dept: Department): boolean {
    if (!dept.isActive) return false
    if (dept.is24x7) return true

    const now = new Date()
    const currentMinutes = now.getHours() * 60 + now.getMinutes()

    const [startH = 8, startM = 0] = (dept.operatingHoursStart ?? '08:00').split(':').map(Number)
    const [endH = 17, endM = 0] = (dept.operatingHoursEnd ?? '17:00').split(':').map(Number)

    const startMinutes = startH * 60 + startM
    const endMinutes = endH * 60 + endM

    if (endMinutes > startMinutes) {
      return currentMinutes >= startMinutes && currentMinutes <= endMinutes
    } else {
      // Overnight hours (e.g., 22:00 - 06:00)
      return currentMinutes >= startMinutes || currentMinutes <= endMinutes
    }
  }

  /**
   * Get the department hierarchy path.
   * This would be populated by querying parent departments.
   */
  static getHierarchyPath(department: Department, allDepts: Department[]): string[] {
    const path: string[] = [department.name]
    let current: Department | undefined = department

    while (current?.parentDepartmentId) {
      const parent = allDepts.find(d => d.id === current!.parentDepartmentId)
      if (parent) {
        path.unshift(parent.name)
        current = parent
      } else {
        break
      }
    }

    return path
  }

  /**
   * Get child departments.
   */
  static getChildDepartments(parentId: string, allDepts: Department[]): Department[] {
    return allDepts.filter(d => d.parentDepartmentId === parentId)
  }

  /**
   * Get active doctor count in department.
   * (In production, this would query the Doctor repository.)
   */
  static async getDoctorCount(departmentId: string): Promise<number> {
    // Placeholder — would query Doctor entity
    return 0
  }
}
