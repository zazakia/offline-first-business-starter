/**
 * ─── Doctor Pages (index, new, detail) ───────────────────────
 */

import React from 'react'
import { useEffect, useState } from 'react'
import { Link, useParams, useNavigate } from '@tanstack/react-router'
import { Card, CardHeader, CardContent, cn } from '@repo/ui-core'
import { doctorRepo } from '../../lib/db'
import { DoctorUIConfig } from '@repo/entity-doctor'
import type { Doctor } from '@repo/entity-doctor'
import { DOCTOR_STATUS_LABELS, DOCTOR_SPECIALTY_LABELS } from '@repo/entity-doctor'
import { Plus, Search, ArrowLeft, Edit, Stethoscope, Save } from 'lucide-react'

const TENANT_ID = 'default-tenant'

// ─── List Page ───────────────────────────────────────────────

export function DoctorListPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    doctorRepo.findMany({ limit: 100 }).then(r => {
      setDoctors('items' in r ? r.items : [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const filtered = search
    ? doctors.filter(d => d.fullName.toLowerCase().includes(search.toLowerCase()) || d.licenseNumber.includes(search))
    : doctors

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Doctors</h1>
          <p className="text-sm text-gray-500">{doctors.length} doctors registered</p>
        </div>
        <Link to="/doctors/new" className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700">
          <Plus className="h-4 w-4" />New Doctor
        </Link>
      </div>
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search doctor..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500" />
        </div>
      </div>
      {loading ? <div className="space-y-3">{[1,2,3].map(i=><div key={i} className="h-20 animate-pulse rounded-lg bg-gray-100"/>)}</div>
      : filtered.length === 0 ? <Card><CardContent><div className="py-12 text-center"><Stethoscope className="mx-auto h-12 w-12 text-gray-300"/><h3 className="mt-2 text-sm font-medium text-gray-900">No doctors</h3></div></CardContent></Card>
      : (
        <div className="rounded-lg border border-gray-200 bg-white">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>{DoctorUIConfig.defaultColumns.map(c => <th key={c.key as string} className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500" style={{width:c.width}}>{c.label}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filtered.map(d => (
                <tr key={d.id} className="cursor-pointer hover:bg-gray-50" onClick={()=>window.location.href=`/doctors/${d.id}`}>
                  <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">{d.fullName}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">{DOCTOR_SPECIALTY_LABELS[d.specialty] ?? d.specialty}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">{d.licenseNumber}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">{d.phone}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">{d.email}</td>
                  <td className="whitespace-nowrap px-4 py-3"><span className={cn('inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium',d.status==='active'?'bg-green-100 text-green-800':d.status==='on_leave'?'bg-yellow-100 text-yellow-800':'bg-gray-100 text-gray-800')}>{DOCTOR_STATUS_LABELS[d.status]}</span></td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">{d.totalConsultations}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ─── Create Page ─────────────────────────────────────────────

export function CreateDoctorPage() {
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState<Record<string, unknown>>({
    fullName:'',licenseNumber:'',specialty:'general_medicine',phone:'',email:'',
    yearsOfExperience:0,education:'',officeNumber:'',consultationFee:0,
    maxPatientsPerDay:20,defaultConsultDuration:30,
    availableDays:'1,2,3,4,5',workHoursStart:'08:00',workHoursEnd:'17:00',
    languages:'es',tags:'',notes:'',
  })

  const handleChange = (name: string, value: unknown) => setForm(p=>({...p,[name]:value}))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setSaving(true)
    try {
      const doc = await doctorRepo.create({
        tenantId:TENANT_ID, fullName:form.fullName as string, licenseNumber:form.licenseNumber as string,
        specialty:form.specialty as any, subSpecialties:[], email:form.email as string, phone:form.phone as string,
        officeNumber:form.officeNumber as string, yearsOfExperience:form.yearsOfExperience as number,
        education:form.education as string, certifications:[],
        languages:typeof form.languages==='string'?(form.languages as string).split(',').map(s=>s.trim()).filter(Boolean):['es'],
        defaultConsultDuration:form.defaultConsultDuration as number, consultationFee:form.consultationFee as number,
        maxPatientsPerDay:form.maxPatientsPerDay as number,
        availableDays:typeof form.availableDays==='string'?(form.availableDays as string).split(',').map(Number).filter(n=>!isNaN(n)):[1,2,3,4,5],
        workHoursStart:form.workHoursStart as string, workHoursEnd:form.workHoursEnd as string,
        status:'active', tags:typeof form.tags==='string'?(form.tags as string).split(',').map(s=>s.trim()).filter(Boolean):[],
        notes:form.notes as string, totalConsultations:0,
      } as any)
      navigate({to:'/doctors/$id',params:{id:doc.id}})
    } catch(err:any) { setError(err.message||'Error al crear doctor') } finally { setSaving(false) }
  }

  const fields = DoctorUIConfig.formFields.create
  return (
    <div className="p-6">
      <div className="mb-6 flex items-center gap-4">
        <button onClick={()=>navigate({to:'/doctors'})} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"><ArrowLeft className="h-5 w-5"/></button>
        <div><h1 className="text-2xl font-semibold text-gray-900">New Doctor</h1></div>
      </div>
      {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
      <form onSubmit={handleSubmit}>
        <Card><CardContent><div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {fields.map(f => {
            if (f.type==='section') return <div key={f.name} className="col-span-full mt-4 mb-1"><h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500">{f.label}</h3><hr className="mt-1"/></div>
            const val = form[f.name] ?? ''
            return <div key={f.name} className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">{f.label}{f.required&&<span className="text-red-500 ml-1">*</span>}</label>
              {f.type==='select' ? <select value={val as string} onChange={e=>handleChange(f.name,e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"><option value="">Select...</option>{f.options?.map((o:any)=><option key={o.value} value={o.value}>{o.label}</option>)}</select>
              : f.type==='textarea' ? <textarea value={val as string} onChange={e=>handleChange(f.name,e.target.value)} placeholder={f.placeholder} rows={3} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"/>
              : f.type==='tags' ? <input type="text" value={val as string} onChange={e=>handleChange(f.name,e.target.value)} placeholder={f.placeholder} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"/>
              : <input type={f.type} value={val as string} onChange={e=>handleChange(f.name,f.type==='number'?Number(e.target.value):e.target.value)} placeholder={f.placeholder} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"/>}
            </div>
          })}
        </div></CardContent></Card>
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={()=>navigate({to:'/doctors'})} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
          <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"><Save className="h-4 w-4"/>{saving?'Saving...':'Save Doctor'}</button>
        </div>
      </form>
    </div>
  )
}

// ─── Detail Page ─────────────────────────────────────────────

export function DoctorDetailPage() {
  const { id } = useParams({ from: '/doctors/$id' })
  const navigate = useNavigate()
  const [doctor, setDoctor] = useState<Doctor | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { doctorRepo.findById(id).then(setDoctor).catch(console.error).finally(()=>setLoading(false)) }, [id])

  if (loading) return <div className="p-6"><div className="h-64 animate-pulse rounded-lg bg-gray-100"/></div>
  if (!doctor) return <div className="flex h-full items-center justify-center"><div className="text-center"><h2 className="text-2xl font-semibold">Doctor not found</h2><button onClick={()=>navigate({to:'/doctors'})} className="mt-4 rounded-lg bg-green-600 px-4 py-2 text-sm text-white">Back</button></div></div>

  const sections = DoctorUIConfig.detailSections
  const val = (k: string) => {
    const v = (doctor as any)[k]; if (v == null || v === '') return '-'
    if (k==='specialty') return DOCTOR_SPECIALTY_LABELS[v] ?? v
    if (k==='status') return DOCTOR_STATUS_LABELS[v] ?? v
    if (k==='subSpecialties'||k==='certifications'||k==='languages') return Array.isArray(v)?v.join(', '):'-'
    if (k==='availableDays') return Array.isArray(v)?v.map((d:number)=>['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'][d]).join(', '):'-'
    if (k==='_workHours') return `${doctor.workHoursStart??'08:00'} - ${doctor.workHoursEnd??'17:00'}`
    if (k==='consultationFee'&&typeof v==='number') return `$${v.toLocaleString('es-MX')} MXN`
    if (k==='defaultConsultDuration') return `${v} min`
    if (typeof v==='number') return new Date(v).toLocaleDateString('es-MX')
    return String(v)
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={()=>navigate({to:'/doctors'})} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"><ArrowLeft className="h-5 w-5"/></button>
          <div><h1 className="text-2xl font-semibold text-gray-900">{(doctor as any)._professionalName || doctor.fullName}</h1>
          <div className="mt-1 flex items-center gap-2">
            <span className={cn('inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium',doctor.status==='active'?'bg-green-100 text-green-800':'bg-gray-100 text-gray-800')}>{DOCTOR_STATUS_LABELS[doctor.status]}</span>
            <span className="text-sm text-gray-500">• Céd. {doctor.licenseNumber}</span>
          </div></div>
        </div>
        <button className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"><Edit className="h-4 w-4"/>Edit</button>
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {sections.map(s=>(<Card key={s.title}><CardHeader title={s.title}/><CardContent><dl className="divide-y divide-gray-100">{s.fields.map(f=>(<div key={f.key} className="flex justify-between py-2"><dt className="text-sm text-gray-500">{f.label}</dt><dd className="text-sm font-medium text-gray-900">{val(f.key)}</dd></div>))}</dl></CardContent></Card>))}
      </div>
    </div>
  )
}
