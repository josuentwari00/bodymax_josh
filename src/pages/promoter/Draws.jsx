import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../../utils/api.js'
import { useToast } from '../../context/ToastContext.jsx'
import { Button } from '../../components/Button.jsx'
import { Card, CardHeader, CardBody } from '../../components/Card.jsx'
import { Loading, Empty, Spinner } from '../../components/Loading.jsx'
import { Select } from '../../components/Field.jsx'
import { Modal } from '../../components/Modal.jsx'

function BracketView({ byRound }) {
  const rounds = Object.keys(byRound).sort((a, b) => a - b)
  return (
    <div className="overflow-x-auto">
      <div className="flex min-w-max gap-8">
        {rounds.map((r) => (
          <div key={r} className="flex flex-col gap-4">
            <h4 className="text-sm font-semibold text-slate-500">Round {r}</h4>
            {byRound[r].map((b) => (
              <div key={b._id} className="w-60 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
                <p className="text-xs font-medium text-slate-400">
                  {b.roundName} · Bout #{b.boutNumber} ·{' '}
                  {b.category?.weight || 'All weights'}
                  {b.category?.age ? ` / ${b.category.age}` : ''}
                </p>
                <div className="mt-2 space-y-1 text-sm">
                  <div className="flex items-center justify-between rounded bg-slate-50 px-2 py-1">
                    <span className={b.status === 'completed' && b.winnerId && String(b.winnerId) === String(b.boxerAId?._id) ? 'font-bold text-brand-700' : ''}>
                      {b.status === 'walkover' && !b.boxerAId ? '— Bye —' : b.boxerAId?.boxerId?.fullName || '—'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded bg-slate-50 px-2 py-1">
                    <span className={b.status === 'completed' && b.winnerId && String(b.winnerId) === String(b.boxerBId?._id) ? 'font-bold text-brand-700' : ''}>
                      {b.status === 'walkover' && !b.boxerBId ? '— Bye —' : b.boxerBId?.boxerId?.fullName || '—'}
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
  const [weight, setWeight] = useState('')
  const [age, setAge] = useState('')
  const [byRound, setByRound] = useState(null)
  const [bouts, setBouts] = useState(null)
  const [generating, setGenerating] = useState(false)

  const [manualOpen, setManualOpen] = useState(false)
  const [manualPairs, setManualPairs] = useState([])
  const [building, setBuilding] = useState(false)

  const loadEvent = () => {
    api(`/events?id=${id}`).then((d) => setEvent(d.event)).catch(() => {})
    api(`/registrations?eventId=${id}`).then((d) => setRegistrations(d.registrations)).catch(() => {})
  }
  useEffect(loadEvent, [id])

  const loadDraw = async (evtId, w, a) => {
    try {
      const d = await api(`/draws/get?eventId=${evtId}&weight=${encodeURIComponent(w || '')}&age=${encodeURIComponent(a || '')}`)
      setByRound(d.byRound || {})
      setBouts(d.bouts || [])
    } catch {
      setByRound(null)
      setBouts(null)
    }
  }

  useEffect(() => {
    if (event) loadDraw(id, weight, age)
    // eslint-disable-next-line
  }, [event])

  const selectWeight = async (w) => {
    setWeight(w)
    await loadDraw(id, w, age)
  }

  const selectAge = async (a) => {
    setAge(a)
    await loadDraw(id, weight, a)
  }

  const generate = async () => {
    setGenerating(true)
    try {
      await api(`/draws/generate?eventId=${id}`, {
        method: 'POST',
        body: { weight: weight || '', age: age || '', gender: '' },
      })
      toast('Automatic draw generated')
      await loadDraw(id, weight, age)
    } catch (err) {
      toast(err.message, 'error')
    } finally {
      setGenerating(false)
    }
  }

  if (!event || !registrations) return <Loading />

  const eligible = registrations.filter((r) =>
    ['eligible', 'payment_confirmed', 'weighed', 'completed'].includes(r.status) &&
    (!weight || r.category?.weight === weight) &&
    (!age || r.category?.age === age)
  )

  const ageCats = event.ageCategories || []
  const showAgeFilter = ageCats.length > 0

  const openManual = () => {
    setManualPairs([{ a: '', b: '' }])
    setManualOpen(true)
  }

  const usedIds = () => manualPairs.flatMap((p) => [p.a, p.b]).filter(Boolean)
  const available = (exclude = []) => eligible.filter((r) => !usedIds().includes(r._id) && !exclude.includes(r._id))

  const setPair = (i, key) => (e) => {
    const next = [...manualPairs]
    next[i] = { ...next[i], [key]: e.target.value }
    setManualPairs(next)
  }

  const addPair = () => setManualPairs([...manualPairs, { a: '', b: '' }])

  const removePair = (i) => setManualPairs(manualPairs.filter((_, x) => x !== i))

  const autoPair = () => {
    const pool = available().slice()
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[pool[i], pool[j]] = [pool[j], pool[i]]
    }
    const rows = [...manualPairs]
    while (pool.length >= 2) {
      rows.push({ a: pool.pop()._id, b: pool.pop()._id })
    }
    if (pool.length === 1) {
      rows.push({ a: pool.pop()._id, b: '' })
    }
    setManualPairs(rows)
  }

  const buildManual = async () => {
    const pairs = manualPairs
      .map((p) => ({ boxerAId: p.a || null, boxerBId: p.b || null }))
      .filter((p) => p.boxerAId || p.boxerBId)
    if (pairs.length === 0) {
      toast('Add at least one pairing', 'error')
      return
    }
    const missing = eligible.length - usedIds().length
    if (missing > 0) {
      if (!window.confirm(`${missing} eligible boxer(s) are not assigned. They won't be in the draw. Build anyway?`)) return
    }
    setBuilding(true)
    try {
      await api(`/draws/manual?eventId=${id}`, {
        method: 'POST',
        body: { weight: weight || '', age: age || '', gender: '', bouts: pairs },
      })
      toast('Manual draw built')
      setManualOpen(false)
      await loadDraw(id, weight, age)
    } catch (err) {
      toast(err.message, 'error')
    } finally {
      setBuilding(false)
    }
  }

  const hasDraw = byRound && Object.keys(byRound).length > 0

  return (
    <div>
      <div className="mb-6">
        <button onClick={() => navigate(`/app/events/${id}`)} className="mb-1 text-sm text-brand-600 hover:underline">← Back to Event</button>
        <h1 className="text-2xl font-bold text-slate-900">Draws & Bracket</h1>
        <p className="text-sm text-slate-500">{event.name}</p>
      </div>

      <div className="mb-6 flex flex-wrap items-end gap-4">
        <div className="w-56">
          <Select label="Weight Category" value={weight} onChange={(e) => selectWeight(e.target.value)}>
            <option value="">All weights</option>
            {event.weightCategories?.map((w) => (
              <option key={w} value={w}>{w}</option>
            ))}
          </Select>
        </div>
        {showAgeFilter && (
          <div className="w-56">
            <Select label="Age Category" value={age} onChange={(e) => selectAge(e.target.value)}>
              <option value="">All ages</option>
              {ageCats.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </Select>
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          <Button onClick={generate} disabled={generating}>
            {generating ? <Spinner className="h-4 w-4 border-white" /> : hasDraw ? 'Regenerate Automatic Draw' : 'Generate Automatic Draw'}
          </Button>
          <Button variant="secondary" onClick={openManual} disabled={eligible.length < 2}>
            Manual Draw
          </Button>
        </div>
        <p className="text-sm text-slate-500">({eligible.length} eligible boxers){age ? ` · ${age}` : ''}</p>
      </div>

      {!hasDraw ? (
        <Card>
          <Empty
            title="No draw yet"
            message="Generate an automatic draw from eligible boxers, or use the manual draw to set your own pairings for this category."
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

      <Modal
        open={manualOpen}
        onClose={() => setManualOpen(false)}
        title={`Manual Draw — ${weight || 'All weights'}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setManualOpen(false)}>Cancel</Button>
            <Button onClick={buildManual} disabled={building}>
              {building ? <Spinner className="h-4 w-4 border-white" /> : 'Build Draw'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-900">
            <span>{eligible.length} eligible boxers · {usedIds().length} assigned, {eligible.length - usedIds().length} left</span>
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" onClick={addPair}>+ Add Bout</Button>
              <Button size="sm" variant="secondary" onClick={autoPair}>Auto-pair remaining</Button>
            </div>
          </div>

          {manualPairs.length === 0 ? (
            <Empty title="No bouts yet" message="Add a bout to start pairing boxers manually." />
          ) : (
            <ul className="divide-y divide-slate-200">
              {manualPairs.map((p, i) => (
                <li key={i} className="grid gap-2 py-3 sm:grid-cols-[1fr_auto_1fr_auto] sm:items-end">
                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Boxer A</label>
                    <select value={p.a} onChange={setPair(i, 'a')} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none">
                      <option value="">— Empty / walkover —</option>
                      {available([p.a]).map((r) => (
                        <option key={r._id} value={r._id}>
                          {r.boxerId?.fullName || 'Boxer'} — {r.clubId?.name || ''}
                          {r.category?.weight ? ` (${r.category.weight})` : ''}
                          {r.category?.age ? ` / ${r.category.age}` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                  <span className="hidden pb-2 text-center text-sm text-slate-400 sm:block">vs</span>
                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Boxer B</label>
                    <select value={p.b} onChange={setPair(i, 'b')} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none">
                      <option value="">— Empty / walkover —</option>
                      {available([p.b]).map((r) => (
                        <option key={r._id} value={r._id}>
                          {r.boxerId?.fullName || 'Boxer'} — {r.clubId?.name || ''}
                          {r.category?.weight ? ` (${r.category.weight})` : ''}
                          {r.category?.age ? ` / ${r.category.age}` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button type="button" onClick={() => removePair(i)} className="mb-0.5 justify-self-start rounded-md px-2 py-1 text-sm text-slate-400 hover:bg-slate-100 hover:text-slate-900 sm:justify-self-end">
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Modal>
    </div>
  )
}