import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../../utils/api.js'
import { Card, CardHeader, CardBody } from '../../components/Card.jsx'
import { Loading, Empty } from '../../components/Loading.jsx'

export default function ClubDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [club, setClub] = useState(null)
  const [boxers, setBoxers] = useState(null)
  const [registrations, setRegistrations] = useState(null)

  useEffect(() => {
    api(`/clubs?clubId=${id}&populate=true`).then((d) => { setClub(d.club); setBoxers(d.boxers) }).catch(() => {})
    api(`/registrations?clubId=${id}`).then((d) => setRegistrations(d.registrations)).catch(() => {})
  }, [id])

  if (!club || !boxers || !registrations) return <Loading />

  return (
    <div>
      <div className="mb-6">
        <button onClick={() => navigate('/app/clubs')} className="mb-1 text-sm text-brand-600 hover:underline">← Clubs</button>
        <h1 className="text-2xl font-bold text-slate-900">{club.name}</h1>
        <p className="text-sm text-slate-500">{club.contactName || 'Club'}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Boxers" subtitle={`${boxers.length} boxers in this club`} />
          <CardBody className="p-0">
            {boxers.length === 0 ? (
              <Empty title="No boxers" message="This club has not added any boxers yet." />
            ) : (
              <ul className="divide-y divide-slate-200">
                {boxers.map((b) => (
                  <li key={b._id} className="flex items-center justify-between px-5 py-3">
                    <div>
                      <p className="font-medium text-slate-900">{b.fullName}</p>
                      <p className="text-sm text-slate-500">
                        {b.weightCategory && `${b.weightCategory} · `}
                        {b.ageCategory || '—'}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Registrations" subtitle={`${registrations.length} event registrations`} />
          <CardBody className="p-0">
            {registrations.length === 0 ? (
              <Empty title="No registrations" />
            ) : (
              <ul className="divide-y divide-slate-200">
                {registrations.map((r) => (
                  <li key={r._id} className="px-5 py-3">
                    <p className="font-medium text-slate-900">{r.boxerId?.fullName || 'Boxer'}</p>
                    <p className="text-sm text-slate-500">Event: {r.eventId?.name || '—'}</p>
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
