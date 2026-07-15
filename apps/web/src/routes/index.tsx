/**
 * ─── Dashboard Page ──────────────────────────────────────────
 * ClinicMeta — Hospital, Pharmacy & Lab Management Dashboard
 */

import { useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Card, CardHeader, CardContent, cn } from '@repo/ui-core'
import { patientRepo, doctorRepo, appointmentRepo, billingRepo, inventoryRepo, pharmacyRepo, labRepo } from '../lib/db'
import { useOnlineStatus } from '@repo/ui-core'
import { useSyncStore } from '../store/app'
import { HeartPulse, Stethoscope, Calendar, Receipt, Package, PillBottle, Microscope, ArrowRight, Clock, DollarSign, Activity, AlertCircle, Pill, FileText, Settings } from 'lucide-react'

interface ClinicMetrics {
  totalPatients: number; totalDoctors: number; todayAppointments: number
  pendingPharmacy: number; pendingLab: number; pendingInvoices: number
  totalRevenue: number; lowStockItems: number
}

export function DashboardPage() {
  const [m, setM] = useState<ClinicMetrics>({ totalPatients:0,totalDoctors:0,todayAppointments:0,pendingPharmacy:0,pendingLab:0,pendingInvoices:0,totalRevenue:0,lowStockItems:0 })
  const [loading, setLoading] = useState(true)
  const { online } = useOnlineStatus()
  const { pendingCount, lastSyncAt } = useSyncStore()

  useEffect(() => {
    (async () => {
      try {
        const today = new Date(); today.setHours(0,0,0,0); const tm = today.getTime()
        const [tp, td, apr, invr, invt, por, lor] = await Promise.all([
          patientRepo.count({}), doctorRepo.count({}),
          appointmentRepo.findMany({ limit: 500 }), billingRepo.findMany({ limit: 500 }),
          inventoryRepo.findMany({ limit: 500 }), pharmacyRepo.findMany({ limit: 500 }),
          labRepo.findMany({ limit: 500 }),
        ])
        const apps = 'items' in apr ? apr.items : []; const invs = 'items' in invr ? invr.items : []
        const inventory = 'items' in invt ? invt.items : []
        const pharmOrders = 'items' in por ? por.items : []; const labOrders = 'items' in lor ? lor.items : []

        setM({
          totalPatients: tp, totalDoctors: td,
          todayAppointments: apps.filter((a:any)=>a.scheduledStart>=tm&&a.scheduledStart<tm+86400000).length,
          pendingPharmacy: pharmOrders.filter((o:any)=>!['dispensed','cancelled','rejected'].includes(o.status)).length,
          pendingLab: labOrders.filter((o:any)=>!['completed','cancelled'].includes(o.status)).length,
          pendingInvoices: invs.filter((i:any)=>!['paid','cancelled','refunded'].includes(i.status)).length,
          totalRevenue: invs.filter((i:any)=>i.status==='paid').reduce((s:number,i:any)=>s+(i.totalAmount??0),0),
          lowStockItems: inventory.filter((i:any)=>i.quantityOnHand<=0||(i.quantityOnHand>0&&i.quantityOnHand<=(i.minimumQuantity??10))).length,
        })
      } catch(e) { console.error(e) } finally { setLoading(false) }
    })()
  }, [])

  const cards = [
    { label:'Patients', value:String(m.totalPatients), icon:HeartPulse, color:'blue', link:'/patients' },
    { label:'Doctors', value:String(m.totalDoctors), icon:Stethoscope, color:'green', link:'/doctors' },
    { label:'Today\'s Appts', value:String(m.todayAppointments), icon:Calendar, color:'purple', link:'/appointments' },
    { label:'Pharmacy Orders', value:String(m.pendingPharmacy), subtext:'pending', icon:PillBottle, color:'green', link:'/pharmacy' },
    { label:'Lab Orders', value:String(m.pendingLab), subtext:'pending', icon:Microscope, color:'blue', link:'/laboratory' },
    { label:'Invoices Due', value:String(m.pendingInvoices), subtext:`$${m.totalRevenue.toLocaleString()} collected`, icon:Receipt, color:'yellow', link:'/billing' },
    { label:'Low Stock', value:String(m.lowStockItems), icon:Package, color:'red', link:'/inventory' },
  ]

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">{online?'Online':'Offline'} · {pendingCount} pending syncs{lastSyncAt?` · Last sync: ${new Date(lastSyncAt).toLocaleTimeString()}`:''}</p>
      </div>
      {m.lowStockItems > 0 && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-red-500" />
          <p className="text-sm font-medium text-red-800">{m.lowStockItems} item(s) low/out of stock. <Link to="/inventory" className="underline">Review inventory →</Link></p>
        </div>
      )}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        {cards.map(c=>(<Link key={c.label} to={c.link}><Card className="transition-shadow hover:shadow-md h-full"><div className="flex items-start justify-between"><div><p className="text-xs font-medium text-gray-500 uppercase">{c.label}</p><p className="mt-1 text-xl font-semibold text-gray-900">{c.value}</p>{c.subtext&&<p className="text-xs text-gray-400">{c.subtext}</p>}</div><div className={cn('rounded-xl p-2.5',c.color==='blue'?'bg-blue-100 text-blue-600':c.color==='green'?'bg-green-100 text-green-600':c.color==='purple'?'bg-purple-100 text-purple-600':c.color==='yellow'?'bg-yellow-100 text-yellow-600':c.color==='red'?'bg-red-100 text-red-600':'')}><c.icon className="h-5 w-5"/></div></div></Card></Link>))}
      </div>
      <Card><CardHeader title="Quick Actions" description="Common clinical tasks"/><CardContent>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[{label:'New Patient',icon:HeartPulse,to:'/patients/new',color:'blue'},{label:'Schedule Appointment',icon:Calendar,to:'/appointments/new',color:'purple'},{label:'New Lab Order',icon:Microscope,to:'/laboratory/new',color:'blue'},{label:'New Prescription',icon:Pill,to:'/prescriptions/new',color:'yellow'},{label:'Pharmacy Order',icon:PillBottle,to:'/pharmacy/new',color:'green'},{label:'New Invoice',icon:Receipt,to:'/billing/new',color:'yellow'},{label:'Medical Record',icon:FileText,to:'/medical-records/new',color:'red'},{label:'Settings',icon:Settings,to:'/settings',color:'gray'}].map(a=>(<Link key={a.label} to={a.to} className={cn('flex items-center gap-3 rounded-lg border border-gray-200 p-4 transition-colors',a.color==='blue'?'hover:border-blue-300 hover:bg-blue-50':a.color==='green'?'hover:border-green-300 hover:bg-green-50':a.color==='purple'?'hover:border-purple-300 hover:bg-purple-50':a.color==='red'?'hover:border-red-300 hover:bg-red-50':a.color==='yellow'?'hover:border-yellow-300 hover:bg-yellow-50':'hover:bg-gray-50')}><a.icon className={cn('h-5 w-5',a.color==='blue'?'text-blue-600':a.color==='green'?'text-green-600':a.color==='purple'?'text-purple-600':a.color==='red'?'text-red-600':a.color==='yellow'?'text-yellow-600':'text-gray-600')}/><div className="flex-1"><p className="text-sm font-medium text-gray-900">{a.label}</p></div><ArrowRight className="h-4 w-4 text-gray-400"/></Link>))}
        </div>
      </CardContent></Card>
    </div>
  )
}
