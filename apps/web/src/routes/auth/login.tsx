/**
 * ─── Login Page (English) ────────────────────────────────────
 */

import React, { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useAuth, DEMO_CREDENTIALS, type ClinicRole } from '../../hooks/useAuth'
import { HeartPulse, LogIn, AlertCircle, ChevronRight } from 'lucide-react'

export function LoginPage() {
  const navigate = useNavigate()
  const { login, isLoading, error, clearError } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showDemo, setShowDemo] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => { e.preventDefault(); clearError(); await login(email, password) }
  const handleDemoLogin = async (e: string, p: string) => { clearError(); await login(e, p) }

  const roleColors: Record<ClinicRole, string> = {
    superadmin:'bg-purple-100 text-purple-800 border-purple-300',admin:'bg-blue-100 text-blue-800 border-blue-300',
    doctor:'bg-green-100 text-green-800 border-green-300',nurse:'bg-teal-100 text-teal-800 border-teal-300',
    pharmacist:'bg-amber-100 text-amber-800 border-amber-300',billing:'bg-yellow-100 text-yellow-800 border-yellow-300',
    receptionist:'bg-indigo-100 text-indigo-800 border-indigo-300',user:'bg-gray-100 text-gray-800 border-gray-300',
  }
  const roleLabels: Record<ClinicRole, string> = {
    superadmin:'Super Admin',admin:'Administrator',doctor:'Doctor',nurse:'Nurse',
    pharmacist:'Pharmacist',billing:'Billing',receptionist:'Receptionist',user:'User',
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-50 p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 shadow-lg"><HeartPulse className="h-8 w-8 text-white"/></div>
          <h1 className="mt-4 text-2xl font-bold text-gray-900">ClinicMeta</h1>
          <p className="mt-1 text-sm text-gray-500">Hospital, Pharmacy & Laboratory Management System</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
          {error&&<div className="mb-4 flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"><AlertCircle className="h-5 w-5 shrink-0 text-red-400"/>{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><label className="block text-sm font-medium text-gray-700">Email</label><input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="admin@clinicmeta.local" className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" required/></div>
            <div><label className="block text-sm font-medium text-gray-700">Password</label><input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" required/></div>
            <button type="submit" disabled={isLoading} className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"><LogIn className="h-4 w-4"/>{isLoading?'Signing in...':'Sign In'}</button>
          </form>
          <div className="mt-6 border-t border-gray-100 pt-4">
            <button onClick={()=>setShowDemo(!showDemo)} className="flex w-full items-center justify-between text-sm text-gray-500 hover:text-gray-700"><span>Demo accounts</span><ChevronRight className={`h-4 w-4 transition-transform ${showDemo?'rotate-90':''}`}/></button>
            {showDemo&&<div className="mt-3 space-y-2">{DEMO_CREDENTIALS.map(c=>(<button key={c.email} onClick={()=>handleDemoLogin(c.email,c.password)} disabled={isLoading} className="flex w-full items-center gap-3 rounded-lg border border-gray-200 p-3 text-left transition-colors hover:border-blue-300 hover:bg-blue-50 disabled:opacity-50"><div className="flex-1"><p className="text-sm font-medium text-gray-900">{c.label}</p><p className="text-xs text-gray-400">{c.email}</p></div><span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${roleColors[c.role]??''}`}>{roleLabels[c.role]??c.role}</span></button>))}</div>}
          </div>
          <p className="mt-4 text-center text-xs text-gray-400">Development environment — use demo accounts</p>
        </div>
      </div>
    </div>
  )
}
