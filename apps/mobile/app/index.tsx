/**
 * ─── Mobile Customer List ────────────────────────────────────
 * Lists customers from local SQLite database.
 */

import { useEffect, useState } from 'react'
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native'
import { Link } from 'expo-router'
import { customerRepo } from '../lib/db'
import type { Customer } from '@repo/entity-customer'

export default function CustomerListScreen() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const result = await customerRepo.findMany({ page: 1, pageSize: 100 })
        if ('items' in result) {
          setCustomers(result.items as Customer[])
        }
      } catch (err) {
        console.error('Failed to load customers:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={customers}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <View style={styles.centered}>
            <Text style={styles.emptyText}>No customers yet</Text>
            <Link href="/customers/new" style={styles.addButton}>
              <Text style={styles.addButtonText}>Add Customer</Text>
            </Link>
          </View>
        }
        renderItem={({ item }) => (
          <Link href={`/customers/${item.id}`} asChild>
            <TouchableOpacity style={styles.card}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.email}>{item.email}</Text>
              <Text style={styles.status}>{item.status}</Text>
            </TouchableOpacity>
          </Link>
        )}
      />
      <Link href="/customers/new" asChild>
        <TouchableOpacity style={styles.fab}>
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      </Link>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  emptyText: { fontSize: 16, color: '#666', marginBottom: 16 },
  addButton: { backgroundColor: '#2563eb', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  addButtonText: { color: '#fff', fontWeight: '600' },
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 12,
    marginVertical: 4,
    padding: 16,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  name: { fontSize: 16, fontWeight: '600', color: '#1a1a1a' },
  email: { fontSize: 14, color: '#666', marginTop: 2 },
  status: { fontSize: 12, color: '#2563eb', marginTop: 4, fontWeight: '500' },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2563eb',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  fabText: { fontSize: 24, color: '#fff', fontWeight: '300', marginTop: -2 },
})
