/**
 * ─── Patient Detail Page ─────────────────────────────────────
 */

import { useEffect, useState } from 'react'
import { useParams, useNavigate } from '@tanstack/react-router'
import { Card, CardHeader, CardContent, cn } from '@repo/ui-core'
import { patientRepo } from '../../lib/db'
import { PatientUIConfig, PATIENT_STATUS_LABELS, GENDER_LABELS } from '@repo/entity-patient'
import type { Patient } from '@repo/entity-patient'
import { ArrowLeft, Edit } from 'lucide-react'
import { MedicalTimeline } from '../../components/MedicalTimeline'

export function PatientDetailPage() {
  const { id } = useParams({ from: '/patients/$id' })
  const navigate = useNavigate()
  const [patient, setPatient] = useState<Patient | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { patientRepo.findById(id).then(setPatient).catch(console.error).finally(()=>setLoading(false)) }, [id])

  if (loading) return <div className="p-6"><div className="h-64 animate-pulse rounded-lg bg-gray-100"/></div>
  if (!patient) return <div className="flex h-full items-center justify-center p-6"><div className="text-center"><h2 className="text-2xl font-semibold">Patient not found</h2><p className="text-gray-500">The requested patient does not exist.</p><button onClick={()=>navigate({to:'/patients'})} className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">Back to Patients</button></div></div>

  const val = (key: string): string => {
    const v = (patient as any)[key]
    if (v == null || v === '') return '-'
    if (key === 'gender') return GENDER_LABELS[v] ?? v
    if (key === 'status') return PATIENT_STATUS_LABELS[v] ?? v
    if (key === '_age') return `${v} years`
    if (key === '_criticalFlags' && Array.isArray(v)) return v.join(', ') || 'None'
    if (key === 'tags' && Array.isArray(v)) return v.join(', ') || '-'
    if (key === 'createdAt' || key === 'updatedAt' || key === 'lastVisitDate' || key === 'dateOfBirth')
      return typeof v === 'number' ? new Date(v).toLocaleDateString('en-US', { dateStyle: 'long' }) : String(v)
    return String(v)
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={()=>navigate({to:'/patients'})} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"><ArrowLeft className="h-5 w-5"/></button>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">{patient.fullName}</h1>
            <div className="mt-1 flex items-center gap-2">
              <span className={cn('inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium',patient.status==='active'?'bg-green-100 text-green-800':patient.status==='inactive'?'bg-gray-100 text-gray-800':patient.status==='deceased'?'bg-red-100 text-red-800':'bg-yellow-100 text-yellow-800')}>{PATIENT_STATUS_LABELS[patient.status]}</span>
              {(patient as any)._age && <span className="text-sm text-gray-500">• {(patient as any)._age} years</span>}
              {(patient as any)._criticalFlags?.length > 0 && <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">⚠️ {(patient as any)._criticalFlags.length} alert(s)</span>}
            </div>
          </div>
        </div>
        <button className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"><Edit className="h-4 w-4"/>Edit</button>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {PatientUIConfig.quickActions.map(a=>(<button key={a.action} className="flex items-center justify-center gap-2 rounded-lg border border-gray-200 p-3 text-sm font-medium text-gray-700 transition-colors hover:border-blue-300 hover:bg-blue-50">{a.label}</button>))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {PatientUIConfig.detailSections.map(s=>(<Card key={s.title}><CardHeader title={s.title}/><CardContent><dl className="divide-y divide-gray-100">{s.fields.map(f=>(<div key={f.key} className="flex justify-between py-2"><dt className="text-sm text-gray-500">{f.label}</dt><dd className="text-sm font-medium text-gray-900">{val(f.key)}</dd></div>))}</dl></CardContent></Card>))}
      </div>

      <div className="mt-8"><h2 className="mb-4 text-lg font-semibold text-gray-900">Clinical History</h2><MedicalTimeline patientId={patient.id}/></div>
    </div>
  )
}
