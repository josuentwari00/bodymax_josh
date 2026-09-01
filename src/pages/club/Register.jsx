import { useEffect, useState } from 'react'
import { api } from '../../utils/api.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { useToast } from '../../context/ToastContext.jsx'
import { Button } from '../../components/Button.jsx'
import { Card } from '../../components/Card.jsx'
import { Loading, Empty, Spinner } from '../../components/Loading.jsx'
import { StatusBadge, Badge } from '../../components/Badge.jsx'
import { Modal } from '../../components/Modal.jsx'
import { Input } from '../../components/Field.jsx'

function StepBadge({ n, title, subtitle }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-600 to-blue-900 text-sm font-bold text-white shadow-md shadow-blue-200">
        {n}
      </div>
      <div>
        <p className="font-semibold text-slate-900">{title}</p>
        <p className="text-xs text-slate-500">{subtitle}</p>
      </div>
    </div>
  )
}

function PayInfo({ event }) {
  const acc = event.paymentAccount || {}
  return (
    <div className="mt-3 rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-white p-4">
      <div className="flex items-center gap-2">
        <svg className="h-5 w-5 text-brand-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h2m4 0h4M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
        <p className="text-sm font-semibold text-slate-900">Where to Send the Fee</p>
      </div>
      <dl className="mt-3 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
        {acc.bankName && (
          <div className="flex justify-between"><dt className="text-slate-500">Bank</dt><dd className="font-medium text-slate-900">{acc.bankName}</dd></div>
        )}
        {acc.accountName && (
          <div className="flex justify-between"><dt className="text-slate-500">Account Name</dt><dd className="font-medium text-slate-900">{acc.accountName}</dd></div>
        )}
        {acc.accountNumber && (
          <div className="flex justify-between"><dt className="text-slate-500">Account No.</dt><dd className="rounded bg-white px-1.5 font-mono font-semibold text-brand-800">{acc.accountNumber}</dd></div>
        )}
      </dl>
      {acc.acceptedMethods?.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-slate-500">Accepted:</span>
          {acc.acceptedMethods.map((m) => <Badge key={m} tone="blue">{m}</Badge>)}
        </div>
      )}
      {acc.paymentInstructions && (
        <p className="mt-3 rounded-lg bg-white/70 px-3 py-2 text-xs text-slate-600">
          <span className="font-semibold text-slate-900">Instructions:</span> {acc.paymentInstructions}
        </p>
      )}
    </div>
  )
}

function ContactCard({ contact }) {
  if (!contact?.phone && !contact?.email && !contact?.name) return null
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-center gap-2">
        <svg className="h-5 w-5 text-brand-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13.5V9a2 2 0 00-2-2H6a2 2 0 00-2 2v4.5m16 0a1 1 0 01-1 1h-2l-2 3v-3H5a1 1 0 01-1-1m1-1h.01M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2" />
        </svg>
        <p className="text-sm font-semibold text-slate-900">Promoter Contact</p>
      </div>
      <dl className="mt-3 space-y-1.5 text-sm">
        {contact.name && <div className="flex justify-between"><dt className="text-slate-500">Name</dt><dd className="font-medium text-slate-900">{contact.name}</dd></div>}
        {contact.phone && <div className="flex justify-between"><dt className="text-slate-500">Phone / WhatsApp</dt><dd className="font-medium text-brand-800">{contact.phone}</dd></div>}
        {contact.email && <div className="flex justify-between"><dt className="text-slate-500">Email</dt><dd className="font-medium text-brand-800">{contact.email}</dd></div>}
      </dl>
    </div>
  )
}

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
  const [justRegistered, setJustRegistered] = useState(null)

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

  const alreadyRegisteredBoxerIds = new Set(registrations.filter((r) => r.eventId?._id === selEvent).map((r) => r.boxerId?._id))

  const feeType = activeEvent?.feeStructure?.type
  const feeAmount = Number(activeEvent?.feeStructure?.amount) || 0
  const feePerBoxer = feeType === 'per_boxer' ? feeAmount : 0
  const requiresPayment = !!activeEvent && !!feeType && feeType !== 'none' && feeAmount > 0
  const perBoxerTotal = feePerBoxer * selectedBoxers.length
  const totalFee = feeType === 'per_club' ? (selectedBoxers.length > 0 ? feeAmount : 0) : perBoxerTotal

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
      setJustRegistered(activeEvent)
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
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-brand-900 px-6 py-8 text-white shadow-lg">
        <div className="relative z-10">
          <h1 className="text-2xl font-bold sm:text-3xl">Register for Events</h1>
          <p className="mt-1 text-sm text-slate-300">
            Select an event, choose your boxers, and see exactly where to pay the entry fee.
          </p>
        </div>
        <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-brand-600/30 blur-2xl" />
      </div>

      <Card className="p-5 sm:p-6">
        <StepBadge n={1} title="Select an Event" subtitle="Events currently open for registration" />
        <div className="mt-4">
          <select
            value={selEvent}
            onChange={(e) => { setSelEvent(e.target.value); setSelectedBoxers([]); setJustRegistered(null) }}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          >
            <option value="">Choose an event with open registration</option>
            {openEvents.map((e) => (
              <option key={e._id} value={e._id}>
                {e.name}
                {e.feeStructure?.type && e.feeStructure.type !== 'none' && Number(e.feeStructure.amount) > 0
                  ? ` — Entry: ${e.feeStructure.amount} ${e.feeStructure.currency}${e.feeStructure.type === 'per_boxer' ? '/boxer' : ' (per club)'}`
                  : ''}
              </option>
            ))}
          </select>

          {activeEvent && (
            <div className="mt-4 grid gap-4 lg:grid-cols-3">
              <div className="rounded-xl border border-slate-200 bg-white p-4 lg:col-span-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-base font-semibold text-slate-900">{activeEvent.name}</h3>
                  <StatusBadge status={activeEvent.status} />
                </div>
                <dl className="mt-3 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
                  <div className="flex justify-between"><dt className="text-slate-500">Date</dt><dd className="font-medium text-slate-900">{activeEvent.eventDate ? new Date(activeEvent.eventDate).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</dd></div>
                  <div className="flex justify-between"><dt className="text-slate-500">Venue</dt><dd className="font-medium text-slate-900">{activeEvent.venue || '—'}, {activeEvent.location || '—'}</dd></div>
                  <div className="flex justify-between"><dt className="text-slate-500">Deadline</dt><dd className="font-medium text-slate-900">{activeEvent.registrationDeadline ? new Date(activeEvent.registrationDeadline).toLocaleDateString() : '—'}</dd></div>
                  <div className="flex justify-between"><dt className="text-slate-500">Weigh-In</dt><dd className="font-medium text-slate-900">{activeEvent.weighInDate ? new Date(activeEvent.weighInDate).toLocaleDateString() : '—'}</dd></div>
                </dl>
              </div>

              <div className="rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 p-4 text-white">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-300">Registration Fee</p>
                {requiresPayment ? (
                  <>
                    <p className="mt-1 text-2xl font-bold">
                      {activeEvent.feeStructure?.amount} {activeEvent.feeStructure?.currency}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-300">
                      {activeEvent.feeStructure?.type === 'per_boxer' ? 'per boxer' : 'per club'}
                    </p>
                    {activeEvent.feeStructure?.notes && <p className="mt-2 text-xs text-slate-300">{activeEvent.feeStructure.notes}</p>}
                  </>
                ) : (
                  <p className="mt-1 text-2xl font-bold text-slate-100">Free</p>
                )}
              </div>
            </div>
          )}

          {activeEvent && requiresPayment && (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <PayInfo event={activeEvent} />
              <ContactCard contact={activeEvent.promoterContact} />
            </div>
          )}
        </div>
      </Card>

      {selEvent && (
        <Card className="p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <StepBadge n={2} title="Select Your Boxers" subtitle="Tick the boxers you want to enter" />
            <div className="flex items-center gap-3">
              {requiresPayment && selectedBoxers.length > 0 && (
                <div className="rounded-lg bg-blue-50 px-3 py-2 text-right">
                  <p className="text-xs text-slate-500">Estimated Total</p>
                  <p className="text-sm font-bold text-brand-800">
                    {totalFee} {activeEvent?.feeStructure?.currency}
                    {feeType === 'per_club' ? ' (one-off per club)' : ` (${selectedBoxers.length} × ${feePerBoxer} per boxer)`}
                  </p>
                </div>
              )}
              <Button size="sm" onClick={submitRegistration} disabled={busy || selectedBoxers.length === 0}>
                {busy ? <Spinner className="h-4 w-4 border-white" /> : `Register ${selectedBoxers.length} Selected`}
              </Button>
            </div>
          </div>

          {boxers.length === 0 ? (
            <div className="mt-4">
              <Empty title="No boxers in your database" message="Add boxers first, then return here to register them." />
            </div>
          ) : (
            <ul className="mt-5 divide-y divide-slate-200">
              {boxers.map((b) => {
                const already = alreadyRegisteredBoxerIds.has(b._id)
                const checked = selectedBoxers.includes(b._id)
                return (
                  <li key={b._id} className="flex items-center gap-3 py-3">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${b.gender === 'F' ? 'bg-blue-100 text-brand-800' : 'bg-slate-900 text-white'}`}>
                      {b.fullName?.split(' ').map((w) => w[0]).slice(0, 2).join('') || '?'}
                    </div>
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={already}
                      onChange={() => toggleSelect(b._id)}
                      className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-slate-900">{b.fullName}</p>
                      <p className="text-sm text-slate-500">
                        <Badge tone={b.gender === 'F' ? 'blue' : 'dark'}>{b.gender === 'F' ? 'Female' : 'Male'}</Badge>
                        {b.weightCategory && <span className="ml-1.5">{b.weightCategory}</span>}
                        {b.registeredWeightKg && <span className="text-slate-400"> · {b.registeredWeightKg}kg</span>}
                        {b.ageCategory && <span className="text-slate-400"> · {b.ageCategory}</span>}
                      </p>
                    </div>
                    {already && <span className="text-xs font-medium text-brand-700">Already registered</span>}
                  </li>
                )
              })}
            </ul>
          )}

          {requiresPayment && (
            <div className="mt-5 rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-900">
              After registering, pay the fee at the account shown above, then contact the promoter to confirm your payment was received.
            </div>
          )}
        </Card>
      )}

      {justRegistered && (
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-600 text-white shadow-md shadow-blue-200">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Registration Submitted!</h3>
              <p className="text-sm text-slate-500">Your boxers have been entered for {justRegistered.name}.</p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Next Step — Pay the Fee {requiresPayment && `(${justRegistered.feeStructure?.amount} ${justRegistered.feeStructure?.currency} ${justRegistered.feeStructure?.type === 'per_boxer' ? 'per boxer' : 'per club'})`}</p>
              {requiresPayment ? (
                <p className="mt-2 text-sm text-slate-600">
                  Send the registration fee to the account shown for this event, and use your club name as the payment reference where possible.
                </p>
              ) : (
                <p className="mt-2 text-sm text-slate-600">No fee is required for this event — you can skip straight to confirmation.</p>
              )}
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Next Step — Get Confirmation</p>
              <p className="mt-2 text-sm text-slate-600">
                Contact the promoter to confirm your registration and payment so your boxers can be approved.
              </p>
              <ContactCard contact={justRegistered.promoterContact} />
            </div>
          </div>

          <Button variant="secondary" className="mt-4" onClick={() => setJustRegistered(null)}>Done</Button>
        </Card>
      )}

      <Card className="p-0">
        <div className="flex flex-wrap items-center justify-between border-b border-slate-200 bg-slate-50/60 px-5 py-3">
          <div>
            <h3 className="font-semibold text-slate-900">My Registrations & Payments</h3>
            <p className="text-xs text-slate-500">Track approval status and submit payment details</p>
          </div>
        </div>
        {myRegs.length === 0 ? (
          <div className="p-6">
            <Empty title="No registrations yet" />
          </div>
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
                  {r.promoterFeedback && <p className="mt-1 text-xs text-slate-800">Feedback: {r.promoterFeedback}</p>}
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