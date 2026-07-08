#!/usr/bin/env tsx
/**
 * ─── Code Generator ──────────────────────────────────────────
 * Scaffolds new entities, modules, and adapters.
 *
 * Usage:
 *   pnpm codegen entity Order
 *   pnpm codegen module Customer
 *   pnpm codegen adapter postgres
 */

import fs from 'fs/promises'
import path from 'path'

const TEMPLATES_DIR = path.resolve(import.meta.dirname ?? __dirname, 'templates')

type GeneratorCommand = 'entity' | 'module' | 'adapter'

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

function camelCase(str: string): string {
  return str.charAt(0).toLowerCase() + str.slice(1)
}

function kebabCase(str: string): string {
  return str.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '')
}

async function generateEntity(name: string) {
  const entityName = camelCase(name)
  const EntityName = capitalize(name)
  const dir = path.resolve(process.cwd(), `packages/entity-${kebabCase(name)}/src`)

  console.log(`📦 Generating entity: ${EntityName}`)
  await fs.mkdir(dir, { recursive: true })

  const files: Array<{ filename: string; content: string }> = [
    {
      filename: 'package.json',
      content: JSON.stringify({
        name: `@repo/entity-${kebabCase(name)}`,
        version: '0.1.0',
        private: true,
        type: 'module',
        main: './src/index.ts',
        types: './src/index.ts',
        exports: { '.': './src/index.ts' },
        scripts: { build: 'tsc', typecheck: 'tsc --noEmit', clean: 'rm -rf dist .turbo' },
        dependencies: { '@repo/core': 'workspace:*', zod: '^3.23.0' },
        devDependencies: { typescript: '^5.5.0' },
      }, null, 2),
    },
    {
      filename: 'tsconfig.json',
      content: JSON.stringify({
        extends: '../../tsconfig.base.json',
        compilerOptions: { outDir: 'dist', rootDir: 'src', composite: true, jsx: 'react-jsx' },
        include: ['src'],
        references: [{ path: '../core' }],
      }, null, 2),
    },
    {
      filename: `src/${entityName}.entity.ts`,
      content: `import { EntityRegistry } from '@repo/core'
import type { EntityDefinition } from '@repo/core'
import type { ${EntityName} } from './${entityName}.schema'

export const ${EntityName}Entity: EntityDefinition<${EntityName}> = {
  name: '${kebabCase(name)}',
  ui: { label: '${EntityName}', labelPlural: '${EntityName}s', icon: 'File', routePath: '${kebabCase(name)}s', showInNav: true, navOrder: 50 },
  sync: { enabled: true, conflictStrategy: 'lww', priority: 'normal' },
  audit: { enabled: true },
  rbac: { enabled: true, permissionPrefix: '${kebabCase(name)}' },
  hooks: {},
  pagination: 'cursor',
  tenant: { enabled: true },
  softDelete: { enabled: true },
}

EntityRegistry.register(${EntityName}Entity)
`,
    },
    {
      filename: `src/${entityName}.schema.ts`,
      content: `import { z } from 'zod'
import { baseEntitySchema, emailSchema, tagsSchema, notesSchema, createQuerySchema } from '@repo/core'

export interface ${EntityName} {
  id: string
  tenantId: string
  name: string
  email: string
  status: 'active' | 'inactive'
  tags: string[]
  notes?: string
  createdAt: number
  updatedAt: number
  deletedAt: number | null
  version: number
  createdBy: string
  updatedBy: string
}

export const Create${EntityName}Schema = z.object({
  tenantId: z.string().min(1),
  name: z.string().min(1).max(200),
  email: emailSchema,
  status: z.enum(['active', 'inactive']).default('active'),
  tags: tagsSchema,
  notes: notesSchema,
})

export const Update${EntityName}Schema = z.object({
  name: z.string().min(1).max(200).optional(),
  email: emailSchema.optional(),
  status: z.enum(['active', 'inactive']).optional(),
  tags: tagsSchema.optional(),
  notes: notesSchema.optional(),
  version: z.number().int().positive(),
})

export const ${EntityName}QuerySchema = createQuerySchema({ status: z.string().optional() })
`,
    },
    {
      filename: `src/${entityName}.service.ts`,
      content: `import type { ${EntityName} } from './${entityName}.schema'

export class ${EntityName}Service {
  static prepareForCreate(input: Record<string, unknown>): Record<string, unknown> {
    return { ...input, status: input.status ?? 'active', tags: input.tags ?? [] }
  }

  static validate(input: Record<string, unknown>): string[] {
    const errors: string[] = []
    if (!input.name) errors.push('Name is required')
    return errors
  }
}
`,
    },
    {
      filename: `src/${entityName}.policies.ts`,
      content: `export type PolicyAction = 'create' | 'read' | 'update' | 'delete' | '*'

export interface Policy {
  effect: 'allow' | 'deny'
  action: PolicyAction
  conditions?: (ctx: { userId: string; roles: string[] }) => boolean
  priority?: number
}

export const ${EntityName}Policies: Policy[] = [
  { effect: 'allow', action: '*', conditions: (ctx) => ctx.roles.includes('admin'), priority: 100 },
  { effect: 'allow', action: 'read', conditions: () => true, priority: 50 },
  { effect: 'allow', action: 'create', conditions: () => true, priority: 50 },
  { effect: 'allow', action: 'update', conditions: () => true, priority: 50 },
  { effect: 'deny', action: 'delete', priority: 10 },
]
`,
    },
    {
      filename: `src/index.ts`,
      content: `export { ${EntityName}Entity } from './${entityName}.entity'
export type { ${EntityName} } from './${entityName}.schema'
export { Create${EntityName}Schema, Update${EntityName}Schema, ${EntityName}QuerySchema } from './${entityName}.schema'
export { ${EntityName}Service } from './${entityName}.service'
export { ${EntityName}Policies } from './${entityName}.policies'
`,
    },
  ]

  for (const file of files) {
    const filePath = path.resolve(dir, '../', file.filename)
    await fs.mkdir(path.dirname(filePath), { recursive: true })
    await fs.writeFile(filePath, file.content, 'utf-8')
    console.log(`  ✓ ${file.filename}`)
  }

  console.log(`\n✅ Entity ${EntityName} generated at packages/entity-${kebabCase(name)}`)
  console.log(`\nNext steps:`)
  console.log(`  1. Add "@repo/entity-${kebabCase(name)}": "workspace:*" to apps/web/package.json`)
  console.log(`  2. Add repository in apps/web/src/lib/db.ts`)
  console.log(`  3. Add routes in apps/web/src/router.tsx`)
  console.log(`  4. Build your UI components`)
}

async function main() {
  const [, , command, name] = process.argv

  if (!command || !name) {
    console.log('Usage: pnpm codegen <entity|module> <Name>')
    console.log('  pnpm codegen entity Order')
    process.exit(1)
  }

  switch (command) {
    case 'entity':
      await generateEntity(name)
      break
    default:
      console.log(`Unknown command: ${command}`)
      process.exit(1)
  }
}

main().catch(console.error)
