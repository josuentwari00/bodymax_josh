import { useEffect, useState } from 'react'
import { api } from '../../utils/api.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { useToast } from '../../context/ToastContext.jsx'
import { Button } from '../../components/Button.jsx'
import { Card } from '../../components/Card.jsx'
import { Loading, Empty, Spinner } from '../../components/Loading.jsx'
import { StatusBadge } from '../../components/Badge.jsx'
import { Modal } from '../../components/Modal.jsx'
import { Textarea, Select } from '../../components/Field.jsx'

const filters = [
  { value: 'all', label: 'All' },
  { value: 'pending_approval', label: 'Pending Approval' },
  { value: 'needs_correction', label: 'Needs Correction' },
  { value: 'approved', label: 'Approved' },
  { value: 'payment_pending', label: 'Payment Pending' },
  { value: 'payment_confirmed', label: 'Payment Confirmed' },
  { value: 'eligible', label: 'Eligible' },
  { value: 'withdrawn', label: 'Withdrawn' },
]

const phoneIcon = (
  <svg className="h-4 w-4 shrink-0 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.68l1.44 4.32a1 1 0 01-.55 1.25l-1.7.68a12 12 0 005.66 5.66l.68-1.7a1 1 0 011.25-.55l4.32 1.44a1 1 0 01.68.94V19a2 2 0 01-2 2h-2C9.72 21 3 14.28 3 6V5z" />
  </svg>
)
const mailIcon = (
  <svg className="h-4 w-4 shrink-0 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 6l-9 6-9-6m18 0l-9 6L3 6m18 0v12a2 2 0 01-2 2H5a2 2 0 01-2-2V6" />
  </svg>
)
const personIcon = (
  <svg className="h-4 w-4 shrink-0 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
)

function ClubGroup({ club, open, onToggle, onBoxerAction, onConfirmClub, confirming, isPromoter }) {
  const regs = club.regs
  const awaiting = regs.filter((r) => ['pending', 'submitted'].includes(r.payment?.status))
  return (
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white">
            {club.club.name?.split(' ').map((w) => w[0]).slice(0, 2).join('') || '?'}
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-semibold text-slate-900">{club.club.name}</p>
              <span className="text-xs text-slate-500">{regs.length} boxer{regs.length === 1 ? '' : 's'}</span>
            </div>
            <div className="mt-1 space-y-0.5 text-sm text-slate-500">
              {club.club.contactName && (
                <span className="flex items-center gap-1.5">{personIcon}<span>{club.club.contactName}</span></span>
              )}
              {club.club.contactPhone && (
                <span className="flex items-center gap-1.5">{phoneIcon}<span>{club.club.contactPhone}</span></span>
              )}
              {club.club.contactEmail && (
                <span className="flex items-center gap-1.5">{mailIcon}<span className="break-all">{club.club.contactEmail}</span></span>
              )}
              {!club.club.contactName && !club.club.contactPhone && !club.club.contactEmail && (
                <span className="text-xs">No contact info on file</span>
              )}
            </div>
            {awaiting.length > 0 && (
              <p className="mt-1 text-xs text-blue-600">
                {awaiting.length} payment{awaiting.length === 1 ? '' : 's'} awaiting confirmation
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isPromoter && awaiting.length > 0 && (
            <Button size="sm" onClick={() => onConfirmClub(club)} disabled={confirming === club.club._id}>
              {confirming === club.club._id ? <Spinner className="h-4 w-4 border-white" /> : 'Confirm Club'}
            </Button>
          )}
          <Button size="sm" variant="secondary" onClick={onToggle}>
            {open ? 'Close' : 'View Boxers'}
          </Button>
        </div>
      </div>

      {open && (
        <ul className="divide-y divide-slate-200 border-t border-slate-200 bg-slate-50/50">
          {regs.map((r) => (
            <li key={r._id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
              <div className="min-w-0">
                <p className="font-medium text-slate-900">{r.boxerId?.fullName || 'Boxer'}</p>
                <p className="text-sm text-slate-500">
                  {r.eventId?.name || 'Event'}
                  {r.category?.weight && ` · ${r.category.weight}`}
                  {r.category?.age && ` · ${r.category.age}`}
                </p>
                {r.promoterFeedback && <p className="mt-1 text-xs text-slate-800">Feedback: {r.promoterFeedback}</p>}
                {r.payment?.status === 'submitted' && r.payment.reference && (
                  <p className="mt-1 text-xs text-blue-600">Payment: {r.payment.amount} · Ref {r.payment.reference}</p>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={r.status} />
                {['pending_approval', 'needs_correction', 'approved'].includes(r.status) && (
                  <>
                    <Button size="sm" onClick={() => onBoxerAction(r, 'approve')}>Approve</Button>
                    <Button size="sm" variant="secondary" onClick={() => onBoxerAction(r, 'needs_correction')}>Fix</Button>
                    <Button size="sm" variant="danger" onClick={() => onBoxerAction(r, 'reject')}>Reject</Button>
                  </>
                )}
                {['pending', 'submitted'].includes(r.payment?.status) && ['pending_approval', 'approved', 'payment_pending'].includes(r.status) && (
                  <>
                    <Button size="sm" onClick={() => onBoxerAction(r, 'payment_confirm')}>Confirm Pay</Button>
                    <Button size="sm" variant="danger" onClick={() => onBoxerAction(r, 'payment_reject')}>Reject Pay</Button>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}

export default function Registrations() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [regs, setRegs] = useState(null)
  const [filter, setFilter] = useState('all')
  const [openClub, setOpenClub] = useState(null)
  const [confirming, setConfirming] = useState(null)
  const [actionReg, setActionReg] = useState(null)
  const [action, setAction] = useState('')
  const [feedback, setFeedback] = useState('')
  const [busy, setBusy] = useState(false)

  const load = () => {
    api('/registrations').then((d) => setRegs(d.registrations)).catch(() => {})
  }
  useEffect(load, [])

  const isPromoter = user?.role === 'promoter'

  const filtered = regs
    ? filter === 'all'
      ? regs
      : regs.filter((r) => r.status === filter)
    : []

  const groups = []
  const seen = new Map()
  for (const r of filtered) {
    const cid = r.clubId?._id || 'unknown'
    let g = seen.get(cid)
    if (!g) {
      g = { club: r.clubId || { name: 'Unknown club' }, regs: [] }
      seen.set(cid, g)
      groups.push(g)
    }
    g.regs.push(r)
  }
  groups.sort((a, b) => (a.club.name || '').localeCompare(b.club.name || ''))

  const runAction = async () => {
    setBusy(true)
    try {
      await api(`/registrations/manage?id=${actionReg._id}`, { method: 'POST', body: { action, feedback } })
      toast('Updated')
      setActionReg(null)
      setFeedback('')
      load()
    } catch (err) {
      toast(err.message, 'error')
    } finally {
      setBusy(false)
    }
  }

  const confirmClub = async (g) => {
    setConfirming(g.club._id)
    try {
      const d = await api('/registrations/bulk', { method: 'POST', body: { clubId: g.club._id, action: 'club_confirm' } })
      toast(`Club confirmed — ${d.confirmed} payment(s) confirmed`)
      load()
    } catch (err) {
      toast(err.message, 'error')
    } finally {
      setConfirming(null)
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Registrations</h1>
          <p className="text-sm text-slate-500">Review clubs, contact them and confirm payments boxer by boxer</p>
        </div>
        <Select value={filter} onChange={(e) => setFilter(e.target.value)} className="w-48">
          {filters.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
        </Select>
      </div>

      {!regs ? (
        <Loading />
      ) : groups.length === 0 ? (
        <Empty title="No registrations" message="No registrations match this filter." />
      ) : (
        <div className="space-y-4">
          {groups.map((g) => (
            <ClubGroup
              key={g.club._id || 'unknown'}
              club={g}
              open={openClub === (g.club._id || 'unknown')}
              onToggle={() => setOpenClub(openClub === (g.club._id || 'unknown') ? null : (g.club._id || 'unknown'))}
              onBoxerAction={(r, a) => { setActionReg(r); setAction(a) }}
              onConfirmClub={confirmClub}
              confirming={confirming}
              isPromoter={isPromoter}
            />
          ))}
        </div>
      )}

      <Modal
        open={!!actionReg}
        onClose={() => setActionReg(null)}
        title="Confirm Action"
        footer={
          <>
            <Button variant="secondary" onClick={() => setActionReg(null)}>Cancel</Button>
            <Button onClick={runAction} disabled={busy} variant={action.includes('reject') ? 'danger' : 'primary'}>Confirm</Button>
          </>
        }
      >
        <p className="text-sm text-slate-600">
          {actionReg?.boxerId?.fullName} — {actionReg?.clubId?.name} — {actionReg?.eventId?.name}
        </p>
        <div className="mt-4">
          <Textarea label="Feedback (optional)" value={feedback} onChange={(e) => setFeedback(e.target.value)} rows={3} />
        </div>
      </Modal>
    </div>
  )
}