import { cn } from '../utils/cn'

const tones = {
  green: 'bg-green-100 text-green-800',
  red: 'bg-red-100 text-red-800',
  yellow: 'bg-yellow-100 text-yellow-800',
  blue: 'bg-blue-100 text-blue-800',
  slate: 'bg-slate-100 text-slate-700',
  purple: 'bg-purple-100 text-purple-800',
}

export function Badge({ children, tone = 'slate', className }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        tones[tone] || tones.slate,
        className
      )}
    >
      {children}
    </span>
  )
}

export function StatusBadge({ status }) {
  const map = {
    // Registration statuses
    registered: { label: 'Registered', tone: 'blue' },
    pending_approval: { label: 'Pending Approval', tone: 'yellow' },
    needs_correction: { label: 'Needs Correction', tone: 'red' },
    approved: { label: 'Approved', tone: 'green' },
    payment_pending: { label: 'Payment Pending', tone: 'yellow' },
    payment_confirmed: { label: 'Payment Confirmed', tone: 'green' },
    awaiting_weighin: { label: 'Awaiting Weigh-In', tone: 'blue' },
    weighed: { label: 'Weighed', tone: 'blue' },
    eligible: { label: 'Eligible', tone: 'green' },
    not_eligible: { label: 'Not Eligible', tone: 'red' },
    withdrawn: { label: 'Withdrawn', tone: 'slate' },
    eliminated: { label: 'Eliminated', tone: 'red' },
    completed: { label: 'Completed', tone: 'purple' },
    // Payment statuses
    not_required: { label: 'Not Required', tone: 'slate' },
    pending: { label: 'Pending', tone: 'yellow' },
    submitted: { label: 'Submitted', tone: 'blue' },
    confirmed: { label: 'Confirmed', tone: 'green' },
    rejected: { label: 'Rejected', tone: 'red' },
    // Event statuses
    draft: { label: 'Draft', tone: 'slate' },
    open: { label: 'Open', tone: 'green' },
    closed: { label: 'Closed', tone: 'red' },
    in_progress: { label: 'In Progress', tone: 'blue' },
    completed_event: { label: 'Completed', tone: 'purple' },
    archived: { label: 'Archived', tone: 'slate' },
    // Weigh-in statuses
    not_weighed: { label: 'Not Weighed', tone: 'yellow' },
    successful: { label: 'Successful', tone: 'green' },
    outside_category: { label: 'Outside Category', tone: 'red' },
    requires_review: { label: 'Requires Review', tone: 'yellow' },
  }
  const config = map[status] || { label: status, tone: 'slate' }
  return <Badge tone={config.tone}>{config.label}</Badge>
}
