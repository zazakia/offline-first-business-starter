/**
 * ─── Mobile App Layout ───────────────────────────────────────
 * ClinicMeta Mobile — Root layout with navigation and providers.
 * Expo Router file-based routing with all clinic entity screens.
 */

import { Stack, Tabs } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Register all entities on import
import '@repo/entity-customer'
import '@repo/entity-patient'
import '@repo/entity-doctor'
import '@repo/entity-appointment'
import '@repo/entity-medical-record'
import '@repo/entity-prescription'
import '@repo/entity-billing'
import '@repo/entity-inventory'
import '@repo/entity-department'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 1000 * 60 * 5, gcTime: 1000 * 60 * 30, retry: 3 },
    mutations: { retry: 2 },
  },
})

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="auto" />
      <Stack>
        <Stack.Screen name="index" options={{ title: 'ClinicMeta' }} />
        <Stack.Screen name="patients/index" options={{ title: 'Pacientes' }} />
        <Stack.Screen name="patients/new" options={{ title: 'Nuevo Paciente' }} />
        <Stack.Screen name="patients/[id]" options={{ title: 'Paciente' }} />
        <Stack.Screen name="doctors/index" options={{ title: 'Doctores' }} />
        <Stack.Screen name="appointments/index" options={{ title: 'Citas' }} />
        <Stack.Screen name="appointments/new" options={{ title: 'Nueva Cita' }} />
        <Stack.Screen name="medical-records/index" options={{ title: 'Expedientes' }} />
        <Stack.Screen name="prescriptions/index" options={{ title: 'Recetas' }} />
        <Stack.Screen name="billing/index" options={{ title: 'Facturación' }} />
        <Stack.Screen name="inventory/index" options={{ title: 'Inventario' }} />
        <Stack.Screen name="departments/index" options={{ title: 'Departamentos' }} />
        <Stack.Screen name="customers/index" options={{ title: 'Clientes' }} />
      </Stack>
    </QueryClientProvider>
  )
}
