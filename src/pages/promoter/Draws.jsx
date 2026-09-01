import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../../utils/api.js'
import { useToast } from '../../context/ToastContext.jsx'
import { Button } from '../../components/Button.jsx'
import { Card, CardHeader, CardBody } from '../../components/Card.jsx'
import { Loading, Empty } from '../../components/Loading.jsx'
import { Select } from '../../components/Field.jsx'

function BracketView({ byRound }) {
  const rounds = Object.keys(byRound).sort((a, b) => a - b)
  return (
    <div className="overflow-x-auto">
      <div className="flex min-w-max gap-8">
        {rounds.map((r) => (
          <div key={r} className="flex flex-col gap-4">
            <h4 className="text-sm font-semibold text-slate-500">Round {r}</h4>
            {byRound[r].map((b) => (
              <div key={b._id} className="w-56 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
                <p className="text-xs font-medium text-slate-400">{b.roundName} · Bout #{b.boutNumber}</p>
                <div className="mt-2 space-y-1 text-sm">
                  <div className="flex items-center justify-between rounded bg-slate-50 px-2 py-1">
                    <span className={b.status === 'completed' && b.winnerId && String(b.winnerId) === String(b.boxerAId?._id) ? 'font-bold text-brand-700' : ''}>
                      {b.boxerAId?.boxerId?.fullName || '—'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded bg-slate-50 px-2 py-1">
                    <span className={b.status === 'completed' && b.winnerId && String(b.winnerId) === String(b.boxerBId?._id) ? 'font-bold text-brand-700' : ''}>
                      {b.boxerBId?.boxerId?.fullName || '—'}
                    </span>
                  </div>
                </div>
                <p className="mt-2 text-xs text-slate-400">
                  {b.status === 'completed' ? `Result: ${b.result?.method || 'Decision'}` : b.status}
                </p>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Draws() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()

  const [event, setEvent] = useState(null)
  const [registrations, setRegistrations] = useState(null)
  const [category, setCategory] = useState('')
  const [byRound, setByRound] = useState(null)
  const [bouts, setBouts] = useState(null)
  const [generating, setGenerating] = useState(false)

  const loadEvent = () => {
    api(`/events?id=${id}`).then((d) => setEvent(d.event)).catch(() => {})
    api(`/registrations?eventId=${id}`).then((d) => setRegistrations(d.registrations)).catch(() => {})
  }
  useEffect(loadEvent, [id])

  const categories = event?.weightCategories?.length
    ? event.weightCategories.map((w) => ({ weight: w, age: '', gender: '' }))
    : [{ weight: '', age: '', gender: '' }]

  const loadDraw = async (evtId, weight) => {
    try {
      const d = await api(`/draws/get?eventId=${evtId}&weight=${encodeURIComponent(weight || '')}`)
      setByRound(d.byRound || {})
      setBouts(d.bouts || [])
    } catch {
      setByRound(null)
      setBouts(null)
    }
  }

  const selectCategory = async (w) => {
    setCategory(w)
    await loadDraw(id, w)
  }

  useEffect(() => {
    if (event) selectCategory('')
    // eslint-disable-next-line
  }, [event])

  const generate = async () => {
    setGenerating(true)
    try {
      await api(`/draws/generate?eventId=${id}`, {
        method: 'POST',
        body: { weight: category || '', age: '', gender: '' },
      })
      toast('Draw generated')
      await loadDraw(id, category)
    } catch (err) {
      toast(err.message, 'error')
    } finally {
      setGenerating(false)
    }
  }

  if (!event || !registrations) return <Loading />

  const eligibleCount = registrations.filter((r) =>
    ['eligible', 'payment_confirmed', 'weighed', 'completed'].includes(r.status)
  ).length

  return (
    <div>
      <div className="mb-6">
        <button onClick={() => navigate(`/app/events/${id}`)} className="mb-1 text-sm text-brand-600 hover:underline">← Back to Event</button>
        <h1 className="text-2xl font-bold text-slate-900">Draws & Bracket</h1>
        <p className="text-sm text-slate-500">{event.name}</p>
      </div>

      <div className="mb-6 flex flex-wrap items-end gap-4">
        <div className="w-64">
          <Select label="Weight Category" value={category} onChange={(e) => selectCategory(e.target.value)}>
            {categories.map((c) => (
              <option key={c.weight || 'all'} value={c.weight}>{c.weight || 'All categories'}</option>
            ))}
          </Select>
        </div>
        <Button onClick={generate} disabled={generating}>
          {byRound ? 'Regenerate Draw' : 'Generate Draw'}
        </Button>
        <p className="text-sm text-slate-500">({eligibleCount} eligible boxers)</p>
      </div>

      {!byRound || Object.keys(byRound).length === 0 ? (
        <Card>
          <Empty
            title="No draw yet"
            message="Generate a draw from eligible boxers to create the tournament bracket."
          />
        </Card>
      ) : (
        <Card>
          <CardHeader title="Bracket" subtitle="Click 'Record Result' after each fight to advance winners" />
          <CardBody>
            <BracketView byRound={byRound} />
          </CardBody>
        </Card>
      )}
    </div>
  )
}
