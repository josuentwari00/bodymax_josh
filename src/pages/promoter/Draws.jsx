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

function Stat({ label, value, tone = 'slate' }) {
  const tones = {
    slate: 'border-slate-200 bg-white',
    blue: 'border-blue-200 bg-blue-50',
    amber: 'border-amber-200 bg-amber-50',
    emerald: 'border-emerald-200 bg-emerald-50',
  }
  return (
    <div className={cn('rounded-xl border px-3 py-2.5 text-center', tones[tone])}>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-xs font-medium text-slate-500">{label}</p>
    </div>
  )
}

function SelectedPlayer({ r }) {
  if (!r) return null
  const initials = (r.boxerId?.fullName || '?').split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
  return (
    <div className="mt-1.5 flex items-center gap-2 rounded-lg bg-slate-50 px-2 py-1.5">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-600 text-[10px] font-bold text-white">{initials}</span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-medium text-slate-900">{r.boxerId?.fullName || 'Boxer'}</span>
        <span className="block truncate text-xs text-slate-500">
          {r.clubId?.name || 'Guest'}
          {r.category?.weight ? ` · ${r.category.weight}` : ''}
          {r.category?.age ? ` · ${r.category.age}` : ''}
        </span>
      </span>
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
  const [editMode, setEditMode] = useState(false)
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
  const byId = new Map(eligible.map((r) => [r._id, r]))

  // Boxers already placed in this category's existing draw (round 1 assignments)
  const drawnIds = new Set(
    (bouts || [])
      .filter((b) => b.round === 1)
      .flatMap((b) => [b.boxerAId?._id, b.boxerBId?._id])
      .filter(Boolean)
      .map(String)
  )

  const openManual = () => {
    const hasExisting = !!hasDraw
    const r1 = hasExisting
      ? (bouts || [])
          .filter((b) => b.round === 1)
          .sort((a, b) => a.bracketPosition - b.bracketPosition)
          .map((b) => ({ a: b.boxerAId?._id || '', b: b.boxerBId?._id || '' }))
      : []
    setManualPairs(r1.length ? r1 : [{ a: '', b: '' }])
    setEditMode(hasExisting)
    setAddForm({ fullName: '', gender: '', weight: weight || '', age: age || '' })
    setAddBoxerOpen(false)
    setManualOpen(true)
  }

  const usedIds = () => manualPairs.flatMap((p) => [p.a, p.b]).filter(Boolean)
  const assignedCount = usedIds().length
  const remainingCount = eligible.length - assignedCount

  const available = (exclude = []) =>
    eligible.filter(
      (r) =>
        !usedIds().includes(r._id) &&
        !exclude.includes(r._id) &&
        (editMode || !drawnIds.has(String(r._id)))
    )

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
      toast(editMode ? 'Draw updated — winners will advance automatically' : 'Draw created — winners will advance automatically')
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
        title={`${editMode ? 'Update' : 'Create'} Draw${weight ? ` — ${weight}` : ''}${age ? ` · ${age}` : ''}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setManualOpen(false)}>Cancel</Button>
            <Button onClick={buildManual} disabled={building || assignedCount === 0}>
              {building ? <Spinner className="h-4 w-4 border-white" /> : editMode ? 'Save Changes' : 'Create Draw'}
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          {editMode ? (
            <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-900">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white">✓</span>
              <p>Editing the existing draw — tweak the pairings below and save to rebuild the bracket.</p>
            </div>
          ) : drawnIds.size > 0 ? (
            <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-900">
              <span className="text-amber-600">!</span>
              <p>
                {drawnIds.size} boxer{drawnIds.size === 1 ? '' : 's'} already placed in this bracket are hidden from the lists to avoid duplicates.
              </p>
            </div>
          ) : null}

          <div className="grid grid-cols-3 gap-2">
            <Stat label="Eligible" value={eligible.length} />
            <Stat label="In Draw" value={assignedCount} tone={assignedCount ? 'blue' : 'slate'} />
            <Stat label="Unassigned" value={remainingCount} tone={remainingCount > 0 ? 'amber' : 'emerald'} />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-50 px-3 py-2.5">
            <p className="text-sm text-slate-600">
              {editMode
                ? 'Load the current pairings and adjust before you save.'
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
            <div className="space-y-3">
              {manualPairs.map((p, i) => (
                <div key={i} className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Bout {i + 1}</span>
                    <button
                      type="button"
                      onClick={() => removePair(i)}
                      className="rounded-md px-2 py-1 text-xs font-medium text-rose-500 hover:bg-rose-50"
                    >
                      Remove
                    </button>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Boxer A</label>
                      <select value={p.a} onChange={setPair(i, 'a')} className={selectClass}>
                        <option value="">— Bye / empty —</option>
                        {available([p.a]).map((r) => (
                          <option key={r._id} value={r._id}>
                            {r.boxerId?.fullName || 'Boxer'} — {r.clubId?.name || 'Guest'}
                            {r.category?.weight ? ` (${r.category.weight})` : ''}
                          </option>
                        ))}
                      </select>
                      <SelectedPlayer r={p.a ? byId.get(p.a) : null} />
                    </div>
                    <span className="mt-4 text-sm font-bold text-slate-300">VS</span>
                    <div className="min-w-0 flex-1">
                      <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Boxer B</label>
                      <select value={p.b} onChange={setPair(i, 'b')} className={selectClass}>
                        <option value="">— Bye / empty —</option>
                        {available([p.b]).map((r) => (
                          <option key={r._id} value={r._id}>
                            {r.boxerId?.fullName || 'Boxer'} — {r.clubId?.name || 'Guest'}
                            {r.category?.weight ? ` (${r.category.weight})` : ''}
                          </option>
                        ))}
                      </select>
                      <SelectedPlayer r={p.b ? byId.get(p.b) : null} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>
    </div>
  )
}