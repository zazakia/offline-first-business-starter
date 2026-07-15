/**
 * ─── Mobile Dashboard ────────────────────────────────────────
 * ClinicMeta Mobile — main dashboard with patient list.
 */

import { useEffect, useState } from 'react'
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView } from 'react-native'
import { Link } from 'expo-router'
import { patientRepo } from '../lib/db'
import type { Patient } from '@repo/entity-patient'
import { PATIENT_STATUS_LABELS } from '@repo/entity-patient'

export default function DashboardScreen() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const result = await patientRepo.findMany({ page: 1, pageSize: 50 })
        if ('items' in result) setPatients(result.items as Patient[])
      } catch (err) {
        console.error('Failed to load:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const quickLinks = [
    { label: 'Pacientes', href: '/patients', color: '#3B82F6' },
    { label: 'Doctores', href: '/doctors', color: '#10B981' },
    { label: 'Citas', href: '/appointments', color: '#8B5CF6' },
    { label: 'Expedientes', href: '/medical-records', color: '#EF4444' },
    { label: 'Recetas', href: '/prescriptions', color: '#F59E0B' },
    { label: 'Facturación', href: '/billing', color: '#F59E0B' },
    { label: 'Inventario', href: '/inventory', color: '#10B981' },
    { label: 'Departamentos', href: '/departments', color: '#8B5CF6' },
  ]

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    )
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>ClinicMeta</Text>
      <Text style={styles.subtitle}>{patients.length} pacientes registrados</Text>

      {/* Quick Links Grid */}
      <View style={styles.grid}>
        {quickLinks.map((link) => (
          <Link key={link.href} href={link.href as any} asChild>
            <TouchableOpacity style={[styles.gridItem, { borderLeftColor: link.color }]}>
              <Text style={styles.gridLabel}>{link.label}</Text>
            </TouchableOpacity>
          </Link>
        ))}
      </View>

      {/* Recent Patients */}
      <Text style={styles.sectionTitle}>Pacientes Recientes</Text>
      {patients.slice(0, 10).map((patient) => (
        <Link key={patient.id} href={`/patients/${patient.id}` as any} asChild>
          <TouchableOpacity style={styles.card}>
            <View style={styles.cardRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{patient.fullName}</Text>
                <Text style={styles.detail}>
                  {patient.phone} • {patient.dateOfBirth}
                </Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: patient.status === 'active' ? '#D1FAE5' : '#F3F4F6' }]}>
                <Text style={[styles.statusText, { color: patient.status === 'active' ? '#065F46' : '#6B7280' }]}>
                  {PATIENT_STATUS_LABELS[patient.status]}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </Link>
      ))}

      <Link href="/patients/new" asChild>
        <TouchableOpacity style={styles.addButton}>
          <Text style={styles.addButtonText}>+ Nuevo Paciente</Text>
        </TouchableOpacity>
      </Link>

      <View style={{ height: 40 }} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB', padding: 16 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 28, fontWeight: '700', color: '#111827', marginTop: 40 },
  subtitle: { fontSize: 14, color: '#6B7280', marginTop: 4, marginBottom: 24 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 },
  gridItem: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    width: '48%' as any,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  gridLabel: { fontSize: 14, fontWeight: '600', color: '#1F2937' },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#111827', marginBottom: 12 },
  card: {
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 10,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  cardRow: { flexDirection: 'row', alignItems: 'center' },
  name: { fontSize: 16, fontWeight: '600', color: '#111827' },
  detail: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 11, fontWeight: '600' },
  addButton: {
    backgroundColor: '#3B82F6',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  addButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
})
