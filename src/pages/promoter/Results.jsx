import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../../utils/api.js'
import { useToast } from '../../context/ToastContext.jsx'
import { Button } from '../../components/Button.jsx'
import { Card, CardHeader, CardBody } from '../../components/Card.jsx'
import { Loading, Empty, Spinner } from '../../components/Loading.jsx'
import { Badge } from '../../components/Badge.jsx'
import { Modal } from '../../components/Modal.jsx'
import { Select, Input, Textarea } from '../../components/Field.jsx'

const methods = ['Decision', 'KO', 'TKO', 'RSC', 'Disqualification', 'Walkover', 'Other']

export default function Results() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()

  const [event, setEvent] = useState(null)
  const [bouts, setBouts] = useState(null)
  const [recordBout, setRecordBout] = useState(null)
  const [form, setForm] = useState({ winnerId: '', method: 'Decision', round: '', notes: '' })
  const [busy, setBusy] = useState(false)

  const load = () => {
    api(`/events?id=${id}`).then((d) => setEvent(d.event)).catch(() => {})
    api(`/bouts?eventId=${id}`).then((d) => setBouts(d.bouts)).catch(() => setBouts([]))
  }
  useEffect(load, [id])

  const openRecord = (b) => {
    setRecordBout(b)
    setForm({ winnerId: '', method: 'Decision', round: '', notes: '' })
  }

  const submit = async () => {
    if (!form.winnerId) return
    setBusy(true)
    try {
      await api(`/results/record?id=${recordBout._id}`, {
        method: 'POST',
        body: { ...form, round: form.round ? Number(form.round) : null },
      })
      toast('Result recorded — winner advanced')
      setRecordBout(null)
      load()
    } catch (err) {
      toast(err.message, 'error')
    } finally {
      setBusy(false)
    }
  }

  if (!event) return <Loading />

  const ordered = bouts
    ? [...bouts].sort((a, b) => (a.round - b.round) || (a.boutNumber - b.boutNumber))
    : []

  return (
    <div>
      <div className="mb-6">
        <button onClick={() => navigate(`/app/events/${id}`)} className="mb-1 text-sm text-brand-600 hover:underline">← Back to Event</button>
        <h1 className="text-2xl font-bold text-slate-900">Bouts & Results</h1>
        <p className="text-sm text-slate-500">{event.name}</p>
      </div>

      {!bouts ? (
        <Loading />
      ) : ordered.length === 0 ? (
        <Card>
          <Empty title="No bouts yet" message="Generate a draw first to create fights and a bracket." action={<Button onClick={() => navigate(`/app/events/${id}/draws`)}>Go to Draws</Button>} />
        </Card>
      ) : (
        <div className="space-y-6">
          {[1, 2, 3, 4, 5].filter((r) => ordered.some((b) => b.round === r)).map((r) => (
            <Card key={r}>
              <CardHeader title={`Round ${r}`} subtitle={ordered.find((b) => b.round === r)?.roundName || ''} />
              <CardBody className="p-0">
                <ul className="divide-y divide-slate-200">
                  {ordered.filter((b) => b.round === r).map((b) => (
                    <li key={b._id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-slate-400">#{b.boutNumber}</span>
                          <span className="font-medium">{b.boxerAId?.boxerId?.fullName || 'TBD'}</span>
                          <span className="text-slate-400">vs</span>
                          <span className="font-medium">{b.boxerBId?.boxerId?.fullName || 'TBD'}</span>
                        </div>
                        <div className="mt-1 flex items-center gap-2 text-sm text-slate-500">
                          {b.ring && <span>Ring: {b.ring}</span>}
                          {b.scheduledTime && <span>· {b.scheduledTime}</span>}
                          {b.scheduledDate && <span>· {new Date(b.scheduledDate).toLocaleDateString()}</span>}
                        </div>
                        {b.status === 'completed' && (
                          <p className="mt-1 text-sm text-green-700">
                            Winner: {b.result?.method === 'Walkover' ? 'Walkover' : b.winnerId?.boxerId?.fullName} — {b.result?.method}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge tone={b.status === 'completed' ? 'green' : 'blue'}>{b.status}</Badge>
                        {b.boxerAId && b.boxerBId && b.status !== 'completed' && (
                          <Button size="sm" onClick={() => openRecord(b)}>Record Result</Button>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={!!recordBout}
        onClose={() => setRecordBout(null)}
        title={`Record Result — Bout #${recordBout?.boutNumber || ''}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setRecordBout(null)}>Cancel</Button>
            <Button onClick={submit} disabled={busy || !form.winnerId}>
              {busy ? <Spinner className="h-4 w-4 border-white" /> : 'Confirm Result'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Select label="Winner" value={form.winnerId} onChange={(e) => setForm({ ...form, winnerId: e.target.value })}>
            <option value="">Select winner</option>
            {recordBout?.boxerAId && (
              <option value={recordBout.boxerAId._id}>{recordBout.boxerAId.boxerId?.fullName}</option>
            )}
            {recordBout?.boxerBId && (
              <option value={recordBout.boxerBId._id}>{recordBout.boxerBId.boxerId?.fullName}</option>
            )}
          </Select>
          <Select label="Method of Victory" value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })}>
            {methods.map((m) => <option key={m} value={m}>{m}</option>)}
          </Select>
          <Input label="Round Finished" type="number" value={form.round} onChange={(e) => setForm({ ...form, round: e.target.value })} placeholder="Optional" />
          <Textarea label="Notes (optional)" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} />
        </div>
      </Modal>
    </div>
  )
}
