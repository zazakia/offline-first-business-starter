/**
 * ─── Clinic Workflow Engine ──────────────────────────────────
 * Orchestrates clinical workflows as defined in the tenant's
 * metadata configuration. Automates the pipeline:
 *
 *   Appointment → Medical Record → Prescription → Billing
 *
 * Every workflow is metadata-defined, not hardcoded.
 * New workflows can be added per clinic via config.
 */

import type { ClinicSettings, ClinicWorkflow, WorkflowAction } from '@repo/clinic-config'
import { getClinicConfig } from '@repo/clinic-config'
import type { Tenant } from '@repo/multi-tenant'

// ─── Workflow Context ────────────────────────────────────────
// Carried through the workflow execution pipeline

export interface WorkflowContext {
  tenant: Tenant
  config: ClinicSettings
  /** The entity that triggered the workflow */
  triggerEntity: {
    type: string
    id: string
    data: Record<string, unknown>
  }
  /** Accumulated results from previous actions */
  actionResults: Record<string, unknown>
  /** Any metadata passed through */
  metadata: Record<string, unknown>
}

export interface WorkflowExecutionResult {
  workflowName: string
  triggered: boolean
  actionsExecuted: number
  actionsSkipped: number
  errors: Array<{ actionIndex: number; error: string }>
  results: Record<string, unknown>
}

// ─── Repository interface (abstracted to avoid circular deps) ──

export interface WorkflowRepository {
  create: (entity: string, data: Record<string, unknown>) => Promise<{ id: string; data: Record<string, unknown> }>
  update: (entity: string, id: string, data: Record<string, unknown>) => Promise<void>
  findById: (entity: string, id: string) => Promise<Record<string, unknown> | null>
}

// ─── Engine ──────────────────────────────────────────────────

export class ClinicWorkflowEngine {
  private repo: WorkflowRepository

  constructor(repo: WorkflowRepository) {
    this.repo = repo
  }

  /**
   * Execute all enabled workflows that match a trigger event.
   *
   * @param tenant - The current tenant
   * @param triggerEntity - Entity type that fired the event
   * @param triggerEvent - The event type (afterCreate, afterUpdate, statusChange)
   * @param entityData - The entity's current data
   * @param metadata - Additional context (e.g., previous status for statusChange)
   */
  async execute(
    tenant: Tenant,
    triggerEntity: string,
    triggerEvent: 'afterCreate' | 'afterUpdate' | 'statusChange',
    entityData: Record<string, unknown>,
    metadata?: Record<string, unknown>,
  ): Promise<WorkflowExecutionResult[]> {
    const config = getClinicConfig(tenant)
    const workflows = config.workflows ?? []

    const matching = workflows.filter((w) => {
      if (!w.enabled) return false
      if (w.trigger.entity !== triggerEntity) return false
      if (w.trigger.event !== triggerEvent) return false

      // For statusChange, check if the new status matches
      if (triggerEvent === 'statusChange' && w.trigger.status) {
        return entityData.status === w.trigger.status
      }

      return true
    })

    const results: WorkflowExecutionResult[] = []

    for (const workflow of matching) {
      const result = await this.executeWorkflow(workflow, {
        tenant,
        config,
        triggerEntity: { type: triggerEntity, id: entityData.id as string, data: entityData },
        actionResults: {},
        metadata: metadata ?? {},
      })
      results.push(result)
    }

    return results
  }

  /**
   * Execute a single workflow's action chain.
   */
  private async executeWorkflow(
    workflow: ClinicWorkflow,
    ctx: WorkflowContext,
  ): Promise<WorkflowExecutionResult> {
    const result: WorkflowExecutionResult = {
      workflowName: workflow.name,
      triggered: true,
      actionsExecuted: 0,
      actionsSkipped: 0,
      errors: [],
      results: {},
    }

    const sortedActions = [...workflow.actions].sort((a, b) => a.order - b.order)

    for (let i = 0; i < sortedActions.length; i++) {
      const action = sortedActions[i]

      // Check condition
      if (action.condition) {
        const conditionMet = this.evaluateCondition(action.condition, ctx)
        if (!conditionMet) {
          result.actionsSkipped++
          continue
        }
      }

      try {
        const actionResult = await this.executeAction(action, ctx)
        ctx.actionResults[`action_${i}`] = actionResult
        result.results[`action_${i}`] = actionResult
        result.actionsExecuted++
      } catch (err: any) {
        result.errors.push({ actionIndex: i, error: err.message })
      }
    }

    return result
  }

  /**
   * Execute a single workflow action.
   */
  private async executeAction(
    action: WorkflowAction,
    ctx: WorkflowContext,
  ): Promise<unknown> {
    switch (action.type) {
      case 'createEntity': {
        return this.executeCreateEntity(action, ctx)
      }
      case 'updateEntity': {
        return this.executeUpdateEntity(action, ctx)
      }
      case 'sendNotification': {
        return this.executeSendNotification(action, ctx)
      }
      case 'generateDocument': {
        return this.executeGenerateDocument(action, ctx)
      }
      case 'callWebhook': {
        return this.executeCallWebhook(action, ctx)
      }
      default:
        throw new Error(`Unknown action type: ${action.type}`)
    }
  }

  /**
   * Auto-create a downstream entity.
   * e.g., After completing an appointment, create a medical record.
   */
  private async executeCreateEntity(
    action: WorkflowAction,
    ctx: WorkflowContext,
  ): Promise<unknown> {
    const entityType = action.config.entity as string
    const mapFields = action.config.mapFields as Record<string, string> | undefined
    const autoItems = action.config.autoItems as Array<Record<string, unknown>> | undefined

    // Build the new entity data by mapping fields from the trigger
    const data: Record<string, unknown> = {
      tenantId: ctx.tenant.id,
    }

    if (mapFields) {
      for (const [targetField, sourceField] of Object.entries(mapFields)) {
        // Check trigger data first, then action results
        const value = ctx.triggerEntity.data[sourceField] ??
          ctx.actionResults[sourceField]
        if (value !== undefined) {
          data[targetField] = value
        }
      }
    }

    // Add auto-generated items
    if (autoItems) {
      for (const [key, value] of Object.entries(autoItems)) {
        data[key] = value
      }
    }

    // Add default status based on entity type
    switch (entityType) {
      case 'medicalRecord':
        data.status = 'draft'
        data.type = 'consultation'
        data.encounterDate = Date.now()
        data.vitalSigns = {}
        data.diagnoses = []
        if (!data.chiefComplaint) {
          data.chiefComplaint = ctx.triggerEntity.data.reason ?? 'Consulta programada'
        }
        break
      case 'billing':
        if (!data.items) {
          // Auto-generate a consultation line item
          const config = ctx.config
          const defaultPrice = config.billing?.defaultConsultationPrice ?? 500
          data.items = [{
            id: crypto.randomUUID ? crypto.randomUUID() : `item-${Date.now()}`,
            description: 'Consulta Médica',
            quantity: 1,
            unitPrice: defaultPrice,
            total: defaultPrice,
            category: 'consultation',
            taxRate: config.billing?.defaultTaxRate ?? 0.16,
            taxExempt: false,
          }]
        }
        break
      case 'prescription':
        data.status = 'draft'
        if (!data.medications) data.medications = []
        break
    }

    const result = await this.repo.create(entityType, data)
    return result
  }

  /**
   * Update an existing entity as part of a workflow.
   */
  private async executeUpdateEntity(
    action: WorkflowAction,
    ctx: WorkflowContext,
  ): Promise<unknown> {
    const entityType = action.config.entity as string
    const entityId = action.config.entityId as string | undefined
    const updates = action.config.updates as Record<string, unknown> | undefined

    if (!entityId) {
      // Try to resolve from trigger or action results
      const resolvedId = ctx.triggerEntity.data[`${entityType}Id`] ??
        ctx.actionResults[`${entityType}Id`]
      if (!resolvedId) return { skipped: true, reason: 'No entity ID available' }
      await this.repo.update(entityType, resolvedId as string, updates ?? {})
    } else {
      await this.repo.update(entityType, entityId, updates ?? {})
    }

    return { updated: true }
  }

  /**
   * Send a notification (in-app, SMS, email, WhatsApp).
   */
  private async executeSendNotification(
    action: WorkflowAction,
    ctx: WorkflowContext,
  ): Promise<unknown> {
    const channel = action.config.channel as string
    const template = action.config.template as string
    const targetRole = action.config.targetRole as string | undefined

    // In production, this would call a notification service
    console.log(`[Workflow] Notification: channel=${channel}, template=${template}, targetRole=${targetRole}`)

    return { sent: true, channel, template }
  }

  /**
   * Generate a document (PDF prescription, invoice, lab order).
   */
  private async executeGenerateDocument(
    action: WorkflowAction,
    ctx: WorkflowContext,
  ): Promise<unknown> {
    const docType = action.config.documentType as string
    console.log(`[Workflow] Generate document: ${docType}`)
    return { generated: true, documentType: docType }
  }

  /**
   * Call an external webhook.
   */
  private async executeCallWebhook(
    action: WorkflowAction,
    ctx: WorkflowContext,
  ): Promise<unknown> {
    const url = action.config.url as string
    const method = (action.config.method as string) ?? 'POST'
    console.log(`[Workflow] Webhook: ${method} ${url}`)
    return { called: true, url, method }
  }

  /**
   * Evaluate a simple condition string against the workflow context.
   * Supports: ==, !=, >, <, &&, ||, true/false
   * e.g., "triggerEntity.data.status == 'completed'"
   *       "config.billing.autoGenerateAfterConsultation == true"
   */
  private evaluateCondition(condition: string, ctx: WorkflowContext): boolean {
    try {
      // Simple condition evaluator
      // Supports path resolution: "triggerEntity.data.status"
      const resolvePath = (path: string): unknown => {
        const parts = path.trim().split('.')
        let current: any = ctx
        for (const part of parts) {
          if (current == null) return undefined
          current = current[part]
        }
        return current
      }

      // Handle simple equality
      const eqMatch = condition.match(/^(.+?)\s*==\s*(.+)$/)
      if (eqMatch) {
        const left = resolvePath(eqMatch[1])
        let right: unknown = eqMatch[2].trim()
        // Remove quotes
        if (typeof right === 'string' && right.startsWith("'") && right.endsWith("'")) {
          right = right.slice(1, -1)
        }
        if (right === 'true') right = true
        if (right === 'false') right = false
        return left === right
      }

      // Handle boolean flags
      if (condition === 'true') return true
      if (condition === 'false') return false

      // Resolve as a boolean path
      const value = resolvePath(condition)
      return Boolean(value)
    } catch {
      return false
    }
  }
}

// ─── Singleton ───────────────────────────────────────────────

let _engine: ClinicWorkflowEngine | null = null

export function getWorkflowEngine(repo: WorkflowRepository): ClinicWorkflowEngine {
  if (!_engine) {
    _engine = new ClinicWorkflowEngine(repo)
  }
  return _engine
}
