/**
 * ─── Create Patient Page ─────────────────────────────────────
 */
import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Card, CardHeader, CardContent } from '@repo/ui-core'
import { patientRepo } from '../../lib/db'
import { PatientUIConfig } from '@repo/entity-patient'
import { ArrowLeft, Save } from 'lucide-react'

const TENANT_ID = 'default-tenant'

export function CreatePatientPage() {
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState<Record<string, unknown>>({
    fullName:'',preferredName:'',dateOfBirth:'',gender:'undisclosed',phone:'',email:'',
    addressLine1:'',city:'',state:'',postalCode:'',bloodType:'',allergies:'',
    chronicConditions:'',currentMedications:'',emergencyContactName:'',emergencyContactPhone:'',
    emergencyContactRelation:'',insuranceProvider:'',insurancePolicyNumber:'',
    insuranceGroupNumber:'',maritalStatus:'',occupation:'',preferredLanguage:'en',tags:[],notes:'',
  })

  const handleChange = (name: string, value: unknown) => setFormData(p=>({...p,[name]:value}))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setSaving(true)
    try {
      const patient = await patientRepo.create({
        tenantId: TENANT_ID, fullName: formData.fullName as string, preferredName: formData.preferredName as string,
        dateOfBirth: formData.dateOfBirth as string, gender: formData.gender as any, phone: formData.phone as string,
        email: formData.email as string, addressLine1: formData.addressLine1 as string, city: formData.city as string,
        state: formData.state as string, postalCode: formData.postalCode as string,
        bloodType: (formData.bloodType as string)||undefined, allergies: (formData.allergies as string)||undefined,
        chronicConditions: (formData.chronicConditions as string)||undefined, currentMedications: (formData.currentMedications as string)||undefined,
        emergencyContactName: formData.emergencyContactName as string, emergencyContactPhone: formData.emergencyContactPhone as string,
        emergencyContactRelation: formData.emergencyContactRelation as string,
        insuranceProvider: formData.insuranceProvider as string, insurancePolicyNumber: formData.insurancePolicyNumber as string,
        insuranceGroupNumber: formData.insuranceGroupNumber as string, maritalStatus: formData.maritalStatus as string,
        occupation: formData.occupation as string, preferredLanguage: formData.preferredLanguage as string,
        tags: formData.tags as string[], notes: formData.notes as string,
      } as any)
      navigate({ to: '/patients/$id', params: { id: patient.id } })
    } catch (err: any) { setError(err.message || 'Error creating patient') } finally { setSaving(false) }
  }

  const renderField = (field: any) => {
    if (field.type === 'section') return <div key={field.name} className="col-span-full mt-6 mb-2 first:mt-0"><h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500">{field.label}</h3><hr className="mt-1 border-gray-200"/></div>
    const value = formData[field.name] ?? ''
    return <div key={field.name} className="space-y-1"><label className="block text-sm font-medium text-gray-700">{field.label}{field.required&&<span className="text-red-500 ml-1">*</span>}</label>
      {field.type==='textarea'?<textarea value={value as string} onChange={e=>handleChange(field.name,e.target.value)} placeholder={field.placeholder} rows={3} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"/>
      :field.type==='select'?<select value={value as string} onChange={e=>handleChange(field.name,e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"><option value="">Select...</option>{field.options?.map((o:any)=><option key={o.value} value={o.value}>{o.label}</option>)}</select>
      :field.type==='tags'?<input type="text" value={Array.isArray(value)?value.join(', '):(value as string)} onChange={e=>{const tags=e.target.value.split(',').map((t:string)=>t.trim()).filter(Boolean);handleChange(field.name,tags)}} placeholder={field.placeholder} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"/>
      :field.type==='date'?<input type="date" value={value as string} onChange={e=>handleChange(field.name,e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"/>
      :<input type={field.type} value={value as string} onChange={e=>handleChange(field.name,field.type==='number'?Number(e.target.value):e.target.value)} placeholder={field.placeholder} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"/>}
      {field.helperText&&<p className="text-xs text-gray-500">{field.helperText}</p>}</div>
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between"><div className="flex items-center gap-4"><button onClick={()=>navigate({to:'/patients'})} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"><ArrowLeft className="h-5 w-5"/></button><div><h1 className="text-2xl font-semibold">New Patient</h1><p className="text-sm text-gray-500">Register a new patient</p></div></div></div>
      {error&&<div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
      <form onSubmit={handleSubmit}><Card><CardContent><div className="grid grid-cols-1 gap-4 md:grid-cols-2">{PatientUIConfig.formFields.create.map(renderField)}</div></CardContent></Card>
      <div className="mt-6 flex justify-end gap-3"><button type="button" onClick={()=>navigate({to:'/patients'})} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button><button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"><Save className="h-4 w-4"/>{saving?'Saving...':'Save Patient'}</button></div></form>
    </div>
  )
}
