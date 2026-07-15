/**
 * ─── Clinic Settings Page (English) ──────────────────────────
 */

import React, { useEffect, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Card, CardHeader, CardContent } from '@repo/ui-core'
import { ArrowLeft, Save, Settings, Calendar, DollarSign, Stethoscope, Package, Workflow, Plus, Trash2 } from 'lucide-react'
import type { ClinicSettings, AppointmentTypeConfig, CustomFieldDefinition } from '@repo/clinic-config'
import { DEFAULT_APPOINTMENT_TYPES, DEFAULT_BILLING, DEFAULT_CLINICAL, DEFAULT_INVENTORY, DEFAULT_WORKFLOWS } from '@repo/clinic-config'

type SettingsTab = 'general' | 'appointments' | 'billing' | 'clinical' | 'inventory' | 'custom_fields' | 'workflows'

export function ClinicSettingsPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<SettingsTab>('general')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const [settings, setSettings] = useState<ClinicSettings>(() => {
    try { const saved = localStorage.getItem('clinicMetaSettings'); return saved ? JSON.parse(saved) : {} } catch { return {} }
  })

  const saveSettings = async () => {
    setSaving(true)
    try { localStorage.setItem('clinicMetaSettings', JSON.stringify(settings)); setMessage('Settings saved successfully'); setTimeout(()=>setMessage(''),3000) }
    catch { setMessage('Error saving') }
    finally { setSaving(false) }
  }

  const update = (path: string, value: unknown) => {
    setSettings(prev => { const clone = JSON.parse(JSON.stringify(prev)); const parts = path.split('.'); let obj=clone; for(let i=0;i<parts.length-1;i++){if(!obj[parts[i]])obj[parts[i]]={};obj=obj[parts[i]]} obj[parts[parts.length-1]]=value; return clone })
  }

  const tabs: Array<{key:SettingsTab;label:string;icon:React.ReactNode}> = [
    {key:'general',label:'General',icon:<Settings className="h-4 w-4"/>},{key:'appointments',label:'Appointments',icon:<Calendar className="h-4 w-4"/>},
    {key:'billing',label:'Billing',icon:<DollarSign className="h-4 w-4"/>},{key:'clinical',label:'Clinical',icon:<Stethoscope className="h-4 w-4"/>},
    {key:'inventory',label:'Inventory',icon:<Package className="h-4 w-4"/>},{key:'custom_fields',label:'Custom Fields',icon:<Plus className="h-4 w-4"/>},
    {key:'workflows',label:'Workflows',icon:<Workflow className="h-4 w-4"/>},
  ]

  const apt = settings.appointmentTypes ?? DEFAULT_APPOINTMENT_TYPES
  const bill = {...DEFAULT_BILLING,...settings.billing}
  const clin = {...DEFAULT_CLINICAL,...settings.clinical}
  const inv = {...DEFAULT_INVENTORY,...settings.inventory}
  const sched = settings.schedule ?? []
  const wfs = settings.workflows ?? DEFAULT_WORKFLOWS
  const mods = settings.modules ?? {}
  const clinic = settings.clinic ?? {name:'My Clinic',type:'consultorio' as const}

  const dayNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
  const entities = ['patient','doctor','appointment','medicalRecord','prescription','billing','inventory'] as const

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={()=>navigate({to:'/'})} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"><ArrowLeft className="h-5 w-5"/></button>
          <div><h1 className="text-2xl font-semibold">Clinic Settings</h1><p className="text-sm text-gray-500">Customize your clinic system</p></div>
        </div>
        <button onClick={saveSettings} disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"><Save className="h-4 w-4"/>{saving?'Saving...':'Save Settings'}</button>
      </div>
      {message&&<div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">{message}</div>}

      <div className="flex gap-6">
        <nav className="w-56 shrink-0 space-y-1">
          {tabs.map(t=>(<button key={t.key} onClick={()=>setActiveTab(t.key)} className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${activeTab===t.key?'bg-blue-50 text-blue-700':'text-gray-600 hover:bg-gray-100'}`}>{t.icon}{t.label}</button>))}
        </nav>
        <div className="flex-1 space-y-6">
          {activeTab==='general'&&<Card><CardHeader title="General Information" description="Clinic identity and modules"/><CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="Clinic Name" value={clinic.name} onChange={v=>update('clinic.name',v)}/>
              <Field label="Legal Name" value={clinic.legalName??''} onChange={v=>update('clinic.legalName',v)}/>
              <Field label="Tax ID" value={clinic.taxId??''} onChange={v=>update('clinic.taxId',v)}/>
              <div><label className="text-sm font-medium text-gray-700">Type</label><select value={clinic.type} onChange={e=>update('clinic.type',e.target.value)} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"><option value="consultorio">Office</option><option value="clinica">Clinic</option><option value="hospital">Hospital</option><option value="consultorio_dental">Dental Office</option><option value="laboratorio">Laboratory</option><option value="otro">Other</option></select></div>
              <Field label="Phone" value={clinic.phone??''} onChange={v=>update('clinic.phone',v)}/>
              <Field label="Email" value={clinic.email??''} onChange={v=>update('clinic.email',v)}/>
            </div>
            <h3 className="mt-8 mb-4 text-sm font-semibold uppercase tracking-wider text-gray-500">Enabled Modules</h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[{key:'prescriptions',label:'Prescriptions'},{key:'billing',label:'Billing'},{key:'inventory',label:'Inventory'},{key:'labOrders',label:'Lab Orders'},{key:'imaging',label:'Imaging'},{key:'surgery',label:'Surgery'},{key:'inpatient',label:'Inpatient'},{key:'telemedicine',label:'Telemedicine'},{key:'patientPortal',label:'Patient Portal'}].map(m=>(<Toggle key={m.key} label={m.label} value={(mods as any)[m.key]??(['prescriptions','billing','inventory'].includes(m.key))} onChange={v=>update(`modules.${m.key}`,v)}/>))}
            </div>
          </CardContent></Card>}

          {activeTab==='appointments'&&<div className="space-y-6">
            <Card><CardHeader title="Appointment Types" description="Define available appointment types"/><CardContent><div className="space-y-4">
              {apt.map((a:any,i:number)=>(<div key={a.key} className="rounded-lg border border-gray-200 p-4"><div className="grid grid-cols-2 gap-3 sm:grid-cols-6">
                <Field label="Key" value={a.key} small onChange={v=>{const t=[...apt];t[i]={...t[i],key:v};update('appointmentTypes',t)}}/>
                <Field label="Label" value={a.label} small onChange={v=>{const t=[...apt];t[i]={...t[i],label:v};update('appointmentTypes',t)}}/>
                <Field label="Duration (min)" value={String(a.defaultDuration)} small type="number" onChange={v=>{const t=[...apt];t[i]={...t[i],defaultDuration:Number(v)};update('appointmentTypes',t)}}/>
                <Field label="Color" value={a.color} small onChange={v=>{const t=[...apt];t[i]={...t[i],color:v};update('appointmentTypes',t)}}/>
                <Field label="Base Price" value={String(a.basePrice??'')} small type="number" onChange={v=>{const t=[...apt];t[i]={...t[i],basePrice:v?Number(v):undefined};update('appointmentTypes',t)}}/>
                <Toggle label="Online Booking" value={a.allowOnlineBooking} onChange={v=>{const t=[...apt];t[i]={...t[i],allowOnlineBooking:v};update('appointmentTypes',t)}}/>
              </div></div>))}
            </div></CardContent></Card>
            <Card><CardHeader title="Operating Hours"/><CardContent>
              {dayNames.map((day,idx)=>{const ds=sched.filter((s:any)=>s.dayOfWeek===idx)
                return (<div key={day} className="flex items-center gap-4 py-2 border-b border-gray-100 last:border-0"><span className="w-24 text-sm font-medium text-gray-700">{day}</span><Toggle label="" value={ds.some((s:any)=>s.isOpen)} onChange={v=>{const ns=[...sched];if(v){ns.push({dayOfWeek:idx,isOpen:true,openTime:'08:00',closeTime:'17:00',blockedRanges:[]})}else{const f=ns.filter((x:any)=>x.dayOfWeek!==idx);update('schedule',f);return};update('schedule',ns)}}/>{ds.some((s:any)=>s.isOpen)&&<input type="text" placeholder="08:00-17:00" value={ds.map((s:any)=>`${s.openTime}-${s.closeTime}`).join(', ')} className="rounded border border-gray-300 px-2 py-1 text-xs w-48" readOnly/>}</div>)})}
            </CardContent></Card>
          </div>}

          {activeTab==='billing'&&<Card><CardHeader title="Billing Configuration"/><CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Currency" value={bill.currency} onChange={v=>update('billing.currency',v)}/>
            <Field label="Tax Rate" value={String(bill.defaultTaxRate)} type="number" onChange={v=>update('billing.defaultTaxRate',Number(v))}/>
            <Field label="Payment Terms (days)" value={String(bill.defaultPaymentTerms)} type="number" onChange={v=>update('billing.defaultPaymentTerms',Number(v))}/>
            <Field label="Default Consult Price" value={String(bill.defaultConsultationPrice??'')} type="number" onChange={v=>update('billing.defaultConsultationPrice',v?Number(v):undefined)}/>
            <Field label="Invoice Prefix" value={bill.invoicePrefix} onChange={v=>update('billing.invoicePrefix',v)}/>
            <Field label="Invoice Start #" value={String(bill.invoiceStartNumber)} type="number" onChange={v=>update('billing.invoiceStartNumber',Number(v))}/>
            <Toggle label="Enable CFDI (E-Invoicing)" value={bill.enableCFDI} onChange={v=>update('billing.enableCFDI',v)}/>
            <Toggle label="Auto-generate Invoice After Consult" value={bill.autoGenerateAfterConsultation} onChange={v=>update('billing.autoGenerateAfterConsultation',v)}/>
          </CardContent></Card>}

          {activeTab==='clinical'&&<Card><CardHeader title="Clinical Configuration"/><CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Default Follow-up (days)" value={String(clin.defaultFollowUpDays)} type="number" onChange={v=>update('clinical.defaultFollowUpDays',Number(v))}/>
            <div><label className="text-sm font-medium text-gray-700">Diagnosis Coding</label><select value={clin.cieVersion} onChange={e=>update('clinical.cieVersion',e.target.value)} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"><option value="CIE-10">ICD-10</option><option value="CIE-11">ICD-11</option></select></div>
            <Toggle label="Require Vital Signs" value={clin.requireVitalSigns} onChange={v=>update('clinical.requireVitalSigns',v)}/>
            <Toggle label="Require Diagnosis" value={clin.requireDiagnosis} onChange={v=>update('clinical.requireDiagnosis',v)}/>
            <Toggle label="Check Drug Interactions" value={clin.enableDrugInteractionCheck} onChange={v=>update('clinical.enableDrugInteractionCheck',v)}/>
            <Toggle label="Require Informed Consent" value={clin.requireConsent} onChange={v=>update('clinical.requireConsent',v)}/>
          </CardContent></Card>}

          {activeTab==='inventory'&&<Card><CardHeader title="Inventory Configuration"/><CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Reorder Threshold (%)" value={String(inv.defaultReorderThreshold)} type="number" onChange={v=>update('inventory.defaultReorderThreshold',Number(v))}/>
            <Field label="Expiry Warning (days)" value={String(inv.expiryWarningDays)} type="number" onChange={v=>update('inventory.expiryWarningDays',Number(v))}/>
            <Toggle label="Auto-decrement on Dispense" value={inv.autoDecrementOnDispense} onChange={v=>update('inventory.autoDecrementOnDispense',v)}/>
            <Toggle label="Track Lot Numbers" value={inv.trackLotNumbers} onChange={v=>update('inventory.trackLotNumbers',v)}/>
            <Toggle label="Track Expiration Dates" value={inv.trackExpirationDates} onChange={v=>update('inventory.trackExpirationDates',v)}/>
            <Toggle label="Require Auth for Controlled Substances" value={inv.requireAuthForControlled} onChange={v=>update('inventory.requireAuthForControlled',v)}/>
          </CardContent></Card>}

          {activeTab==='custom_fields'&&<Card><CardHeader title="Custom Fields" description="Add custom fields to entities without modifying code"/><CardContent>
            {entities.map(entity=>{const fields=settings.customFields?.[entity]??[]
              return (<div key={entity} className="mb-6 border-b border-gray-100 pb-6 last:border-0">
                <h3 className="mb-3 text-sm font-semibold capitalize text-gray-700">{entity==='medicalRecord'?'Medical Record':entity==='billing'?'Billing':entity==='prescription'?'Prescription':entity==='appointment'?'Appointment':entity==='inventory'?'Inventory':entity==='doctor'?'Doctor':'Patient'}</h3>
                {fields.length===0?<p className="text-xs text-gray-400">No custom fields</p>:<div className="space-y-2">{fields.map((f:CustomFieldDefinition,i:number)=>(<div key={f.key} className="flex items-center gap-2 rounded bg-gray-50 px-3 py-2 text-xs"><span className="font-medium">{f.label}</span><span className="text-gray-400">({f.key})</span><span className="text-gray-400">[{f.type}]</span>{f.required&&<span className="text-red-500">*</span>}<button onClick={()=>{const cf={...(settings.customFields??{})} as any;cf[entity]=fields.filter((_:any,j:number)=>j!==i);update('customFields',cf)}} className="ml-auto text-red-400 hover:text-red-600"><Trash2 className="h-3 w-3"/></button></div>))}</div>}
                <button onClick={()=>{const cf={...(settings.customFields??{})} as any;const nf:CustomFieldDefinition={key:`custom_${entity}_${Date.now()}`,label:'New Field',type:'text',order:fields.length};cf[entity]=[...fields,nf];update('customFields',cf)}} className="mt-2 inline-flex items-center gap-1 rounded border border-dashed border-gray-300 px-3 py-1 text-xs text-gray-500 hover:border-blue-400 hover:text-blue-600"><Plus className="h-3 w-3"/>Add Field to {entity}</button>
              </div>)})}
          </CardContent></Card>}

          {activeTab==='workflows'&&<Card><CardHeader title="Workflows" description="Automate clinical processes"/><CardContent><div className="space-y-4">
            {wfs.map((wf:any,i:number)=>(<div key={wf.name} className="rounded-lg border border-gray-200 p-4"><div className="flex items-center justify-between mb-2"><h3 className="text-sm font-medium text-gray-900">{wf.name}</h3><Toggle label="" value={wf.enabled} onChange={v=>{const w=[...wfs];w[i]={...w[i],enabled:v};update('workflows',w)}}/></div>{wf.description&&<p className="text-xs text-gray-500 mb-2">{wf.description}</p>}<div className="text-xs text-gray-400">Trigger: {wf.trigger.entity}.{wf.trigger.event}{wf.trigger.status&&` → status="${wf.trigger.status}"`}</div><div className="mt-1 text-xs text-gray-400">Actions: {wf.actions.map((a:any)=>a.type).join(' → ')}</div></div>))}
          </div></CardContent></Card>}
        </div>
      </div>
    </div>
  )
}

function Field({label,value,onChange,type='text',small}:{label:string;value:string;onChange:(v:string)=>void;type?:string;small?:boolean}) {
  return <div><label className={`${small?'text-xs':'text-sm'} font-medium text-gray-700`}>{label}</label><input type={type} value={value} onChange={e=>onChange(e.target.value)} className={`mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 ${small?'text-xs':'text-sm'} focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500`}/></div>
}

function Toggle({label,value,onChange}:{label:string;value:boolean;onChange:(v:boolean)=>void}) {
  return <div className="flex items-center justify-between">{label&&<span className="text-sm text-gray-700">{label}</span>}<button type="button" onClick={()=>onChange(!value)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${value?'bg-blue-600':'bg-gray-300'}`}><span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${value?'translate-x-6':'translate-x-1'}`}/></button></div>
}
