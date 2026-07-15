/**
 * ─── Appointment Pages ───────────────────────────────────────
 */

import React, { useEffect, useState } from 'react'
import { Link, useParams, useNavigate } from '@tanstack/react-router'
import { Card, CardHeader, CardContent, cn } from '@repo/ui-core'
import { appointmentRepo } from '../../lib/db'
import { AppointmentUIConfig } from '@repo/entity-appointment'
import type { Appointment } from '@repo/entity-appointment'
import { APPOINTMENT_STATUS_LABELS, APPOINTMENT_TYPE_LABELS } from '@repo/entity-appointment'
import { Plus, Search, ArrowLeft, Calendar, Save } from 'lucide-react'

const TENANT_ID = 'default-tenant'

export function AppointmentListPage() {
  const [data, setData] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  useEffect(() => { appointmentRepo.findMany({ limit: 100 }).then(r => { setData('items' in r ? r.items : []); setLoading(false) }).catch(() => setLoading(false)) }, [])

  const filtered = search ? data.filter(d => d.reason.toLowerCase().includes(search.toLowerCase())) : data
  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div><h1 className="text-2xl font-semibold text-gray-900">Citas</h1><p className="text-sm text-gray-500">{data.length} citas registradas</p></div>
        <Link to="/appointments/new" className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"><Plus className="h-4 w-4"/>Nueva Cita</Link>
      </div>
      <div className="mb-4"><div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"/><input type="text" placeholder="Search appointment..." value={search} onChange={e=>setSearch(e.target.value)} className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"/></div></div>
      {loading ? <div className="space-y-3">{[1,2,3].map(i=><div key={i} className="h-16 animate-pulse rounded-lg bg-gray-100"/>)}</div>
      : filtered.length===0 ? <Card><CardContent><div className="py-12 text-center"><Calendar className="mx-auto h-12 w-12 text-gray-300"/><h3 className="mt-2 text-sm font-medium">Sin citas programadas</h3></div></CardContent></Card>
      : <div className="rounded-lg border border-gray-200 bg-white"><table className="min-w-full divide-y divide-gray-200"><thead className="bg-gray-50"><tr>{AppointmentUIConfig.defaultColumns.map(c=><th key={c.key as string} className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500" style={{width:c.width}}>{c.label}</th>)}</tr></thead><tbody className="divide-y divide-gray-200">{filtered.map(a=>(<tr key={a.id} className="cursor-pointer hover:bg-gray-50" onClick={()=>window.location.href=`/appointments/${a.id}`}><td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900">{new Date(a.scheduledStart).toLocaleString('es-MX')}</td><td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">{a.patientId.slice(0,8)}...</td><td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">{a.doctorId.slice(0,8)}...</td><td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">{APPOINTMENT_TYPE_LABELS[a.type]??a.type}</td><td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600 max-w-[200px] truncate">{a.reason}</td><td className="whitespace-nowrap px-4 py-3"><span className={cn('inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium',a.status==='completed'?'bg-purple-100 text-purple-800':a.status==='scheduled'?'bg-blue-100 text-blue-800':a.status==='confirmed'?'bg-green-100 text-green-800':a.status==='cancelled'?'bg-red-100 text-red-800':'bg-gray-100 text-gray-800')}>{APPOINTMENT_STATUS_LABELS[a.status]}</span></td><td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">{a.priority}</td></tr>))}</tbody></table></div>}
    </div>
  )
}

export function CreateAppointmentPage() {
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false); const [error, setError] = useState('')
  const [form, setForm] = useState<Record<string,unknown>>({patientId:'',doctorId:'',type:'consultation',scheduledStart:'',durationMinutes:30,reason:'',priority:'normal',room:'',notes:''})
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setSaving(true)
    try {
      const start = new Date(form.scheduledStart as string).getTime()
      const end = start + (form.durationMinutes as number)*60000
      const a = await appointmentRepo.create({tenantId:TENANT_ID,patientId:form.patientId as string,doctorId:form.doctorId as string,type:form.type as any,scheduledStart:start,scheduledEnd:end,durationMinutes:form.durationMinutes as number,reason:form.reason as string,priority:form.priority as any,notes:form.notes as string,room:form.room as string} as any)
      navigate({to:'/appointments/$id',params:{id:a.id}})
    } catch(err:any) { setError(err.message||'Error') } finally { setSaving(false) }
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center gap-4"><button onClick={()=>navigate({to:'/appointments'})} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"><ArrowLeft className="h-5 w-5"/></button><div><h1 className="text-2xl font-semibold">Nueva Cita</h1></div></div>
      {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
      <form onSubmit={handleSubmit}><Card><CardContent><div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {[{name:'patientId',label:'ID Paciente',type:'text',required:true},{name:'doctorId',label:'ID Doctor',type:'text',required:true},{name:'type',label:'Tipo',type:'select',options:[{label:'Consulta',value:'consultation'},{label:'Seguimiento',value:'follow_up'},{label:'Urgencia',value:'emergency'},{label:'Procedimiento',value:'procedure'}]},{name:'scheduledStart',label:'Fecha y Hora',type:'datetime-local',required:true},{name:'durationMinutes',label:'Duración (min)',type:'number',required:true},{name:'priority',label:'Prioridad',type:'select',options:[{label:'Normal',value:'normal'},{label:'Urgente',value:'urgent'},{label:'Emergencia',value:'emergency'}]},{name:'room',label:'Consultorio',type:'text'},{name:'reason',label:'Motivo',type:'textarea',required:true},{name:'notes',label:'Notas',type:'textarea'}].map(f=>(
        <div key={f.name} className={f.name==='reason'||f.name==='notes'?'col-span-full space-y-1':'space-y-1'}>
          <label className="block text-sm font-medium text-gray-700">{f.label}{f.required&&<span className="text-red-500 ml-1">*</span>}</label>
          {f.type==='select'?<select value={(form[f.name] as string)??''} onChange={e=>setForm(p=>({...p,[f.name]:e.target.value}))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"><option value="">Select...</option>{f.options?.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}</select>
          :f.type==='textarea'?<textarea value={(form[f.name] as string)??''} onChange={e=>setForm(p=>({...p,[f.name]:e.target.value}))} rows={3} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"/>
          :f.type==='datetime-local'?<input type="datetime-local" value={(form[f.name] as string)??''} onChange={e=>setForm(p=>({...p,[f.name]:e.target.value}))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"/>
          :<input type={f.type} value={(form[f.name] as string)??''} onChange={e=>setForm(p=>({...p,[f.name]:f.type==='number'?Number(e.target.value):e.target.value}))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"/>}
        </div>))}
      </div></CardContent></Card>
      <div className="mt-6 flex justify-end gap-3"><button type="button" onClick={()=>navigate({to:'/appointments'})} className="rounded-lg border px-4 py-2 text-sm">Cancel</button><button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50"><Save className="h-4 w-4"/>{saving?'Saving...':'Guardar Cita'}</button></div></form>
    </div>
  )
}

export function AppointmentDetailPage() {
  const { id } = useParams({ from: '/appointments/$id' }); const navigate = useNavigate()
  const [data, setData] = useState<Appointment | null>(null); const [loading, setLoading] = useState(true)
  useEffect(()=>{appointmentRepo.findById(id).then(setData).catch(console.error).finally(()=>setLoading(false))},[id])
  if(loading) return <div className="p-6"><div className="h-64 animate-pulse rounded-lg bg-gray-100"/></div>
  if(!data) return <div className="flex h-full items-center justify-center"><div className="text-center"><h2 className="text-2xl font-semibold">Cita no encontrada</h2><button onClick={()=>navigate({to:'/appointments'})} className="mt-4 rounded-lg bg-purple-600 px-4 py-2 text-sm text-white">Back</button></div></div>
  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between"><div className="flex items-center gap-4"><button onClick={()=>navigate({to:'/appointments'})} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"><ArrowLeft className="h-5 w-5"/></button><div><h1 className="text-2xl font-semibold">{APPOINTMENT_TYPE_LABELS[data.type]??data.type}</h1><p className="text-sm text-gray-500">{new Date(data.scheduledStart).toLocaleString('es-MX',{dateStyle:'long',timeStyle:'short'})}</p></div></div><span className={cn('rounded-full px-3 py-1 text-xs font-medium',data.status==='completed'?'bg-purple-100 text-purple-800':'bg-blue-100 text-blue-800')}>{APPOINTMENT_STATUS_LABELS[data.status]}</span></div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {AppointmentUIConfig.detailSections.map(s=>(<Card key={s.title}><CardHeader title={s.title}/><CardContent><dl className="divide-y divide-gray-100">{s.fields.map(f=>(<div key={f.key} className="flex justify-between py-2"><dt className="text-sm text-gray-500">{f.label}</dt><dd className="text-sm font-medium text-gray-900">{f.key==='scheduledStart'||f.key==='scheduledEnd'||f.key==='actualStart'||f.key==='actualEnd'?(data as any)[f.key]?new Date((data as any)[f.key]).toLocaleString('es-MX'):'-':f.key==='durationMinutes'?`${(data as any)[f.key]} min`:String((data as any)[f.key]??'-')}</dd></div>))}</dl></CardContent></Card>))}
      </div>
    </div>
  )
}
