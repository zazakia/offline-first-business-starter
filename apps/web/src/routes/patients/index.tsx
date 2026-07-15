/**
 * ─── Patient List Page ───────────────────────────────────────
 */

import { useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Card, CardHeader, CardContent, cn } from '@repo/ui-core'
import { patientRepo } from '../../lib/db'
import { PatientUIConfig, PATIENT_STATUS_LABELS } from '@repo/entity-patient'
import type { Patient } from '@repo/entity-patient'
import { Plus, Search, Filter, FileText } from 'lucide-react'

export function PatientListPage() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    patientRepo.findMany({ limit: 100 }).then(r => {
      setPatients('items' in r ? r.items : [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const filtered = search
    ? patients.filter(p => p.fullName.toLowerCase().includes(search.toLowerCase()) || p.phone.includes(search) || (p.email ?? '').toLowerCase().includes(search.toLowerCase()))
    : patients

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div><h1 className="text-2xl font-semibold text-gray-900">Patients</h1><p className="text-sm text-gray-500">{patients.length} patients registered</p></div>
        <Link to="/patients/new" className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"><Plus className="h-4 w-4"/>New Patient</Link>
      </div>
      <div className="mb-4">
        <div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"/>
          <input type="text" placeholder="Search patients by name, phone or email..." value={search} onChange={e => setSearch(e.target.value)} className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"/>
        </div>
      </div>
      {loading ? <div className="space-y-3">{[1,2,3].map(i=><div key={i} className="h-20 animate-pulse rounded-lg bg-gray-100"/>)}</div>
      : filtered.length === 0 ? <Card><CardContent><div className="py-12 text-center"><FileText className="mx-auto h-12 w-12 text-gray-300"/><h3 className="mt-2 text-sm font-medium">No patients</h3><p className="text-sm text-gray-500">{search?'No results found.':'Register your first patient.'}</p></div></CardContent></Card>
      : <div className="rounded-lg border border-gray-200 bg-white"><table className="min-w-full divide-y divide-gray-200"><thead className="bg-gray-50"><tr>{PatientUIConfig.defaultColumns.map(c=><th key={c.key as string} className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500" style={{width:c.width}}>{c.label}</th>)}</tr></thead><tbody className="divide-y divide-gray-200">{filtered.map(p=>(<tr key={p.id} className="cursor-pointer hover:bg-gray-50" onClick={()=>window.location.href=`/patients/${p.id}`}><td className="px-4 py-3 text-sm font-medium text-gray-900">{p.fullName}{p.preferredName&&<span className="text-xs text-gray-400 ml-1">({p.preferredName})</span>}</td><td className="px-4 py-3 text-sm text-gray-600">{p.dateOfBirth}</td><td className="px-4 py-3 text-sm text-gray-600">{p.gender==='male'?'M':p.gender==='female'?'F':'-'}</td><td className="px-4 py-3 text-sm text-gray-600">{p.phone}</td><td className="px-4 py-3 text-sm text-gray-600">{p.email||'-'}</td><td className="px-4 py-3 text-sm text-gray-600">{p.bloodType||'-'}</td><td className="px-4 py-3"><span className={cn('inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium',p.status==='active'?'bg-green-100 text-green-800':p.status==='inactive'?'bg-gray-100 text-gray-800':p.status==='deceased'?'bg-red-100 text-red-800':'bg-yellow-100 text-yellow-800')}>{PATIENT_STATUS_LABELS[p.status]}</span></td><td className="px-4 py-3 text-sm text-gray-500">{p.lastVisitDate?new Date(p.lastVisitDate).toLocaleDateString():'-'}</td></tr>))}</tbody></table></div>}
    </div>
  )
}
