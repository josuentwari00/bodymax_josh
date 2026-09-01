import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../utils/api.js'
import { Card, CardBody } from '../../components/Card.jsx'
import { Loading } from '../../components/Loading.jsx'
import { StatusBadge } from '../../components/Badge.jsx'

export default function ClubDashboard() {
  const [data, setData] = useState(null)

  useEffect(() => {
    api('/dashboard').then((d) => setData(d.dashboard)).catch(() => {})
  }, [])

  if (!data) return <Loading label="Loading your dashboard..." />

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Club Dashboard</h1>
        <p className="text-sm text-slate-500">Status of your boxers and registrations</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'My Boxers', value: data.boxerCount, to: '/app/club/boxers' },
          { label: 'Total Registrations', value: data.registeredCount, to: '/app/club/register' },
          { label: 'Pending Approval', value: data.pendingCount, to: '/app/club/register' },
          { label: 'Approved', value: data.approvedCount, to: '/app/club/register' },
        ].map((s) => (
          <Link key={s.label} to={s.to} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
            <p className="text-sm font-medium text-slate-500">{s.label}</p>
            <p className="mt-2 text-3xl font-bold text-brand-700">{s.value}</p>
          </Link>
        ))}
      </div>

      <div className="mt-8">
        <Card>
          <div className="border-b border-slate-200 px-5 py-4">
            <h3 className="text-base font-semibold text-slate-900">Recent Registrations</h3>
          </div>
          <CardBody className="p-0">
            {data.recentRegistrations?.length === 0 ? (
              <p className="px-5 py-8 text-sm text-slate-500">You have not registered any boxers yet.</p>
            ) : (
              <ul className="divide-y divide-slate-200">
                {data.recentRegistrations.map((r) => (
                  <li key={r._id} className="flex items-center justify-between px-5 py-3">
                    <div>
                      <p className="font-medium text-slate-900">{r.boxerId?.fullName || 'Boxer'}</p>
                      <p className="text-sm text-slate-500">{r.eventId?.name || 'Event'}</p>
                    </div>
                    <StatusBadge status={r.status} />
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
