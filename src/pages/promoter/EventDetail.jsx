import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../../utils/api.js'
import { useToast } from '../../context/ToastContext.jsx'
import { Button } from '../../components/Button.jsx'
import { Card } from '../../components/Card.jsx'
import { Loading, Empty, Spinner } from '../../components/Loading.jsx'
import { StatusBadge, Badge } from '../../components/Badge.jsx'
import { Modal } from '../../components/Modal.jsx'
import { Input, Textarea, Select } from '../../components/Field.jsx'
import TagInput from '../../components/TagInput.jsx'

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
  const [setupOpen, setSetupOpen] = useState(false)
  const [setup, setSetup] = useState({
    bankName: '',
    accountName: '',
    accountNumber: '',
    paymentInstructions: '',
    acceptedMethods: [],
    contactName: '',
    contactPhone: '',
    contactEmail: '',
  })
  const [methodText, setMethodText] = useState('')
  const [editOpen, setEditOpen] = useState(false)
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    venue: '',
    location: '',
    eventDate: '',
    registrationOpens: '',
    registrationDeadline: '',
    weighInDate: '',
    rules: '',
    registrationRequirements: '',
    feeType: 'none',
    feeAmount: '',
    currency: '',
    requirePayment: false,
    requireWeighIn: true,
    public: false,
  })
  const [editWeightCategories, setEditWeightCategories] = useState([])
  const [editAgeCategories, setEditAgeCategories] = useState([])
  const [editMethodOptions, setEditMethodOptions] = useState([])

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

  const changeStatus = async (status) => {
    try {
      const registrationOpen = status === 'open' || status === 'in_progress'
      await api(`/events/update?id=${id}`, { method: 'PATCH', body: { status, registrationOpen } })
      toast(`Event status set to ${status}`)
      load()
    } catch (err) {
      toast(err.message, 'error')
    }
  }

  const openSetup = () => {
    setSetup({
      bankName: event.paymentAccount?.bankName || '',
      accountName: event.paymentAccount?.accountName || '',
      accountNumber: event.paymentAccount?.accountNumber || '',
      paymentInstructions: event.paymentAccount?.paymentInstructions || '',
      acceptedMethods: event.paymentAccount?.acceptedMethods || [],
      contactName: event.promoterContact?.name || '',
      contactPhone: event.promoterContact?.phone || '',
      contactEmail: event.promoterContact?.email || '',
    })
    setMethodText('')
    setSetupOpen(true)
  }

  const addMethod = () => {
    const v = methodText.trim()
    if (v && !setup.acceptedMethods.includes(v)) {
      setSetup({ ...setup, acceptedMethods: [...setup.acceptedMethods, v] })
      setMethodText('')
    }
  }

  const saveSetup = async () => {
    setBusy(true)
    try {
      await api(`/events/update?id=${id}`, {
        method: 'PATCH',
        body: {
          paymentAccount: {
            bankName: setup.bankName,
            accountName: setup.accountName,
            accountNumber: setup.accountNumber,
            paymentInstructions: setup.paymentInstructions,
            acceptedMethods: setup.acceptedMethods,
          },
          promoterContact: {
            name: setup.contactName,
            phone: setup.contactPhone,
            email: setup.contactEmail,
          },
        },
      })
      toast('Payment account & contact updated')
      setSetupOpen(false)
      load()
    } catch (err) {
      toast(err.message, 'error')
    } finally {
      setBusy(false)
    }
  }

  const openEdit = () => {
    setEditForm({
      name: event.name || '',
      description: event.description || '',
      venue: event.venue || '',
      location: event.location || '',
      eventDate: event.eventDate ? String(event.eventDate).slice(0, 10) : '',
      registrationOpens: event.registrationOpens ? String(event.registrationOpens).slice(0, 10) : '',
      registrationDeadline: event.registrationDeadline ? String(event.registrationDeadline).slice(0, 10) : '',
      weighInDate: event.weighInDate ? String(event.weighInDate).slice(0, 10) : '',
      rules: event.rules || '',
      registrationRequirements: event.registrationRequirements || '',
      feeType: event.feeStructure?.type || 'none',
      feeAmount: event.feeStructure?.amount ?? '',
      currency: event.feeStructure?.currency || '',
      requirePayment: event.requirePayment || false,
      requireWeighIn: event.requireWeighIn ?? true,
      public: event.public || false,
    })
    setEditWeightCategories([...(event.weightCategories || [])])
    setEditAgeCategories([...(event.ageCategories || [])])
    setEditMethodOptions([...(event.paymentAccount?.acceptedMethods || [])])
    setEditOpen(true)
  }

  const saveEdit = async () => {
    setBusy(true)
    try {
      await api(`/events/update?id=${id}`, {
        method: 'PATCH',
        body: {
          name: editForm.name,
          description: editForm.description,
          venue: editForm.venue,
          location: editForm.location,
          eventDate: editForm.eventDate ? new Date(editForm.eventDate) : null,
          registrationOpens: editForm.registrationOpens ? new Date(editForm.registrationOpens) : null,
          registrationDeadline: editForm.registrationDeadline ? new Date(editForm.registrationDeadline) : null,
          weighInDate: editForm.weighInDate ? new Date(editForm.weighInDate) : null,
          rules: editForm.rules,
          registrationRequirements: editForm.registrationRequirements,
          weightCategories: editWeightCategories,
          ageCategories: editAgeCategories,
          requirePayment: editForm.requirePayment,
          requireWeighIn: editForm.requireWeighIn,
          public: editForm.public,
          feeStructure: {
            type: editForm.requirePayment ? editForm.feeType : 'none',
            amount: Number(editForm.feeAmount) || 0,
            currency: editForm.currency,
          },
          paymentAccount: {
            ...(event.paymentAccount || {}),
            acceptedMethods: editMethodOptions,
          },
        },
      })
      toast('Event details updated')
      setEditOpen(false)
      load()
    } catch (err) {
      toast(err.message, 'error')
    } finally {
      setBusy(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm(`Delete event "${event.name}"? This cannot be undone.`)) return
    setBusy(true)
    try {
      await api(`/events?id=${id}`, { method: 'DELETE' })
      toast('Event deleted')
      navigate('/app/events')
    } catch (err) {
      toast(err.message, 'error')
      setBusy(false)
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
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-brand-900 px-6 py-6 text-white shadow-lg">
        <div className="absolute -right-10 -top-10 h-44 w-44 rounded-full bg-brand-600/30 blur-2xl" />
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
          <div>
            <button onClick={() => navigate('/app/events')} className="mb-1 text-sm text-blue-200 hover:text-white">← Events</button>
            <h1 className="text-2xl font-bold sm:text-3xl">{event.name}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-300">
              <span>{event.venue}{event.location && ` · ${event.location}`}</span>
              {event.eventDate && <span>· {new Date(event.eventDate).toLocaleDateString()}</span>}
              <span className="ml-1"><StatusBadge status={event.status} /></span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="secondary" onClick={openEdit}>Edit Details</Button>
            <Button variant="secondary" onClick={() => navigate(`/app/events/${id}/draws`)}>Draws</Button>
            <Button variant="secondary" onClick={() => navigate(`/app/events/${id}/bouts`)}>Bouts</Button>
            <Button variant="secondary" onClick={() => navigate(`/app/events/${id}/results`)}>Results</Button>
            <select
              value={event.status}
              onChange={(e) => changeStatus(e.target.value)}
              className="rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm font-semibold text-white focus:border-white/40 focus:outline-none focus:ring-1 focus:ring-white/40 [&>option]:text-slate-900"
            >
              <option value="draft">Draft</option>
              <option value="open">Open</option>
              <option value="closed">Closed</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="archived">Archived</option>
            </select>
            {event.registrationOpen ? (
              <Button variant="secondary" onClick={() => toggleRegistration(false)}>Close Registration</Button>
            ) : (
              <Button onClick={() => toggleRegistration(true)}>Open Registration</Button>
            )}
            <Button variant="danger" onClick={handleDelete}>Delete Event</Button>
          </div>
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

          <Card className="p-6 lg:col-span-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold">Payment Account & Promoter Contact</h3>
                {event.requirePayment ? (
                  <StatusBadge status={event.paymentAccount?.accountNumber ? 'approved' : 'pending'} />
                ) : (
                  <Badge tone="slate">No fee required</Badge>
                )}
              </div>
              <Button size="sm" variant="secondary" onClick={openSetup}>Edit</Button>
            </div>
            {event.requirePayment ? (
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Bank / M-Pesa Account</p>
                  <dl className="mt-2 space-y-1.5 text-sm">
                    <div className="flex justify-between"><dt className="text-slate-500">Bank</dt><dd className="font-medium text-slate-900">{event.paymentAccount?.bankName || '—'}</dd></div>
                    <div className="flex justify-between"><dt className="text-slate-500">Account Name</dt><dd className="font-medium text-slate-900">{event.paymentAccount?.accountName || '—'}</dd></div>
                    <div className="flex justify-between"><dt className="text-slate-500">Account No.</dt><dd className="font-medium text-slate-900">{event.paymentAccount?.accountNumber || '—'}</dd></div>
                    {event.paymentAccount?.acceptedMethods?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-2">{[...event.paymentAccount.acceptedMethods].map((m) => <Badge key={m} tone="blue">{m}</Badge>)}</div>
                    )}
                  </dl>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Promoter Contact</p>
                  <dl className="mt-2 space-y-1.5 text-sm">
                    <div className="flex justify-between"><dt className="text-slate-500">Name</dt><dd className="font-medium text-slate-900">{event.promoterContact?.name || '—'}</dd></div>
                    <div className="flex justify-between"><dt className="text-slate-500">Phone</dt><dd className="font-medium text-slate-900">{event.promoterContact?.phone || '—'}</dd></div>
                    <div className="flex justify-between"><dt className="text-slate-500">Email</dt><dd className="font-medium text-brand-700">{event.promoterContact?.email || '—'}</dd></div>
                  </dl>
                </div>
                {event.paymentAccount?.paymentInstructions && (
                  <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 sm:col-span-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Payment Instructions</p>
                    <p className="mt-1 text-sm text-blue-900">{event.paymentAccount.paymentInstructions}</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="mt-3 text-sm text-slate-500">
                This event does not require a registration fee, so no payment account is shown to clubs.
              </p>
            )}
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

      <Modal
        open={setupOpen}
        onClose={() => setSetupOpen(false)}
        title="Payment Account & Promoter Contact"
        footer={
          <>
            <Button variant="secondary" onClick={() => setSetupOpen(false)}>Cancel</Button>
            <Button onClick={saveSetup} disabled={busy}>{busy ? <Spinner className="h-4 w-4 border-white" /> : 'Save Changes'}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <p className="mb-2 text-sm font-semibold text-slate-900">Bank / Mobile Money Account</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Bank Name" value={setup.bankName} onChange={(e) => setSetup({ ...setup, bankName: e.target.value })} placeholder="e.g. Equity Bank" />
              <Input label="Account Name" value={setup.accountName} onChange={(e) => setSetup({ ...setup, accountName: e.target.value })} placeholder="Account holder" />
              <Input label="Account Number" value={setup.accountNumber} onChange={(e) => setSetup({ ...setup, accountNumber: e.target.value })} placeholder="Account / M-Pesa no." />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Accepted Payment Methods</label>
            <div className="flex gap-2">
              <input
                value={methodText}
                onChange={(e) => setMethodText(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addMethod() } }}
                placeholder="e.g. M-Pesa, Bank Transfer"
                className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
              />
              <Button type="button" variant="secondary" onClick={addMethod}>Add</Button>
            </div>
            {setup.acceptedMethods.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {setup.acceptedMethods.map((m) => (
                  <span key={m} className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-800">
                    {m}
                    <button type="button" onClick={() => setSetup({ ...setup, acceptedMethods: setup.acceptedMethods.filter((x) => x !== m) })} className="text-blue-400 hover:text-blue-900">×</button>
                  </span>
                ))}
              </div>
            )}
          </div>
          <Textarea label="Payment Instructions" value={setup.paymentInstructions} onChange={(e) => setSetup({ ...setup, paymentInstructions: e.target.value })} rows={2} placeholder="e.g. Use the boxer's name as the payment reference" />
          <div className="border-t border-slate-200 pt-4">
            <p className="mb-2 text-sm font-semibold text-slate-900">Promoter Contact (for payment confirmation)</p>
            <div className="grid gap-4 sm:grid-cols-3">
              <Input label="Name" value={setup.contactName} onChange={(e) => setSetup({ ...setup, contactName: e.target.value })} placeholder="Full name" />
              <Input label="Phone / WhatsApp" value={setup.contactPhone} onChange={(e) => setSetup({ ...setup, contactPhone: e.target.value })} placeholder="+254 7XX XXX XXX" />
              <Input label="Email" value={setup.contactEmail} onChange={(e) => setSetup({ ...setup, contactEmail: e.target.value })} placeholder="promoter@example.com" />
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit Event Details"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={saveEdit} disabled={busy}>{busy ? <Spinner className="h-4 w-4 border-white" /> : 'Save Changes'}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input label="Event Name" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} required />
          <Textarea label="Description" value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} rows={2} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Venue" value={editForm.venue} onChange={(e) => setEditForm({ ...editForm, venue: e.target.value })} />
            <Input label="Location" value={editForm.location} onChange={(e) => setEditForm({ ...editForm, location: e.target.value })} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Input label="Event Date" type="date" value={editForm.eventDate} onChange={(e) => setEditForm({ ...editForm, eventDate: e.target.value })} />
            <Input label="Registration Opens" type="date" value={editForm.registrationOpens} onChange={(e) => setEditForm({ ...editForm, registrationOpens: e.target.value })} />
            <Input label="Registration Deadline" type="date" value={editForm.registrationDeadline} onChange={(e) => setEditForm({ ...editForm, registrationDeadline: e.target.value })} />
            <Input label="Weigh-In Date" type="date" value={editForm.weighInDate} onChange={(e) => setEditForm({ ...editForm, weighInDate: e.target.value })} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <TagInput label="Weight Categories" placeholder="e.g. 60kg" values={editWeightCategories} setValues={setEditWeightCategories} />
            <TagInput label="Age Categories" placeholder="e.g. Junior" values={editAgeCategories} setValues={setEditAgeCategories} />
          </div>
          <Textarea label="Competition Rules" value={editForm.rules} onChange={(e) => setEditForm({ ...editForm, rules: e.target.value })} rows={2} />
          <Textarea label="Registration Requirements" value={editForm.registrationRequirements} onChange={(e) => setEditForm({ ...editForm, registrationRequirements: e.target.value })} rows={2} />
          <div className="border-t border-slate-200 pt-4">
            <p className="mb-2 text-sm font-semibold text-slate-900">Fees & Settings</p>
            <div className="space-y-3">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={editForm.requirePayment} onChange={(e) => setEditForm({ ...editForm, requirePayment: e.target.checked })} className="h-4 w-4 rounded" />
                <span className="text-sm text-slate-700">Require registration payment</span>
              </label>
              {editForm.requirePayment && (
                <div className="grid gap-4 rounded-lg bg-slate-50 p-4 sm:grid-cols-3">
                  <Select label="Fee Type" value={editForm.feeType} onChange={(e) => setEditForm({ ...editForm, feeType: e.target.value })}>
                    <option value="per_boxer">Per Boxer</option>
                    <option value="per_club">Per Club</option>
                  </Select>
                  <Input label="Amount" type="number" value={editForm.feeAmount} onChange={(e) => setEditForm({ ...editForm, feeAmount: e.target.value })} placeholder="0.00" />
                  <Input label="Currency" value={editForm.currency} onChange={(e) => setEditForm({ ...editForm, currency: e.target.value })} placeholder="e.g. $, GBP" />
                </div>
              )}
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={editForm.requireWeighIn} onChange={(e) => setEditForm({ ...editForm, requireWeighIn: e.target.checked })} className="h-4 w-4 rounded" />
                <span className="text-sm text-slate-700">Require weigh-in before competition</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={editForm.public} onChange={(e) => setEditForm({ ...editForm, public: e.target.checked })} className="h-4 w-4 rounded" />
                <span className="text-sm text-slate-700">Make event visible to the public</span>
              </label>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}
