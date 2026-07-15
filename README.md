# 🏥 ClinicMeta — Sistema de Gestión Clínica y Hospitalaria

Sistema enterprise-grade offline-first para gestión de clínicas y hospitales. Funciona en **web (PWA)**, **móvil (iOS/Android)**, y **escritorio (Windows/Mac/Linux)**.

## Arquitectura

```
┌──────────────────────────────────────────────────────────────┐
│                  Monorepo (Turborepo + pnpm)                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐     │
│  │   Web    │  │  Mobile  │  │ Desktop  │  │   API    │     │
│  │ (React)  │  │  (Expo)  │  │ (Tauri)  │  │  (Hono)  │     │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘     │
│       └──────────────┼──────────────┘            │           │
│                      ▼                           │           │
│          ┌──────────────────────┐                │           │
│          │    packages/core     │ ◄──────────────┘           │
│          │ (types, registry,    │                            │
│          │  middleware, events) │                            │
│          └──────────────────────┘                            │
│  ┌──────────┐  ┌──────────┐  ┌─────────────────────┐        │
│  │DbAdapter │  │  Entity  │  │      UI Core        │        │
│  │ (Dexie)  │  │Packages  │  │ (Components/Hooks)  │        │
│  └──────────┘  └──────────┘  └─────────────────────┘        │
└──────────────────────────────────────────────────────────────┘
```

## Entidades del Sistema Clínico

| Entidad | Paquete | Descripción |
|---------|---------|-------------|
| Paciente | `@repo/entity-patient` | Registro de pacientes, datos demográficos, historial médico |
| Doctor | `@repo/entity-doctor` | Médicos, especialidades, cédulas, horarios |
| Cita | `@repo/entity-appointment` | Agendamiento de consultas, estados, prioridades |
| Expediente | `@repo/entity-medical-record` | Consultas clínicas, signos vitales, diagnósticos CIE-10 |
| Receta | `@repo/entity-prescription` | Medicamentos, dosis, controlados, interacciones |
| Facturación | `@repo/entity-billing` | Facturas, pagos, ledger de doble entrada inmutable |
| Inventario | `@repo/entity-inventory` | Medicamentos, insumos, equipo, transacciones de stock |
| Departamento | `@repo/entity-department` | Departamentos hospitalarios, jerarquía, horarios |

## Características

- **Offline-First**: Datos escritos en DB local primero, sincronizados en segundo plano
- **Multi-Plataforma**: Misma lógica de negocio en web, móvil, escritorio
- **Entity Registry**: Módulos de negocio auto-registrables
- **Repository Pattern**: Cambia de DB sin tocar lógica de negocio
- **Middleware Pipeline**: Validación, auth, auditoría, aislamiento de tenant
- **Sync Configurable**: LWW, CRDT, o resolución de conflictos personalizada
- **Enterprise Ready**: RBAC con políticas, audit trail, multi-tenancy
- **Metadata-Driven**: Campos personalizables por tenant sin hardcoding
- **Doble Entrada (Billing)**: Ledger inmutable para todas las transacciones financieras
- **Datos Clínicos Seguros**: Políticas RBAC granulares para acceso a datos sensibles

## Inicio Rápido

```bash
pnpm install
pnpm dev
```

Abrir http://localhost:5173 en el navegador.

## Estructura del Proyecto

```
packages/
├── core/                    # Interfaces, tipos, registry, middleware
├── db-adapter-dexie/        # Adapter IndexedDB (web)
├── db-adapter-expo-sqlite/  # Adapter SQLite (mobile)
├── db-adapter-tauri-sql/    # Adapter SQL (desktop)
├── sync-engine/             # Motor de sincronización offline
├── multi-tenant/            # Aislamiento de tenants
├── feature-flags/           # Feature toggles por tenant/entorno
├── audit-trail/             # Auditoría inmutable
├── observability/           # Monitoreo y telemetría
├── ui-core/                 # Componentes de diseño
│
├── entity-customer/         # Clientes (legacy)
├── entity-patient/          # Pacientes
├── entity-doctor/           # Doctores
├── entity-appointment/      # Citas
├── entity-medical-record/   # Expedientes clínicos
├── entity-prescription/     # Recetas médicas
├── entity-billing/          # Facturación (doble entrada)
├── entity-inventory/        # Inventario médico
└── entity-department/       # Departamentos

apps/
├── web/                     # React + Vite + PWA
├── mobile/                  # Expo React Native
├── desktop/                 # Tauri desktop
└── api/                     # Backend API (Hono)
```

## Agregar una Nueva Entidad

1. Crear `packages/entity-tunombre/`
2. Definir tipos, schemas Zod, service, policies, hooks
3. Registrar con `EntityRegistry.register()`
4. Agregar repositorio en `apps/web/src/lib/db.ts`
5. Agregar rutas en `apps/web/src/router.tsx`
6. Construir la UI

## Roles del Sistema

| Rol | Descripción | Acceso |
|-----|-------------|--------|
| `superadmin` | Super administrador del sistema | Todo |
| `admin` | Administrador de clínica | Todo |
| `doctor` | Médico | Pacientes, citas, expedientes, recetas |
| `nurse` | Enfermero/a | Pacientes (lectura/escritura básica), inventario |
| `receptionist` | Recepcionista | Pacientes (demográficos), citas, facturación básica |
| `pharmacist` | Farmacéutico | Recetas (dispensar), inventario |
| `billing` | Facturación | Facturas, pagos, reportes financieros |

## Feature Flags Clínicos

Los módulos del sistema pueden activarse/desactivarse por tenant:

- `clinic.prescriptions.enabled` — Módulo de recetas
- `clinic.billing.enabled` — Facturación
- `clinic.inventory.enabled` — Inventario
- `clinic.lab-orders.enabled` — Órdenes de laboratorio
- `clinic.imaging.enabled` — Imagenología
- `clinic.surgery.enabled` — Programación quirúrgica
- `clinic.inpatient.enabled` — Hospitalización
- `clinic.telemedicine.enabled` — Telemedicina
- `clinic.cfdi.enabled` — Facturación electrónica CFDI (México)
- `clinic.controlled-substances` — Control de medicamentos controlados
- `clinic.patient-portal` — Portal de pacientes
- `clinic.metadata-custom-fields` — Campos personalizables por tenant

## Tech Stack

| Capa | Tecnología |
|------|-----------|
| Monorepo | Turborepo + pnpm |
| Lenguaje | TypeScript 5.x |
| Web | React 19 + Vite 6 + Tailwind CSS |
| Móvil | Expo (futuro) |
| Escritorio | Tauri v2 (futuro) |
| DB Local | Dexie.js (IndexedDB) |
| Validación | Zod |
| Estado | TanStack Query + Zustand |
| PWA | vite-plugin-pwa + Workbox |
| UI | Sistema de diseño personalizado |

## Principios de Arquitectura

### 1. Cero Cambios que Rompan Código en Producción
Todas las extensiones son aditivas. Los módulos existentes no se modifican.

### 2. Metadata-Driven sobre Hardcoding
Las personalizaciones por clínica se almacenan como JSONB en la configuración del tenant, interpretadas en runtime por un motor unificado.

### 3. Ledger de Doble Entrada (Facturación)
Toda modificación de saldos genera entradas de ledger. **Nunca** se muta directamente una columna de "balance".

### 4. Offline-First
- UUIDs determinísticos generados en el cliente
- Mutaciones idempotentes
- Escritura local primero, sincronización en segundo plano
- Manejo de estados "pending sync"
