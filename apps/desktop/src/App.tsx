import { useEffect, useState } from 'react'
import { createTauriSqlRepository } from '@repo/db-tauri-sql'
import type { Customer } from '@repo/entity-customer'

const customerRepo = createTauriSqlRepository<Customer>('customer')

export default function App() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    customerRepo.findMany({ page: 1, pageSize: 50 })
      .then((result) => {
        if ('items' in result) setCustomers(result.items as Customer[])
      })
      .catch((err) => setError(err.message))
  }, [])

  if (error) {
    return (
      <div style={{ padding: 40, fontFamily: 'system-ui' }}>
        <h2>Database Error</h2>
        <p style={{ color: '#666' }}>{error}</p>
        <p style={{ fontSize: 14, color: '#999' }}>
          The Tauri SQL plugin is required. Run with: pnpm tauri dev
        </p>
      </div>
    )
  }

  return (
    <div style={{ padding: 24, fontFamily: 'system-ui' }}>
      <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 20 }}>OfflineBiz Desktop</h1>
      <p style={{ color: '#666', marginBottom: 20 }}>{customers.length} customers</p>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ textAlign: 'left', borderBottom: '2px solid #eee' }}>
            <th style={{ padding: 8 }}>Name</th>
            <th style={{ padding: 8 }}>Email</th>
            <th style={{ padding: 8 }}>Status</th>
          </tr>
        </thead>
        <tbody>
          {customers.map((c) => (
            <tr key={c.id} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: 8 }}>{c.name}</td>
              <td style={{ padding: 8 }}>{c.email}</td>
              <td style={{ padding: 8 }}>{c.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
