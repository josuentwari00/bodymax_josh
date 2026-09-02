import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '../../utils/api.js'
import { Loading } from '../../components/Loading.jsx'
import { cn } from '../../utils/cn.js'

const STATUS_STYLES = {
  scheduled: 'bg-blue-100 text-blue-800',
  ready: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-amber-100 text-amber-800',
  walkover: 'bg-amber-100 text-amber-800',
  completed: 'bg-emerald-100 text-emerald-800',
  postponed: 'bg-slate-100 text-slate-600',
  cancelled: 'bg-slate-100 text-slate-600',
}

function StatusPill({ status }) {
  const label = {
    scheduled: 'Scheduled',
    ready: 'Ready',
    in_progress: 'In Progress',
    walkover: 'Walkover',
    completed: 'Completed',
    postponed: 'Postponed',
    cancelled: 'Cancelled',
  }
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', STATUS_STYLES[status] || 'bg-slate-100 text-slate-700')}>
      {label[status] || status.replace('_', ' ')}
    </span>
  )
}

function fmtDate(d) {
  if (!d) return ''
  return new Date(d).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
}

function fmtTime(t) {
  if (!t) return ''
  const parts = t.split(':')
  let h = Number(parts[0])
  if (Number.isNaN(h)) return t
  const ampm = h >= 12 ? 'PM' : 'AM'
  h = h % 12 || 12
  return `${h}:${parts[1] || '00'} ${ampm}`
}

function initials(name) {
  return (name || '?').split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()
}

function ScheduleList({ schedule, accentSolid, accentSoft, showResult }) {
  if (!schedule?.length) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
        No bouts scheduled yet.
      </div>
    )
  }
  return (
    <div className="space-y-4">
      {schedule.map((b, i) => {
        const a = b.boxerAId
        const bb = b.boxerBId
        const winnerId = b.winnerId ? String(b.winnerId._id || b.winnerId) : null
        const aWin = winnerId && a && String(a._id) === winnerId
        const bWin = winnerId && bb && String(bb._id) === winnerId
        return (
          <div key={b._id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-3">
              <div className="flex items-center gap-3">
                <span className={cn('flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold text-white', accentSolid)}>
                  {i + 1}
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-900">Bout #{b.boutNumber}</p>
                  <p className="text-xs text-slate-500">
                    {b.category?.weight || 'All weights'}
                    {b.category?.age ? ` · ${b.category.age}` : ''}
                    {b.category?.gender ? ` · ${b.category.gender}` : ''}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                {b.ring && <span className="rounded-md bg-slate-100 px-2 py-1 font-medium">{b.ring}</span>}
                {b.scheduledDate && <span>{fmtDate(b.scheduledDate)}</span>}
                {b.scheduledTime && <span>{fmtTime(b.scheduledTime)}</span>}
                <StatusPill status={b.status} />
              </div>
            </div>
            <div className="flex flex-col items-stretch gap-3 px-5 py-4 sm:flex-row sm:items-center">
              <span className={cn('flex min-w-0 flex-1 items-center gap-3 rounded-xl border px-3 py-2', aWin ? cn(accentSoft, 'border-transparent') : 'border-slate-100')}>
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">
                  {initials(a?.boxerId?.fullName)}
                </span>
                <span className="flex min-w-0 flex-1 flex-wrap items-center justify-between gap-1">
                  <span className={cn('truncate text-base font-semibold', aWin ? 'text-slate-900' : 'text-slate-900')}>
                    {a?.boxerId?.fullName || <span className="italic text-slate-400">Bye</span>}
                  </span>
                  <span className="text-sm text-slate-500">{a?.clubId?.name || 'Guest'}</span>
                </span>
                {aWin && <span className="text-xs font-bold uppercase tracking-wide text-emerald-600">Winner</span>}
              </span>
              <span className="self-center text-xs font-bold uppercase tracking-widest text-slate-300">vs</span>
              <span className={cn('flex min-w-0 flex-1 items-center gap-3 rounded-xl border px-3 py-2', bWin ? cn(accentSoft, 'border-transparent') : 'border-slate-100')}>
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">
                  {initials(b?.boxerId?.fullName)}
                </span>
                <span className="flex min-w-0 flex-1 flex-wrap items-center justify-between gap-1">
                  <span className="truncate text-base font-semibold text-slate-900">
                    {b?.boxerId?.fullName || <span className="italic text-slate-400">Bye</span>}
                  </span>
                  <span className="text-sm text-slate-500">{b?.clubId?.name || 'Guest'}</span>
                </span>
                {bWin && <span className="text-xs font-bold uppercase tracking-wide text-emerald-600">Winner</span>}
              </span>
            </div>
            {showResult && b.status === 'completed' && b.winnerId && (
              <div className={cn('mx-5 mb-4 rounded-xl px-4 py-2.5 text-sm font-medium', accentSoft)}>
                Result: <span className="font-bold">{b.winnerId?.boxerId?.fullName}</span> wins by{' '}
                <span className="font-semibold">{b.result?.method || 'Decision'}</span>
                {b.result?.round ? ` in round ${b.result.round}` : ''}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function BoxerCard({ boxer, accentSolid }) {
  const rec = boxer.boxingRecord || {}
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className={cn('h-1.5', accentSolid)} />
      <div className="flex items-center gap-3 px-5 pt-4">
        {boxer.photoUrl ? (
          <img src={boxer.photoUrl} alt={boxer.fullName} className="h-14 w-14 rounded-full object-cover" />
        ) : (
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-slate-900 text-lg font-bold text-white">
            {initials(boxer.fullName)}
          </span>
        )}
        <div className="min-w-0">
          <p className="truncate text-base font-bold text-slate-900">{boxer.fullName}</p>
          <p className="truncate text-sm text-slate-500">{boxer.clubName || 'Guest boxer'}</p>
        </div>
      </div>
      <div className="px-5 py-4">
        <div className="flex flex-wrap gap-1.5">
          {(boxer.weightCategory || boxer.registeredWeightKg) && (
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
              {boxer.weightCategory || `${boxer.registeredWeightKg}kg`}
            </span>
          )}
          {boxer.ageCategory && <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">{boxer.ageCategory}</span>}
          {boxer.gender && <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">{boxer.gender === 'M' ? 'Male' : 'Female'}</span>}
          {boxer.nationality && <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">{boxer.nationality}</span>}
        </div>
        <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
          <div className="text-center">
            <p className="text-xl font-bold text-emerald-600">{rec.wins ?? 0}</p>
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Wins</p>
          </div>
          <div className="h-8 w-px bg-slate-200" />
          <div className="text-center">
            <p className="text-xl font-bold text-rose-600">{rec.losses ?? 0}</p>
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Losses</p>
          </div>
          <div className="h-8 w-px bg-slate-200" />
          <div className="text-center">
            <p className="text-xl font-bold text-slate-700">{rec.draws ?? 0}</p>
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Draws</p>
          </div>
        </div>
        {boxer.experience && <p className="mt-3 truncate text-xs text-slate-500">{boxer.experience}</p>}
      </div>
    </div>
  )
}

function SectionTitle({ children, sub, accentSolid }) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <span className={cn('h-8 w-1.5 rounded-full', accentSolid)} />
      <div>
        <h2 className="text-lg font-bold text-slate-900">{children}</h2>
        {sub && <p className="text-sm text-slate-500">{sub}</p>}
      </div>
    </div>
  )
}

const ROLES = {
  commentator: {
    name: 'Commentator Portal',
    tagline: 'Fight card and full boxer profiles for live commentary.',
    gradient: 'from-brand-700 via-brand-800 to-slate-900',
    accentSolid: 'bg-brand-600',
    accentSoft: 'bg-brand-50',
  },
  mc: {
    name: 'Official MC Portal',
    tagline: "Tonight's fight card, ready for the master of ceremonies.",
    gradient: 'from-violet-700 via-violet-800 to-slate-900',
    accentSolid: 'bg-violet-600',
    accentSoft: 'bg-violet-50',
  },
  official: {
    name: 'Official Officials Portal',
    tagline: 'Fight schedule and recorded results for officials.',
    gradient: 'from-slate-700 via-slate-800 to-slate-900',
    accentSolid: 'bg-amber-500',
    accentSoft: 'bg-amber-50',
  },
  judge: {
    name: 'Judges Portal',
    tagline: 'Fight schedule and recorded results for the judging panel.',
    gradient: 'from-emerald-700 via-emerald-800 to-slate-900',
    accentSolid: 'bg-emerald-600',
    accentSoft: 'bg-emerald-50',
  },
}

function PortalShell({ data }) {
  const cfg = ROLES[data.role] || ROLES.official
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <Link to="/" className="text-sm font-bold tracking-tight text-slate-900">
            bodymax<span className="text-brand-600">events</span>
          </Link>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Read-only access
          </span>
        </div>
      </header>

      <div className={cn('bg-gradient-to-br text-white', cfg.gradient)}>
        <div className="mx-auto max-w-4xl px-4 py-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-white/60">{cfg.name}</p>
          <h1 className="mt-1 text-2xl font-extrabold sm:text-3xl">{data.event.name}</h1>
          <p className="mt-1 text-sm text-white/80">{cfg.tagline}</p>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-white/70">
            {data.event.venue && <span>Venue: {data.event.venue}{data.event.location ? `, ${data.event.location}` : ''}</span>}
            {data.event.eventDate && <span>Date: {fmtDate(data.event.eventDate)}</span>}
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-4xl px-4 py-8">
        {data.role === 'mc' && (
          <section>
            <SectionTitle accentSolid={cfg.accentSolid}>Fight Card</SectionTitle>
            <ScheduleList schedule={data.schedule} accentSolid={cfg.accentSolid} accentSoft={cfg.accentSoft} />
          </section>
        )}

        {data.role === 'commentator' && (
          <div className="space-y-12">
            <section>
              <SectionTitle accentSolid={cfg.accentSolid}>Fight Card</SectionTitle>
              <ScheduleList schedule={data.schedule} accentSolid={cfg.accentSolid} accentSoft={cfg.accentSoft} showResult />
            </section>
            <section>
              <SectionTitle accentSolid={cfg.accentSolid} sub={`${data.boxers?.length || 0} boxers competing tonight`}>
                Boxer Profiles
              </SectionTitle>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {(data.boxers || []).map((boxer) => (
                  <BoxerCard key={boxer._id} boxer={boxer} accentSolid={cfg.accentSolid} />
                ))}
              </div>
            </section>
          </div>
        )}

        {(data.role === 'official' || data.role === 'judge') && (
          <div className="space-y-12">
            <section>
              <SectionTitle accentSolid={cfg.accentSolid}>Fight Schedule</SectionTitle>
              <ScheduleList schedule={data.schedule} accentSolid={cfg.accentSolid} accentSoft={cfg.accentSoft} showResult />
            </section>
            <section>
              <SectionTitle accentSolid={cfg.accentSolid} sub="Officially recorded results">
                Results
              </SectionTitle>
              {!data.results?.length ? (
                <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
                  No results recorded yet.
                </div>
              ) : (
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <ul className="divide-y divide-slate-100">
                    {data.results.map((b, i) => (
                      <li key={b._id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                        <div className="flex items-center gap-3">
                          <span className={cn('flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold text-white', cfg.accentSolid)}>{i + 1}</span>
                          <div>
                            <p className="font-semibold text-slate-900">
                              {b.winnerId?.boxerId?.fullName}{' '}
                              <span className="font-normal text-slate-400">beat</span> {b.boxerAId?.boxerId?.fullName === b.winnerId?.boxerId?.fullName ? b.boxerBId?.boxerId?.fullName : b.boxerAId?.boxerId?.fullName}
                            </p>
                            <p className="text-sm text-slate-500">
                              Bout #{b.boutNumber}
                              {b.result?.method ? ` · ${b.result.method}` : ''}
                              {b.result?.round ? ` · Round ${b.result.round}` : ''}
                            </p>
                          </div>
                        </div>
                        <StatusPill status={b.status} />
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          </div>
        )}
      </main>

      <footer className="border-t border-slate-200 bg-white py-6">
        <div className="mx-auto max-w-4xl px-4 text-center text-sm text-slate-400">
          Powered by <span className="font-semibold text-slate-600">bodymax events</span> · This portal is read-only and shared by the promoter.
        </div>
      </footer>
    </div>
  )
}

export default function RolePortal() {
  const { token } = useParams()
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    api(`/portal?token=${encodeURIComponent(token)}`)
      .then((d) => {
        if (!cancelled) setData(d)
      })
      .catch((err) => {
        if (!cancelled) setError(err.message)
      })
    return () => {
      cancelled = true
    }
  }, [token])

  if (data) return <PortalShell data={data} />

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-100 text-3xl font-bold text-rose-600">!</div>
        <h1 className="mt-4 text-xl font-bold text-slate-900">Portal unavailable</h1>
        <p className="mt-1 max-w-sm text-sm text-slate-600">{error}</p>
        <p className="mt-2 text-sm text-slate-500">Ask the promoter for a fresh link.</p>
        <Link to="/" className="mt-6 text-sm font-semibold text-brand-600 hover:underline">← Back to bodymax events</Link>
      </div>
    )
  }

  return <Loading />
}