/**
 * ─── Mobile App Layout ───────────────────────────────────────
 * Root layout with navigation and providers.
 */

import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useEffect } from 'react'
import '@repo/entity-customer'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 30,
      retry: 3,
    },
  },
})

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="auto" />
      <Stack>
        <Stack.Screen name="index" options={{ title: 'Customers' }} />
        <Stack.Screen name="customers/new" options={{ title: 'Add Customer' }} />
        <Stack.Screen name="customers/[id]" options={{ title: 'Customer Details' }} />
      </Stack>
    </QueryClientProvider>
  )
}
