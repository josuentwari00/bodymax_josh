import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../../utils/api.js'
import { useToast } from '../../context/ToastContext.jsx'
import { Button } from '../../components/Button.jsx'
import { Card, CardHeader, CardBody } from '../../components/Card.jsx'
import { Loading, Empty, Spinner } from '../../components/Loading.jsx'
import { Select, Input } from '../../components/Field.jsx'
import { Modal } from '../../components/Modal.jsx'
import { cn } from '../../utils/cn.js'

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

const selectClass =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500'

function boxerLabel(r) {
  if (!r) return ''
  const name = r.boxerId?.fullName || 'Boxer'
  const club = r.clubId?.name || 'Guest'
  const cat = [r.category?.weight, r.category?.age].filter(Boolean).join(' / ')
  return `${name} — ${club}${cat ? ` (${cat})` : ''}`
}

function Stat({ label, value, tone = 'slate' }) {
  const tones = {
    slate: 'border-slate-200 bg-white',
    blue: 'border-blue-200 bg-blue-50',
    amber: 'border-amber-200 bg-amber-50',
  }
  return (
    <div className={cn('rounded-xl border px-3 py-2.5 text-center', tones[tone])}>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-xs font-medium text-slate-500">{label}</p>
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

  const [manualOpen, setManualOpen] = useState(false)
  const [manualPairs, setManualPairs] = useState([])
  const [building, setBuilding] = useState(false)
  const [addBoxerOpen, setAddBoxerOpen] = useState(false)
  const [addingBoxer, setAddingBoxer] = useState(false)
  const [addForm, setAddForm] = useState({ fullName: '', gender: '', weight: '', age: '' })

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

  if (!event || !registrations) return <Loading />

  const eligible = registrations.filter((r) =>
    ['eligible', 'payment_confirmed', 'weighed', 'completed'].includes(r.status) &&
    (!weight || r.category?.weight === weight) &&
    (!age || r.category?.age === age)
  )

  const ageCats = event.ageCategories || []
  const showAgeFilter = ageCats.length > 0

  const openManual = () => {
    const r1 = (bouts || [])
      .filter((b) => b.round === 1)
      .sort((a, b) => a.bracketPosition - b.bracketPosition)
      .map((b) => ({ a: b.boxerAId?._id || '', b: b.boxerBId?._id || '' }))
    setManualPairs(r1.length ? r1 : [{ a: '', b: '' }])
    setAddForm({ fullName: '', gender: '', weight: weight || '', age: age || '' })
    setAddBoxerOpen(false)
    setManualOpen(true)
  }

  const usedIds = () => manualPairs.flatMap((p) => [p.a, p.b]).filter(Boolean)
  const assignedCount = usedIds().length
  const remainingCount = eligible.length - assignedCount
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

  const addUnaffiliated = async () => {
    if (!addForm.fullName.trim()) {
      toast('Enter the boxer full name', 'error')
      return
    }
    setAddingBoxer(true)
    try {
      await api(`/draws/boxer?eventId=${id}`, {
        method: 'POST',
        body: {
          fullName: addForm.fullName.trim(),
          gender: addForm.gender || '',
          weight: addForm.weight || weight || '',
          age: addForm.age || age || '',
        },
      })
      toast('Boxer added — now assign them to a bout')
      await loadEvent()
      setAddForm({ fullName: '', gender: '', weight: '', age: '' })
      setAddBoxerOpen(false)
    } catch (err) {
      toast(err.message, 'error')
    } finally {
      setAddingBoxer(false)
    }
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
      toast('Draw saved — winners will advance automatically')
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
        <p className="text-sm text-slate-500">{event.name} · build and update brackets manually</p>
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
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={openManual} disabled={eligible.length < 1}>
            {hasDraw ? 'Update Draw' : 'Create Draw'}
          </Button>
          <span className="inline-flex items-center rounded-full bg-brand-50 px-3 py-1.5 text-sm font-medium text-brand-700">
            {eligible.length} eligible
          </span>
        </div>
      </div>

      {!hasDraw ? (
        <Card>
          <Empty
            title="No draw yet"
            message="Create a manual draw for this category — pair boxers yourself, add guest boxers if needed, and build the bracket."
          />
        </Card>
      ) : (
        <Card>
          <CardHeader title="Bracket" subtitle="Record results on the Bouts page to advance winners automatically" />
          <CardBody>
            <BracketView byRound={byRound} />
          </CardBody>
        </Card>
      )}

      <Modal
        open={manualOpen}
        onClose={() => setManualOpen(false)}
        title={`${hasDraw ? 'Update' : 'Create'} Draw${weight ? ` — ${weight}` : ''}${age ? ` · ${age}` : ''}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setManualOpen(false)}>Cancel</Button>
            <Button onClick={buildManual} disabled={building || assignedCount === 0}>
              {building ? <Spinner className="h-4 w-4 border-white" /> : hasDraw ? 'Update Draw' : 'Create Draw'}
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          <div className="grid grid-cols-3 gap-2">
            <Stat label="Eligible" value={eligible.length} />
            <Stat label="Assigned" value={assignedCount} tone="blue" />
            <Stat label="Remaining" value={remainingCount} tone={remainingCount > 0 ? 'amber' : 'slate'} />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-50 px-3 py-2.5">
            <p className="text-sm text-slate-600">
              {hasDraw
                ? 'The current bracket is shown below — adjust the pairings and save to rebuild.'
                : 'Pair boxers into bouts. Empty slots become byes.'}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="secondary" onClick={addPair}>+ Bout</Button>
              <Button size="sm" variant="secondary" onClick={autoPair} disabled={remainingCount === 0}>Auto-pair</Button>
              <Button size="sm" variant="secondary" onClick={() => setAddBoxerOpen((v) => !v)}>+ Add boxer</Button>
            </div>
          </div>

          {addBoxerOpen && (
            <div className="rounded-xl border border-brand-200 bg-gradient-to-br from-brand-50/60 to-white p-4">
              <p className="text-sm font-semibold text-slate-900">Add a boxer who isn't on any club</p>
              <p className="mb-3 text-xs text-slate-500">Registered in this event and ready to pair below.</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Input label="Full Name" value={addForm.fullName} onChange={(e) => setAddForm({ ...addForm, fullName: e.target.value })} placeholder="e.g. James Mwangi" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Gender</label>
                  <select value={addForm.gender} onChange={(e) => setAddForm({ ...addForm, gender: e.target.value })} className={selectClass}>
                    <option value="">—</option>
                    <option value="M">Male</option>
                    <option value="F">Female</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Weight Category</label>
                  {event.weightCategories?.length ? (
                    <select value={addForm.weight} onChange={(e) => setAddForm({ ...addForm, weight: e.target.value })} className={selectClass}>
                      <option value="">—</option>
                      {event.weightCategories.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  ) : (
                    <Input value={addForm.weight} onChange={(e) => setAddForm({ ...addForm, weight: e.target.value })} placeholder="e.g. 60kg" />
                  )}
                </div>
                {ageCats.length > 0 && (
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Age Category</label>
                    <select value={addForm.age} onChange={(e) => setAddForm({ ...addForm, age: e.target.value })} className={selectClass}>
                      <option value="">—</option>
                      {ageCats.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                )}
              </div>
              <div className="mt-3 flex gap-2">
                <Button size="sm" onClick={addUnaffiliated} disabled={addingBoxer}>
                  {addingBoxer ? <Spinner className="h-4 w-4 border-white" /> : 'Add & Register'}
                </Button>
                <Button size="sm" variant="secondary" onClick={() => setAddBoxerOpen(false)}>Cancel</Button>
              </div>
            </div>
          )}

          {manualPairs.length === 0 ? (
            <Empty title="No bouts yet" message="Add a bout to start pairing boxers." />
          ) : (
            <ul className="divide-y divide-slate-200 rounded-xl border border-slate-200">
              {manualPairs.map((p, i) => (
                <li key={i} className="grid gap-2 p-3 sm:grid-cols-[1fr_auto_1fr_auto] sm:items-end">
                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Boxer A</label>
                    <select value={p.a} onChange={setPair(i, 'a')} className={selectClass}>
                      <option value="">— Bye / empty —</option>
                      {available([p.a]).map((r) => (
                        <option key={r._id} value={r._id}>{boxerLabel(r)}</option>
                      ))}
                    </select>
                  </div>
                  <span className="hidden pb-2 text-center text-sm font-semibold text-slate-400 sm:block">vs</span>
                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Boxer B</label>
                    <select value={p.b} onChange={setPair(i, 'b')} className={selectClass}>
                      <option value="">— Bye / empty —</option>
                      {available([p.b]).map((r) => (
                        <option key={r._id} value={r._id}>{boxerLabel(r)}</option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={() => removePair(i)}
                    className="mb-0.5 justify-self-start rounded-md px-2 py-1 text-sm text-slate-400 hover:bg-slate-100 hover:text-rose-600 sm:justify-self-end"
                  >
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