import { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../../utils/api.js'
import { Loading } from '../../components/Loading.jsx'
import { Button } from '../../components/Button.jsx'
import { Input, Select, Textarea } from '../../components/Field.jsx'

const EMPTY_BOXER = { fullName: '', weight: '', age: '', gender: '', numberOfBouts: 1 }

export default function EventRegister() {
  const { token } = useParams()
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [clubName, setClubName] = useState('')
  const [boxers, setBoxers] = useState([{ ...EMPTY_BOXER }])
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    api(`/event-register?token=${token}`)
      .then((d) => setEvent(d.event))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [token])

  const updateBoxer = (i, key, value) => {
    setBoxers((bs) => bs.map((b, idx) => (idx === i ? { ...b, [key]: value } : b)))
  }

  const addBoxer = () => setBoxers((bs) => [...bs, { ...EMPTY_BOXER }])

  const removeBoxer = (i) => {
    setBoxers((bs) => (bs.length === 1 ? bs : bs.filter((_, idx) => idx !== i)))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      const filtered = boxers.map((b) => ({
        ...b,
        fullName: (b.fullName || '').trim(),
        numberOfBouts: Number(b.numberOfBouts) || 1,
      }))
      const res = await api(`/event-register?token=${token}`, {
        method: 'POST',
        body: { clubName: clubName.trim(), boxers: filtered },
      })
      setDone(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Loading />

  if (error && !event) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-xl font-bold text-slate-900">Registration link unavailable</h1>
          <p className="mt-2 text-sm text-slate-500">{error}</p>
          <Link to="/" className="mt-6 inline-block text-sm font-medium text-brand-600 hover:underline">← Back to Bodymax</Link>
        </div>
      </div>
    )
  }

  if (done) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
            <svg className="h-7 w-7 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="mt-4 text-xl font-bold text-slate-900">Registration submitted</h1>
          <p className="mt-2 text-sm text-slate-500">
            Your boxer(s) have been registered for <span className="font-medium text-slate-900">{event?.name}</span>. The event
            promoter will review and confirm each entry. You can close this page.
          </p>
          <Link to="/" className="mt-6 inline-block text-sm font-medium text-brand-600 hover:underline">← Back to Bodymax</Link>
        </div>
      </div>
    )
  }

  const closed = !event.registrationOpen || ['closed', 'completed', 'archived'].includes(event.status)

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="mb-2 text-xl font-bold text-slate-900">Register for {event.name}</h1>
        <p className="text-sm text-slate-500">Fill in your club and the boxer(s) you want to enter.</p>

        {closed ? (
          <div className="mt-4 rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <p className="font-medium text-slate-900">Registration is currently closed for this event.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">Club / Team</h2>
              <p className="mt-1 text-sm text-slate-500">The name of your boxing club or team.</p>
              <div className="mt-3">
                <Input label="Club / Team Name" value={clubName} onChange={(e) => setClubName(e.target.value)} placeholder="e.g. Midlands Boxing Club" />
              </div>
            </div>

            <div className="space-y-4">
              {boxers.map((b, i) => (
                <div key={i} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-slate-900">Boxer {i + 1}</h3>
                    {boxers.length > 1 && (
                      <button type="button" onClick={() => removeBoxer(i)} className="text-sm text-slate-500 hover:text-slate-900">Remove</button>
                    )}
                  </div>
                  <div className="mt-3 space-y-3">
                    <Input label="Full Name" value={b.fullName} onChange={(e) => updateBoxer(i, 'fullName', e.target.value)} required placeholder="Boxer's full name" />
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Select label="Weight Category" value={b.weight} onChange={(e) => updateBoxer(i, 'weight', e.target.value)}>
                        <option value="">Select…</option>
                        {event.weightCategories.map((c) => <option key={c} value={c}>{c}</option>)}
                      </Select>
                      <Select label="Age Category" value={b.age} onChange={(e) => updateBoxer(i, 'age', e.target.value)}>
                        <option value="">Select…</option>
                        {event.ageCategories.map((c) => <option key={c} value={c}>{c}</option>)}
                      </Select>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Select label="Gender" value={b.gender} onChange={(e) => updateBoxer(i, 'gender', e.target.value)}>
                        <option value="">Select…</option>
                        <option value="M">Male</option>
                        <option value="F">Female</option>
                      </Select>
                      <Input label="Number of Bouts" type="number" min="1" value={b.numberOfBouts} onChange={(e) => updateBoxer(i, 'numberOfBouts', e.target.value)} />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button type="button" onClick={addBoxer} className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 px-4 py-3 text-sm font-medium text-slate-500 transition hover:border-brand-500 hover:text-brand-700">
              + Add another boxer
            </button>

            {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

            <Button type="submit" disabled={saving} className="w-full">
              {saving ? 'Submitting…' : `Submit ${boxers.length} boxer${boxers.length === 1 ? '' : 's'}`}
            </Button>
          </form>
        )}
      </main>
    </div>
  )
}