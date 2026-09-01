import { useEffect, useState } from 'react'
import { api } from '../../utils/api.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { useToast } from '../../context/ToastContext.jsx'
import { Button } from '../../components/Button.jsx'
import { Card, CardHeader, CardBody } from '../../components/Card.jsx'
import { Loading, Empty, Spinner } from '../../components/Loading.jsx'
import { StatusBadge } from '../../components/Badge.jsx'
import { Modal } from '../../components/Modal.jsx'
import { Input, Select } from '../../components/Field.jsx'

export default function ClubRegister() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [events, setEvents] = useState(null)
  const [boxers, setBoxers] = useState(null)
  const [registrations, setRegistrations] = useState(null)
  const [selEvent, setSelEvent] = useState('')
  const [selectedBoxers, setSelectedBoxers] = useState([])
  const [payModal, setPayModal] = useState(null)
  const [payForm, setPayForm] = useState({ amount: '', method: '', reference: '', paidAt: '' })
  const [busy, setBusy] = useState(false)

  const load = () => {
    api('/events').then((d) => setEvents(d.events)).catch(() => {})
    api('/boxers').then((d) => setBoxers(d.boxers)).catch(() => {})
    api('/registrations').then((d) => setRegistrations(d.registrations)).catch(() => {})
  }
  useEffect(load, [])

  if (!events || !boxers || !registrations) return <Loading />

  const openEvents = events.filter((e) => e.registrationOpen)
  const activeEvent = events.find((e) => e._id === selEvent)
  const myRegs = registrations

  const alreadyRegisteredBoxerIds = new Set(myRegs.filter((r) => r.eventId?._id === selEvent).map((r) => r.boxerId?._id))

  const toggleSelect = (bid) => {
    if (selectedBoxers.includes(bid)) {
      setSelectedBoxers(selectedBoxers.filter((x) => x !== bid))
    } else {
      setSelectedBoxers([...selectedBoxers, bid])
    }
  }

  const submitRegistration = async () => {
    if (!selEvent || selectedBoxers.length === 0) return
    setBusy(true)
    try {
      for (const bid of selectedBoxers) {
        await api('/registrations', { method: 'POST', body: { eventId: selEvent, boxerId: bid } })
      }
      toast(`${selectedBoxers.length} boxer(s) registered`)
      setSelectedBoxers([])
      load()
    } catch (err) {
      toast(err.message, 'error')
    } finally {
      setBusy(false)
    }
  }

  const submitPayment = async () => {
    setBusy(true)
    try {
      await api(`/registrations/payment?id=${payModal._id}`, {
        method: 'PUT',
        body: {
          amount: Number(payForm.amount),
          method: payForm.method,
          reference: payForm.reference,
          paidAt: payForm.paidAt || undefined,
        },
      })
      toast('Payment submitted for review')
      setPayModal(null)
      setPayForm({ amount: '', method: '', reference: '', paidAt: '' })
      load()
    } catch (err) {
      toast(err.message, 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Register for Events</h1>
        <p className="text-sm text-slate-500">Select an event and choose boxers to register</p>
      </div>

      <Card>
        <CardHeader title="Step 1 — Select an Event" />
        <CardBody>
          <Select value={selEvent} onChange={(e) => { setSelEvent(e.target.value); setSelectedBoxers([]) }}>
            <option value="">Choose an event with open registration</option>
            {openEvents.map((e) => (
              <option key={e._id} value={e._id}>{e.name}</option>
            ))}
          </Select>
          {activeEvent && (
            <div className="mt-4 rounded-lg bg-slate-50 p-4 text-sm">
              {activeEvent.eventDate && <p><strong>Date:</strong> {new Date(activeEvent.eventDate).toLocaleDateString()}</p>}
              <p><strong>Venue:</strong> {activeEvent.venue || '—'}, {activeEvent.location || '—'}</p>
              {activeEvent.requirePayment && (
                <p><strong>Fee:</strong> {activeEvent.feeStructure?.type === 'per_club' ? 'Per club' : 'Per boxer'} — {activeEvent.feeStructure?.amount} {activeEvent.feeStructure?.currency}</p>
              )}
              <p><strong>Registration Deadline:</strong> {activeEvent.registrationDeadline ? new Date(activeEvent.registrationDeadline).toLocaleDateString() : '—'}</p>
            </div>
          )}
        </CardBody>
      </Card>

      {selEvent && (
        <Card>
          <CardHeader
            title="Step 2 — Select Your Boxers"
            action={selectedBoxers.length > 0 && <Button size="sm" onClick={submitRegistration} disabled={busy}>{busy ? <Spinner className="h-4 w-4 border-white" /> : `Register ${selectedBoxers.length} Selected`}</Button>}
          />
          <CardBody className="p-0">
            {boxers.length === 0 ? (
              <Empty title="No boxers in your database" message="Add boxers first, then return here to register them." />
            ) : (
              <ul className="divide-y divide-slate-200">
                {boxers.map((b) => {
                  const already = alreadyRegisteredBoxerIds.has(b._id)
                  const checked = selectedBoxers.includes(b._id)
                  return (
                    <li key={b._id} className="flex items-center gap-3 px-5 py-3">
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={already}
                        onChange={() => toggleSelect(b._id)}
                        className="h-4 w-4 rounded"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-slate-900">{b.fullName}</p>
                        <p className="text-sm text-slate-500">
                          {b.weightCategory && `${b.weightCategory} · `}{b.ageCategory || '—'}
                        </p>
                      </div>
                      {already && <span className="text-xs font-medium text-green-600">Already registered</span>}
                    </li>
                  )
                })}
              </ul>
            )}
          </CardBody>
        </Card>
      )}

      <Card>
        <CardHeader title="My Registrations & Payments" subtitle="Track approval status and submit payments" />
        <CardBody className="p-0">
          {myRegs.length === 0 ? (
            <Empty title="No registrations yet" />
          ) : (
            <ul className="divide-y divide-slate-200">
              {myRegs.map((r) => (
                <li key={r._id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                  <div>
                    <p className="font-medium text-slate-900">{r.boxerId?.fullName} — {r.eventId?.name}</p>
                    <p className="text-sm text-slate-500">
                      Category: {r.category?.weight || '—'}
                      {r.payment?.status !== 'not_required' && ` · Payment: ${r.payment?.status}`}
                    </p>
                    {r.promoterFeedback && <p className="mt-1 text-xs text-red-600">Feedback: {r.promoterFeedback}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={r.status} />
                    {['approved', 'payment_pending', 'payment_confirmed'].includes(r.status) &&
                      r.payment?.status !== 'confirmed' &&
                      r.payment?.status !== 'not_required' &&
                      r.payment?.status !== 'submitted' && (
                        <Button size="sm" onClick={() => {
                          setPayModal(r)
                          setPayForm({ amount: r.payment?.amount || '', method: '', reference: '', paidAt: '' })
                        }}>Submit Payment</Button>
                      )}
                    {r.payment?.status === 'submitted' && <StatusBadge status="submitted" />}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>

      <Modal
        open={!!payModal}
        onClose={() => setPayModal(null)}
        title={`Submit Payment — ${payModal?.boxerId?.fullName || ''}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setPayModal(null)}>Cancel</Button>
            <Button onClick={submitPayment} disabled={busy}>{busy ? <Spinner className="h-4 w-4 border-white" /> : 'Submit Payment'}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input label="Amount" type="number" value={payForm.amount} onChange={(e) => setPayForm({ ...payForm, amount: e.target.value })} required />
          <Input label="Payment Method" value={payForm.method} onChange={(e) => setPayForm({ ...payForm, method: e.target.value })} placeholder="e.g. Mobile Money, Bank Transfer" required />
          <Input label="Transaction / Reference No." value={payForm.reference} onChange={(e) => setPayForm({ ...payForm, reference: e.target.value })} required />
          <Input label="Payment Date" type="date" value={payForm.paidAt} onChange={(e) => setPayForm({ ...payForm, paidAt: e.target.value })} />
        </div>
      </Modal>
    </div>
  )
}
