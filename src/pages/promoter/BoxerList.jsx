import { useEffect, useState } from 'react'
import { api } from '../../utils/api.js'
import { Card, CardBody } from '../../components/Card.jsx'
import { Loading, Empty } from '../../components/Loading.jsx'
import { Badge } from '../../components/Badge.jsx'

export default function BoxerList() {
  const [boxers, setBoxers] = useState(null)

  useEffect(() => {
    api('/boxers').then((d) => setBoxers(d.boxers)).catch(() => {})
  }, [])

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Boxers</h1>
        <p className="text-sm text-slate-500">All boxers across participating clubs</p>
      </div>

      <Card>
        <CardBody className="p-0">
          {!boxers ? (
            <Loading />
          ) : boxers.length === 0 ? (
            <Empty title="No boxers yet" message="Boxers will appear here as clubs add them." />
          ) : (
            <ul className="divide-y divide-slate-200">
              {boxers.map((b) => (
                <li key={b._id} className="flex items-center justify-between px-5 py-4">
                  <div>
                    <p className="font-medium text-slate-900">{b.fullName}</p>
                    <p className="text-sm text-slate-500">
                      {b.gender === 'M' ? 'Male' : b.gender === 'F' ? 'Female' : 'Gender N/A'}
                      {b.dateOfBirth && ` · ${new Date(b.dateOfBirth).toLocaleDateString()}`}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {b.weightCategory && <Badge>{b.weightCategory}</Badge>}
                    {b.ageCategory && <Badge>{b.ageCategory}</Badge>}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  )
}
