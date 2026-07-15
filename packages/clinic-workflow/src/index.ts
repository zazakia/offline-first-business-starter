/**
 * ─── @repo/clinic-workflow — Barrel Export ──────────────────
 * Metadata-driven clinical workflow orchestration engine.
 *
 * Usage:
 *   import { getWorkflowEngine } from '@repo/clinic-workflow'
 *   const engine = getWorkflowEngine(repository)
 *   await engine.execute(tenant, 'appointment', 'afterUpdate', data, { previousStatus })
 */

export { ClinicWorkflowEngine, getWorkflowEngine } from './workflow-engine'
export type { WorkflowContext, WorkflowExecutionResult, WorkflowRepository } from './workflow-engine'
