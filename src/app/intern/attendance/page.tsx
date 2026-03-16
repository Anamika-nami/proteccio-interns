'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { AppProvider } from '@/context/AppContext'
import AppShell from '@/components/layout/AppShell'
import toast from 'react-hot-toast'

type AttendanceRecord = {
  id: string
  date: string
  check_in_time: string | null
  check_out_time: string | null
  status: string
  working_hours: number
}

function AttendanceContent() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [internId, setInternId] = useState<string | null>(null)
  const [todayAttendance, setTodayAttendance] = useState<AttendanceRecord | null>(null)
  const [history, setHistory] = useState<AttendanceRecord[]>([])
  const [summary, setSummary] = useState<any>(null)
  const [checkingIn, setCheckingIn] = useState(false)
  const [checkingOut, setCheckingOut] = useState(false)

  useEffect(() => {
    let mounted = true
    const supabase = createClient()
    
    supabase.auth.getUser().then(({ data, error }) => {
      if (!mounted) return
      if (error || !data.user) {
        router.push('/admin/login')
        return
      }
      loadInternProfile(data.user.id)
    })

    return () => { mounted = false }
  }, [])

  async function loadInternProfile(userId: string) {
    const supabase = createClient()
    const { data: profile } = await supabase
      .from('intern_profiles')
      .select('id')
      .eq('user_id', userId)
      .single()

    if (profile) {
      setInternId(profile.id)
      loadAttendanceData(profile.id)
    } else {
      setLoading(false)
      toast.error('Intern profile not found')
    }
  }

  async function loadAttendanceData(internId: string) {
    setLoading(true)
    try {
      const today = new Date().toISOString().split('T')[0]
      
      // Get today's attendance
      const supabase = createClient()
      const { data: todayData } = await supabase
        .from('attendance')
        .select('*')
        .eq('intern_id', internId)
        .eq('date', today)
        .single()

      setTodayAttendance(todayData)

      // Get attendance history
      const res = await fetch(`/api/attendance/history/${internId}?limit=30`)
      const historyData = await res.json()
      
      setHistory(historyData.data || [])
      setSummary(historyData.summary || null)

    } catch (error) {
      console.error('Load error:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleCheckIn() {
    if (!internId) return
    
    setCheckingIn(true)
    try {
      const today = new Date().toISOString().split('T')[0]
      const res = await fetch('/api/attendance/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intern_id: internId, date: today })
      })

      const data = await res.json()
      
      if (res.ok) {
        toast.success(data.message || 'Checked in successfully')
        loadAttendanceData(internId)
      } else {
        toast.error(data.error || 'Check-in failed')
      }
    } catch (error) {
      toast.error('Check-in failed')
    } finally {
      setCheckingIn(false)
    }
  }

  async function handleCheckOut() {
    if (!todayAttendance?.id) return
    
    setCheckingOut(true)
    try {
      const res = await fetch('/api/attendance/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attendance_id: todayAttendance.id })
      })

      const data = await res.json()
      
      if (res.ok) {
        toast.success(data.message || 'Checked out successfully')
        loadAttendanceData(internId!)
      } else {
        toast.error(data.error || 'Check-out failed')
      }
    } catch (error) {
      toast.error('Check-out failed')
    } finally {
      setCheckingOut(false)
    }
  }

  const statusColor: Record<string, string> = {
    present: 'bg-green-900 text-green-300 border-green-700',
    absent: 'bg-red-900 text-red-300 border-red-700',
    half_day: 'bg-yellow-900 text-yellow-300 border-yellow-700',
    leave: 'bg-blue-900 text-blue-300 border-blue-700',
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 animate-pulse h-48" />
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 animate-pulse h-64" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      
      {/* Today's Attendance Card */}
      <div className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 border border-blue-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-200 mb-4">Today's Attendance</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-900/50 rounded-lg p-4">
            <p className="text-xs text-gray-400 mb-1">Status</p>
            {todayAttendance ? (
              <span className={`inline-block text-sm px-3 py-1 rounded-full border ${statusColor[todayAttendance.status]}`}>
                {todayAttendance.status.replace('_', ' ').toUpperCase()}
              </span>
            ) : (
              <span className="text-sm text-gray-500">Not checked in</span>
            )}
          </div>
          
          <div className="bg-gray-900/50 rounded-lg p-4">
            <p className="text-xs text-gray-400 mb-1">Check-in Time</p>
            <p className="text-sm text-gray-200">
              {todayAttendance?.check_in_time 
                ? new Date(todayAttendance.check_in_time).toLocaleTimeString()
                : '—'}
            </p>
          </div>
          
          <div className="bg-gray-900/50 rounded-lg p-4">
            <p className="text-xs text-gray-400 mb-1">Check-out Time</p>
            <p className="text-sm text-gray-200">
              {todayAttendance?.check_out_time 
                ? new Date(todayAttendance.check_out_time).toLocaleTimeString()
                : '—'}
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleCheckIn}
            disabled={checkingIn || (todayAttendance?.check_in_time !== null)}
            className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:text-gray-500 px-6 py-3 rounded-lg font-medium transition-colors"
          >
            {checkingIn ? 'Checking in...' : todayAttendance?.check_in_time ? '✓ Checked In' : 'Check In'}
          </button>
          
          <button
            onClick={handleCheckOut}
            disabled={checkingOut || !todayAttendance?.check_in_time || todayAttendance?.check_out_time !== null}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 px-6 py-3 rounded-lg font-medium transition-colors"
          >
            {checkingOut ? 'Checking out...' : todayAttendance?.check_out_time ? '✓ Checked Out' : 'Check Out'}
          </button>
        </div>

        {todayAttendance?.working_hours && todayAttendance.working_hours > 0 && (
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-400">
              Hours worked today: <span className="text-blue-400 font-semibold">{todayAttendance.working_hours.toFixed(2)}</span>
            </p>
          </div>
        )}
      </div>

      {/* Summary Statistics */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Attendance %', value: `${summary.attendance_percentage}%`, color: 'text-green-400' },
            { label: 'Present Days', value: summary.present, color: 'text-blue-400' },
            { label: 'Total Hours', value: summary.total_hours.toFixed(1), color: 'text-purple-400' },
            { label: 'Total Days', value: summary.total_days, color: 'text-gray-400' },
          ].map(stat => (
            <div key={stat.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <p className="text-xs text-gray-400 mb-1">{stat.label}</p>
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Attendance History */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-800">
          <h3 className="font-semibold text-gray-300 text-sm">Attendance History</h3>
        </div>
        
        {history.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <p className="text-gray-400 text-sm">No attendance records yet</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-800">
            {history.map(record => (
              <div key={record.id} className="px-5 py-3 flex items-center gap-4 hover:bg-gray-800/50 transition-colors">
                <div className="flex-1">
                  <p className="text-sm text-gray-200 font-medium">
                    {new Date(record.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </p>
                  <p className="text-xs text-gray-500">
                    {record.check_in_time && `In: ${new Date(record.check_in_time).toLocaleTimeString()}`}
                    {record.check_out_time && ` • Out: ${new Date(record.check_out_time).toLocaleTimeString()}`}
                  </p>
                </div>
                
                <span className={`text-xs px-3 py-1 rounded-full border ${statusColor[record.status]}`}>
                  {record.status.replace('_', ' ')}
                </span>
                
                {record.working_hours > 0 && (
                  <span className="text-xs text-gray-400 w-16 text-right">
                    {record.working_hours.toFixed(1)}h
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}

export default function AttendancePage() {
  return (
    <AppProvider>
      <AppShell role="intern" title="Attendance" breadcrumbs={[{ label: 'Intern' }, { label: 'Attendance' }]}>
        <AttendanceContent />
      </AppShell>
    </AppProvider>
  )
}
