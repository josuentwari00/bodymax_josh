import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../utils/api.js'
import { Card, CardBody } from '../../components/Card.jsx'
import { Loading, Empty } from '../../components/Loading.jsx'

export default function ClubList() {
  const [clubs, setClubs] = useState(null)

  useEffect(() => {
    api('/clubs').then((d) => setClubs(d.clubs)).catch(() => {})
  }, [])

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Clubs</h1>
          <p className="text-sm text-slate-500">Boxing clubs participating in your events</p>
        </div>
        <Link
          to="/app/clubs/new"
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
        >
          + Add Club
        </Link>
      </div>

      <Card>
        <CardBody className="p-0">
          {!clubs ? (
            <Loading />
          ) : clubs.length === 0 ? (
            <Empty title="No clubs yet" message="Add your first boxing club to get started." />
          ) : (
            <ul className="divide-y divide-slate-200">
              {clubs.map((club) => (
                <li key={club._id}>
                  <Link to={`/app/clubs/${club._id}`} className="flex items-center justify-between px-5 py-4 hover:bg-slate-50">
                    <div>
                      <p className="font-medium text-slate-900">{club.name}</p>
                      <p className="text-sm text-slate-500">
                        {club.contactName && `${club.contactName} · `}
                        {club.contactEmail || 'No email'}
                      </p>
                    </div>
                    <div className="text-sm text-slate-500">{club.boxerCount || 0} boxers</div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  )
}
