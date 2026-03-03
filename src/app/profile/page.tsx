'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { AppProvider } from '@/context/AppContext'
import AppShell from '@/components/layout/AppShell'
import toast from 'react-hot-toast'

type Tab = 'profile' | 'security' | 'privacy' | 'notifications' | 'personalization' | 'activity'

type ProfileData = {
  profile: any
  privacy: any
  notifications: any
  preferences: any
  dataRequests: any[]
  activityLogs: any[]
}

function ProfileContent() {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('profile')
  const [data, setData] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Profile form
  const [profileForm, setProfileForm] = useState({ display_name: '', phone: '', bio: '' })
  // Security form
  const [pwForm, setPwForm] = useState({ password: '', confirm: '' })
  const [twoFAEnabled, setTwoFAEnabled] = useState(false)
  // Privacy form
  const [privacyForm, setPrivacyForm] = useState({ show_email: false, show_phone: false, show_bio: true, data_sharing_internal: true, allow_analytics: true })
  // Notification form
  const [notifForm, setNotifForm] = useState({ email_notifications: true, inapp_notifications: true, frequency: 'instant', system_alerts: true })
  // Preferences form
  const [prefForm, setPrefForm] = useState({ theme: 'dark', landing_page: '/admin/dashboard', language: 'en' })

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: auth }) => {
      if (!auth.user) router.push('/admin/login')
      else loadProfile()
    })
  }, [])

  async function loadProfile() {
    try {
      const res = await fetch('/api/profile')
      const json = await res.json()
      setData(json)
      if (json.profile) {
        setProfileForm({ display_name: json.profile.display_name || '', phone: json.profile.phone || '', bio: json.profile.bio || '' })
      }
      if (json.privacy) setPrivacyForm(json.privacy)
      if (json.notifications) setNotifForm(json.notifications)
      if (json.preferences) setPrefForm(json.preferences)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  async function save(section: string, payload: any) {
    setSaving(true)
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section, ...payload }),
      })
      if (res.ok) { toast.success('Saved'); loadProfile() }
      else { const e = await res.json(); toast.error(e.error || 'Failed') }
    } finally {
      setSaving(false)
    }
  }

  async function changePassword() {
    if (pwForm.password !== pwForm.confirm) { toast.error('Passwords do not match'); return }
    if (pwForm.password.length < 8) { toast.error('Minimum 8 characters'); return }
    setSaving(true)
    const res = await fetch('/api/profile/change-password', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: pwForm.password }),
    })
    if (res.ok) { toast.success('Password updated'); setPwForm({ password: '', confirm: '' }) }
    else { const e = await res.json(); toast.error(e.error || 'Failed') }
    setSaving(false)
  }

  async function submitDataRequest(type: 'export' | 'deletion') {
    const confirmed = confirm(`Submit a ${type} request? This will be reviewed by an admin.`)
    if (!confirmed) return
    const res = await fetch('/api/profile/data-request', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ request_type: type }),
    })
    if (res.ok) { toast.success(`${type} request submitted`); loadProfile() }
    else toast.error('Failed to submit request')
  }

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'profile', label: 'Profile', icon: '👤' },
    { id: 'security', label: 'Security', icon: '🔐' },
    { id: 'privacy', label: 'Privacy', icon: '🛡' },
    { id: 'notifications', label: 'Notifications', icon: '🔔' },
    { id: 'personalization', label: 'Personalization', icon: '🎨' },
    { id: 'activity', label: 'Activity', icon: '📋' },
  ]

  if (loading) return (
    <div className="space-y-4">
      {[...Array(4)].map((_, i) => <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-6 animate-pulse h-20" />)}
    </div>
  )

  return (
    <div className="space-y-6">

      {/* Tab Bar */}
      <div className="flex gap-1 border-b border-gray-800 overflow-x-auto">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-t
              ${tab === t.id ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-white'}`}>
            <span>{t.icon}</span>{t.label}
          </button>
        ))}
      </div>

      {/* ── PROFILE TAB ── */}
      {tab === 'profile' && (
        <div className="space-y-6">
          {/* Read-only system fields */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h3 className="font-semibold text-gray-300 text-sm mb-4">System Information <span className="text-xs text-gray-500 font-normal ml-1">(read-only)</span></h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { label: 'User ID', value: data?.profile?.id },
                { label: 'Email', value: data?.profile?.email },
                { label: 'Role', value: data?.profile?.role },
                { label: 'Member Since', value: data?.profile?.created_at ? new Date(data.profile.created_at).toLocaleDateString() : '—' },
              ].map(f => (
                <div key={f.label}>
                  <p className="text-xs text-gray-500 mb-1">{f.label}</p>
                  <p className="text-sm text-gray-300 bg-gray-800 rounded-lg px-3 py-2 font-mono truncate">{f.value || '—'}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Editable fields */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h3 className="font-semibold text-gray-300 text-sm mb-4">Personal Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Display Name</label>
                <input value={profileForm.display_name} onChange={e => setProfileForm(p => ({ ...p, display_name: e.target.value }))}
                  placeholder="Your display name"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Phone</label>
                <input value={profileForm.phone} onChange={e => setProfileForm(p => ({ ...p, phone: e.target.value }))}
                  placeholder="+1 234 567 8900"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs text-gray-400 mb-1 block">Bio</label>
                <textarea value={profileForm.bio} onChange={e => setProfileForm(p => ({ ...p, bio: e.target.value }))}
                  placeholder="A short bio..." rows={3}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
            </div>
            <div className="mt-4">
              <button onClick={() => save('profile', profileForm)} disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-5 py-2 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500">
                {saving ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── SECURITY TAB ── */}
      {tab === 'security' && (
        <div className="space-y-5">
          {/* Last login info */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h3 className="font-semibold text-gray-300 text-sm mb-4">Session Information</h3>
            <div className="space-y-3">
              {[
                { label: 'Last Login', value: data?.profile?.last_login ? new Date(data.profile.last_login).toLocaleString() : 'Not recorded' },
                { label: 'Last Login IP', value: data?.profile?.last_login_ip || 'Not recorded' },
                { label: 'Current Session', value: 'Active — This device' },
                { label: 'Account Email', value: data?.profile?.email },
              ].map(f => (
                <div key={f.label} className="flex justify-between py-2 border-b border-gray-800 last:border-0">
                  <span className="text-sm text-gray-400">{f.label}</span>
                  <span className="text-sm text-gray-200">{f.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Change password */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h3 className="font-semibold text-gray-300 text-sm mb-4">Change Password</h3>
            <div className="space-y-3 max-w-sm">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">New Password</label>
                <input type="password" value={pwForm.password} onChange={e => setPwForm(p => ({ ...p, password: e.target.value }))}
                  placeholder="Min 8 characters"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Confirm Password</label>
                <input type="password" value={pwForm.confirm} onChange={e => setPwForm(p => ({ ...p, confirm: e.target.value }))}
                  placeholder="Repeat password"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <button onClick={changePassword} disabled={saving || !pwForm.password}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-5 py-2 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500">
                {saving ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </div>

          {/* 2FA toggle (simulation) */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h3 className="font-semibold text-gray-300 text-sm mb-4">Two-Factor Authentication</h3>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-300">Enable 2FA</p>
                <p className="text-xs text-gray-500 mt-0.5">Adds an extra layer of security to your account</p>
              </div>
              <button onClick={() => { setTwoFAEnabled(!twoFAEnabled); toast.success(twoFAEnabled ? '2FA disabled' : '2FA enabled (simulation)') }}
                className={`relative w-10 h-5 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${twoFAEnabled ? 'bg-blue-600' : 'bg-gray-600'}`}>
                <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${twoFAEnabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>
            </div>
            {twoFAEnabled && (
              <div className="mt-3 p-3 bg-blue-900/20 border border-blue-800 rounded-lg">
                <p className="text-xs text-blue-400">2FA is enabled. In production, this would trigger an authenticator app setup flow.</p>
              </div>
            )}
          </div>

          {/* Logout all sessions */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h3 className="font-semibold text-gray-300 text-sm mb-2">Danger Zone</h3>
            <p className="text-xs text-gray-500 mb-4">These actions affect your account security.</p>
            <button onClick={async () => {
              if (!confirm('Sign out from all sessions?')) return
              const supabase = createClient()
              await supabase.auth.signOut({ scope: 'global' })
              toast.success('Signed out from all sessions')
              window.location.href = '/admin/login'
            }} className="text-sm text-red-400 border border-red-900 hover:border-red-700 px-4 py-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500">
              Sign Out All Sessions
            </button>
          </div>
        </div>
      )}

      {/* ── PRIVACY TAB ── */}
      {tab === 'privacy' && (
        <div className="space-y-5">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h3 className="font-semibold text-gray-300 text-sm mb-4">Profile Visibility</h3>
            <div className="space-y-3">
              {[
                { key: 'show_email', label: 'Show email to other users' },
                { key: 'show_phone', label: 'Show phone number to other users' },
                { key: 'show_bio', label: 'Show bio publicly' },
              ].map(item => (
                <div key={item.key} className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">{item.label}</span>
                  <button onClick={() => setPrivacyForm(p => ({ ...p, [item.key]: !p[item.key as keyof typeof p] }))}
                    className={`relative w-10 h-5 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${privacyForm[item.key as keyof typeof privacyForm] ? 'bg-blue-600' : 'bg-gray-600'}`}>
                    <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${privacyForm[item.key as keyof typeof privacyForm] ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h3 className="font-semibold text-gray-300 text-sm mb-4">Data Sharing</h3>
            <div className="space-y-3">
              {[
                { key: 'data_sharing_internal', label: 'Share data within organisation' },
                { key: 'allow_analytics', label: 'Allow anonymised analytics' },
              ].map(item => (
                <div key={item.key} className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">{item.label}</span>
                  <button onClick={() => setPrivacyForm(p => ({ ...p, [item.key]: !p[item.key as keyof typeof p] }))}
                    className={`relative w-10 h-5 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${privacyForm[item.key as keyof typeof privacyForm] ? 'bg-blue-600' : 'bg-gray-600'}`}>
                    <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${privacyForm[item.key as keyof typeof privacyForm] ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </button>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <button onClick={() => save('privacy', privacyForm)} disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-5 py-2 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500">
                {saving ? 'Saving...' : 'Save Privacy Settings'}
              </button>
            </div>
          </div>

          {/* Consent history */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h3 className="font-semibold text-gray-300 text-sm mb-4">Consent History</h3>
            <a href="/admin/consent-logs" className="text-sm text-blue-400 hover:text-blue-300 transition-colors">View full consent log →</a>
          </div>

          {/* Data requests */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h3 className="font-semibold text-gray-300 text-sm mb-2">Your Data Rights</h3>
            <p className="text-xs text-gray-500 mb-4">Submit requests to exercise your data rights. Requests are reviewed within 30 days.</p>
            <div className="flex gap-3 flex-wrap">
              <button onClick={() => submitDataRequest('export')}
                className="text-sm text-green-400 border border-green-800 hover:border-green-600 px-4 py-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-green-500">
                Request Data Export
              </button>
              <button onClick={() => submitDataRequest('deletion')}
                className="text-sm text-red-400 border border-red-900 hover:border-red-700 px-4 py-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500">
                Request Account Deletion
              </button>
            </div>
            {data?.dataRequests && data.dataRequests.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-xs text-gray-500 uppercase tracking-wider">Previous Requests</p>
                {data.dataRequests.map((r: any) => (
                  <div key={r.id} className="flex justify-between items-center text-sm py-2 border-b border-gray-800 last:border-0">
                    <span className="text-gray-300 capitalize">{r.request_type}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${r.status === 'completed' ? 'bg-green-900 text-green-300 border-green-700' : r.status === 'rejected' ? 'bg-red-900 text-red-300 border-red-700' : 'bg-yellow-900 text-yellow-300 border-yellow-700'}`}>
                      {r.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── NOTIFICATIONS TAB ── */}
      {tab === 'notifications' && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-5">
          <h3 className="font-semibold text-gray-300 text-sm">Notification Preferences</h3>
          <div className="space-y-4">
            {[
              { key: 'email_notifications', label: 'Email Notifications', desc: 'Receive notifications via email' },
              { key: 'inapp_notifications', label: 'In-App Notifications', desc: 'Show notifications inside the app' },
              { key: 'system_alerts', label: 'System Alerts', desc: 'Critical system and security alerts' },
            ].map(item => (
              <div key={item.key} className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-300">{item.label}</p>
                  <p className="text-xs text-gray-500">{item.desc}</p>
                </div>
                <button onClick={() => setNotifForm(p => ({ ...p, [item.key]: !p[item.key as keyof typeof p] }))}
                  className={`relative w-10 h-5 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${notifForm[item.key as keyof typeof notifForm] ? 'bg-blue-600' : 'bg-gray-600'}`}>
                  <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${notifForm[item.key as keyof typeof notifForm] ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
              </div>
            ))}
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-2 block">Notification Frequency</label>
            <div className="flex gap-2">
              {['instant', 'daily', 'weekly'].map(f => (
                <button key={f} onClick={() => setNotifForm(p => ({ ...p, frequency: f }))}
                  className={`px-4 py-2 rounded-lg text-sm capitalize transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${notifForm.frequency === f ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>
                  {f}
                </button>
              ))}
            </div>
          </div>
          <button onClick={() => save('notifications', notifForm)} disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-5 py-2 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500">
            {saving ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>
      )}

      {/* ── PERSONALIZATION TAB ── */}
      {tab === 'personalization' && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-5">
          <h3 className="font-semibold text-gray-300 text-sm">Personalization</h3>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-gray-400 mb-2 block">Theme</label>
              <div className="flex gap-2">
                {['dark', 'light'].map(t => (
                  <button key={t} onClick={() => setPrefForm(p => ({ ...p, theme: t }))}
                    className={`px-4 py-2 rounded-lg text-sm capitalize transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${prefForm.theme === t ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>
                    {t === 'dark' ? '🌙 Dark' : '☀️ Light'}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-2 block">Default Landing Page</label>
              <select value={prefForm.landing_page} onChange={e => setPrefForm(p => ({ ...p, landing_page: e.target.value }))}
                className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="/admin/dashboard">Dashboard</option>
                <option value="/admin/governance">Governance</option>
                <option value="/admin/logs">Activity Logs</option>
                <option value="/admin/settings">Settings</option>
                <option value="/intern">Intern Portal</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-2 block">Language</label>
              <select value={prefForm.language} onChange={e => setPrefForm(p => ({ ...p, language: e.target.value }))}
                className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="en">English</option>
                <option value="hi">Hindi</option>
                <option value="ta">Tamil</option>
                <option value="fr">French</option>
                <option value="de">German</option>
              </select>
            </div>
          </div>
          <button onClick={() => save('preferences', prefForm)} disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-5 py-2 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500">
            {saving ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>
      )}

      {/* ── ACTIVITY TAB ── */}
      {tab === 'activity' && (
        <div className="space-y-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-800">
              <h3 className="font-semibold text-gray-300 text-sm">Account Activity Timeline</h3>
              <p className="text-xs text-gray-500 mt-0.5">Your recent account events in chronological order</p>
            </div>
            {data?.activityLogs && data.activityLogs.length > 0 ? (
              <div className="divide-y divide-gray-800">
                {data.activityLogs.map((log: any, i: number) => (
                  <div key={i} className="px-5 py-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${log.log_category === 'security' ? 'bg-red-400' : log.log_category === 'privacy' ? 'bg-yellow-400' : 'bg-blue-400'}`} />
                      <span className="text-sm text-gray-300">{log.action}</span>
                      {log.log_category && (
                        <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded hidden md:inline">{log.log_category}</span>
                      )}
                    </div>
                    <span className="text-xs text-gray-500 whitespace-nowrap">{new Date(log.created_at).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-5 py-12 text-center">
                <p className="text-gray-400 text-sm">No activity recorded yet</p>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  )
}

export default function ProfilePage() {
  return (
    <AppProvider>
      <AppShell role="admin" title="Profile" breadcrumbs={[{ label: 'Admin' }, { label: 'Profile & Settings' }]}>
        <ProfileContent />
      </AppShell>
    </AppProvider>
  )
}
