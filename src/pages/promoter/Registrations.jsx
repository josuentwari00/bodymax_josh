import { useEffect, useState } from 'react'
import { api } from '../../utils/api.js'
import { useToast } from '../../context/ToastContext.jsx'
import { Button } from '../../components/Button.jsx'
import { Card, CardBody } from '../../components/Card.jsx'
import { Loading, Empty } from '../../components/Loading.jsx'
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

export default function Registrations() {
  const { toast } = useToast()
  const [regs, setRegs] = useState(null)
  const [filter, setFilter] = useState('all')
  const [actionReg, setActionReg] = useState(null)
  const [action, setAction] = useState('')
  const [feedback, setFeedback] = useState('')
  const [busy, setBusy] = useState(false)

  const load = () => {
    api('/registrations').then((d) => setRegs(d.registrations)).catch(() => {})
  }
  useEffect(load, [])

  const filtered = regs
    ? filter === 'all'
      ? regs
      : regs.filter((r) => r.status === filter)
    : []

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

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Registrations</h1>
          <p className="text-sm text-slate-500">Review and manage all boxer registrations</p>
        </div>
        <Select value={filter} onChange={(e) => setFilter(e.target.value)} className="w-48">
          {filters.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
        </Select>
      </div>

      <Card>
        <CardBody className="p-0">
          {!regs ? (
            <Loading />
          ) : filtered.length === 0 ? (
            <Empty title="No registrations" message="No registrations match this filter." />
          ) : (
            <ul className="divide-y divide-slate-200">
              {filtered.map((r) => (
                <li key={r._id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                  <div>
                    <p className="font-medium text-slate-900">{r.boxerId?.fullName || 'Boxer'}</p>
                    <p className="text-sm text-slate-500">
                      {r.clubId?.name}
                      {r.eventId?.name && ` · ${r.eventId.name}`}
                    </p>
                    {r.promoterFeedback && <p className="mt-1 text-xs text-red-600">Feedback: {r.promoterFeedback}</p>}
                    {r.payment?.status === 'submitted' && r.payment.reference && (
                      <p className="mt-1 text-xs text-blue-600">Payment: {r.payment.amount} · Ref {r.payment.reference}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={r.status} />
                    {['pending_approval', 'needs_correction', 'approved'].includes(r.status) && (
                      <>
                        <Button size="sm" onClick={() => { setActionReg(r); setAction('approve') }}>Approve</Button>
                        <Button size="sm" variant="secondary" onClick={() => { setActionReg(r); setAction('needs_correction') }}>Fix</Button>
                        <Button size="sm" variant="danger" onClick={() => { setActionReg(r); setAction('reject') }}>Reject</Button>
                      </>
                    )}
                    {r.payment?.status === 'submitted' && (
                      <>
                        <Button size="sm" onClick={() => { setActionReg(r); setAction('payment_confirm') }}>Confirm Pay</Button>
                        <Button size="sm" variant="danger" onClick={() => { setActionReg(r); setAction('payment_reject') }}>Reject Pay</Button>
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>

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
