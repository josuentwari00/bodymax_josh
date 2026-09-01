import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../../utils/api.js'
import { useToast } from '../../context/ToastContext.jsx'
import { Button } from '../../components/Button.jsx'
import { Card } from '../../components/Card.jsx'
import { Loading, Empty } from '../../components/Loading.jsx'
import { StatusBadge, Badge } from '../../components/Badge.jsx'
import { Modal } from '../../components/Modal.jsx'
import { Input, Textarea, Select } from '../../components/Field.jsx'

export default function EventDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()

  const [event, setEvent] = useState(null)
  const [registrations, setRegistrations] = useState(null)
  const [tab, setTab] = useState('overview')
  const [actionReg, setActionReg] = useState(null)
  const [action, setAction] = useState('')
  const [feedback, setFeedback] = useState('')
  const [busy, setBusy] = useState(false)
  const [weighReg, setWeighReg] = useState(null)
  const [weighWeight, setWeighWeight] = useState('')
  const [weighNotes, setWeighNotes] = useState('')

  const load = () => {
    api(`/events?id=${id}`).then((d) => setEvent(d.event)).catch(() => {})
    api(`/registrations?eventId=${id}`).then((d) => setRegistrations(d.registrations)).catch(() => {})
  }

  useEffect(load, [id])

  const runAction = async () => {
    setBusy(true)
    try {
      await api(`/registrations/manage?id=${actionReg._id}`, { method: 'POST', body: { action, feedback } })
      toast('Updated successfully')
      setActionReg(null)
      setFeedback('')
      load()
    } catch (err) {
      toast(err.message, 'error')
    } finally {
      setBusy(false)
    }
  }

  const recordWeight = async () => {
    if (!weighWeight) {
      toast('Enter an official weight', 'error')
      return
    }
    setBusy(true)
    try {
      await api(`/weighins/record?registrationId=${weighReg._id}`, {
        method: 'POST',
        body: { officialWeightKg: Number(weighWeight), notes: weighNotes },
      })
      toast('Weigh-in recorded')
      setWeighReg(null)
      setWeighWeight('')
      setWeighNotes('')
      load()
    } catch (err) {
      toast(err.message, 'error')
    } finally {
      setBusy(false)
    }
  }

  const toggleRegistration = async (open) => {
    try {
      await api(`/events/update?id=${id}`, { method: 'PATCH', body: { registrationOpen: open } })
      toast(open ? 'Registration opened' : 'Registration closed')
      load()
    } catch (err) {
      toast(err.message, 'error')
    }
  }

  if (!event) return <Loading />
  if (!registrations) return <Loading />

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'registrations', label: `Registrations (${registrations.length})` },
    { id: 'payments', label: 'Payments' },
    { id: 'weighins', label: 'Weigh-In' },
  ]

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <button onClick={() => navigate('/app/events')} className="mb-1 text-sm text-brand-600 hover:underline">← Events</button>
          <h1 className="text-2xl font-bold text-slate-900">{event.name}</h1>
          <p className="text-sm text-slate-500">
            {event.venue}{event.location && ` · ${event.location}`}
            {event.eventDate && ` · ${new Date(event.eventDate).toLocaleDateString()}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => navigate(`/app/events/${id}/draws`)}>Draws</Button>
          <Button variant="secondary" onClick={() => navigate(`/app/events/${id}/bouts`)}>Bouts</Button>
          <Button variant="secondary" onClick={() => navigate(`/app/events/${id}/results`)}>Results</Button>
          {event.registrationOpen ? (
            <Button variant="secondary" onClick={() => toggleRegistration(false)}>Close Registration</Button>
          ) : (
            <Button onClick={() => toggleRegistration(true)}>Open Registration</Button>
          )}
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-1 border-b border-slate-200">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium ${
              tab === t.id ? 'border-brand-600 text-brand-700' : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="p-6">
            <h3 className="mb-3 text-base font-semibold">Event Details</h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-slate-500">Description</dt><dd className="text-right">{event.description || '—'}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Venue</dt><dd>{event.venue || '—'}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Location</dt><dd>{event.location || '—'}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Weigh-In Date</dt><dd>{event.weighInDate ? new Date(event.weighInDate).toLocaleDateString() : '—'}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Registration Deadline</dt><dd>{event.registrationDeadline ? new Date(event.registrationDeadline).toLocaleDateString() : '—'}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Status</dt><dd><StatusBadge status={event.status} /></dd></div>
            </dl>
          </Card>
          <Card className="p-6">
            <h3 className="mb-3 text-base font-semibold">Categories</h3>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-slate-500">Weight Categories</p>
                <div className="mt-1 flex flex-wrap gap-2">
                  {event.weightCategories?.length ? event.weightCategories.map((c) => <Badge key={c}>{c}</Badge>) : <span>None</span>}
                </div>
              </div>
              <div>
                <p className="text-slate-500">Age Categories</p>
                <div className="mt-1 flex flex-wrap gap-2">
                  {event.ageCategories?.length ? event.ageCategories.map((c) => <Badge key={c}>{c}</Badge>) : <span>None</span>}
                </div>
              </div>
              <div>
                <p className="text-slate-500">Fees</p>
                <p>{event.requirePayment ? `${event.feeStructure?.type === 'per_club' ? 'Per club' : 'Per boxer'}: ${event.feeStructure?.amount} ${event.feeStructure?.currency}` : 'No fee'}</p>
              </div>
            </div>
          </Card>
          {event.rules && (
            <Card className="p-6 lg:col-span-2">
              <h3 className="mb-2 text-base font-semibold">Rules</h3>
              <p className="whitespace-pre-line text-sm text-slate-700">{event.rules}</p>
            </Card>
          )}
        </div>
      )}

      {tab === 'registrations' && (
        <Card>
          <div className="p-0">
            {registrations.length === 0 ? (
              <Empty title="No registrations yet" message="Registrations from clubs will appear here." />
            ) : (
              <ul className="divide-y divide-slate-200">
                {registrations.map((r) => (
                  <li key={r._id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                    <div>
                      <p className="font-medium text-slate-900">{r.boxerId?.fullName || 'Boxer'}</p>
                      <p className="text-sm text-slate-500">
                        {r.clubId?.name}
                        {r.boxerId?.weightCategory && ` · ${r.boxerId.weightCategory}`}
                      </p>
                      {r.promoterFeedback && <p className="mt-1 text-xs text-slate-800">Feedback: {r.promoterFeedback}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={r.status} />
                      {(r.status === 'pending_approval' || r.status === 'needs_correction' || r.status === 'approved') && (
                        <>
                          <Button size="sm" onClick={() => { setActionReg(r); setAction('approve') }}>Approve</Button>
                          <Button size="sm" variant="secondary" onClick={() => { setActionReg(r); setAction('needs_correction') }}>Request Change</Button>
                          <Button size="sm" variant="danger" onClick={() => { setActionReg(r); setAction('reject') }}>Reject</Button>
                        </>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>
      )}

      {tab === 'payments' && (
        <Card>
          <div className="p-0">
            {registrations.filter((r) => r.payment?.status !== 'not_required').length === 0 ? (
              <Empty title="No payments" message="This event does not require payments, or none have been submitted." />
            ) : (
              <ul className="divide-y divide-slate-200">
                {registrations.filter((r) => r.payment?.status !== 'not_required').map((r) => (
                  <li key={r._id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                    <div>
                      <p className="font-medium text-slate-900">{r.boxerId?.fullName} — {r.clubId?.name}</p>
                      <p className="text-sm text-slate-500">
                        Amount: {r.payment?.amount} {event.feeStructure?.currency || ''}
                        {r.payment?.reference && ` · Ref: ${r.payment.reference}`}
                        {r.payment?.method && ` · ${r.payment.method}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={r.payment?.status} />
                      {r.payment?.status === 'submitted' && (
                        <>
                          <Button size="sm" onClick={() => { setActionReg(r); setAction('payment_confirm') }}>Confirm</Button>
                          <Button size="sm" variant="danger" onClick={() => { setActionReg(r); setAction('payment_reject') }}>Reject</Button>
                        </>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>
      )}

      {tab === 'weighins' && (
        <Card>
          <div className="p-0">
            <ul className="divide-y divide-slate-200">
              {registrations.length === 0 ? (
                <Empty title="No registrations" />
              ) : (
                registrations.map((r) => (
                  <li key={r._id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                    <div>
                      <p className="font-medium text-slate-900">{r.boxerId?.fullName}</p>
                      <p className="text-sm text-slate-500">
                        {r.clubId?.name}
                        {r.weighIn?.officialWeightKg && ` · Official weight: ${r.weighIn.officialWeightKg}kg`}
                        {r.weighIn?.weighedAt && ` · ${new Date(r.weighIn.weighedAt).toLocaleString()}`}
                      </p>
                      {r.weighIn?.notes && <p className="mt-1 text-xs text-slate-500">{r.weighIn.notes}</p>}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge status={r.weighIn?.status} />
                      <StatusBadge status={r.status} />
                      {r.weighIn?.status !== 'successful' ? (
                        <Button size="sm" variant="secondary" onClick={() => { setWeighReg(r); setWeighWeight(r.boxerId?.registeredWeightKg || ''); setWeighNotes('') }}>
                          Record Weight
                        </Button>
                      ) : (
                        <>
                          {r.status !== 'eligible' && (
                            <Button size="sm" onClick={() => { setActionReg(r); setAction('mark_eligible') }}>Mark Eligible</Button>
                          )}
                          <Button size="sm" variant="danger" onClick={() => { setActionReg(r); setAction('mark_ineligible') }}>Not Eligible</Button>
                        </>
                      )}
                    </div>
                  </li>
                ))
              )}
            </ul>
          </div>
        </Card>
      )}

      <Modal
        open={!!weighReg}
        onClose={() => setWeighReg(null)}
        title={`Record Weigh-In — ${weighReg?.boxerId?.fullName || ''}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setWeighReg(null)}>Cancel</Button>
            <Button onClick={recordWeight} disabled={busy}>Record Weight</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input label="Official Weight (kg)" type="number" step="0.1" value={weighWeight} onChange={(e) => setWeighWeight(e.target.value)} required />
          <Textarea label="Notes (optional)" value={weighNotes} onChange={(e) => setWeighNotes(e.target.value)} rows={2} />
        </div>
      </Modal>

      <Modal
        open={!!actionReg}
        onClose={() => setActionReg(null)}
        title={action === 'approve' ? 'Approve Registration' : action === 'reject' ? 'Reject Registration' : action === 'needs_correction' ? 'Request Correction' : action === 'payment_confirm' ? 'Confirm Payment' : action === 'payment_reject' ? 'Reject Payment' : 'Action'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setActionReg(null)}>Cancel</Button>
            <Button onClick={runAction} disabled={busy} variant={action.includes('reject') ? 'danger' : 'primary'}>Confirm</Button>
          </>
        }
      >
        <p className="text-sm text-slate-600">
          {actionReg?.boxerId?.fullName} — {actionReg?.clubId?.name}
        </p>
        <div className="mt-4">
          <Textarea label="Feedback (optional)" value={feedback} onChange={(e) => setFeedback(e.target.value)} rows={3} placeholder="Optional note to the club" />
        </div>
      </Modal>
    </div>
  )
}
