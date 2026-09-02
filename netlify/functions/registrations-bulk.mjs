import { connectDB } from './_shared/db.js'
import Registration from './_shared/models/Registration.js'
import { requireRole, success, errorResponse } from './_shared/middleware/auth.js'
import { normalizeRequest } from './_shared/request.js'

export default async (event) => {
  event = await normalizeRequest(event)
  try {
    await requireRole('promoter')(event)

    if (event.httpMethod === 'OPTIONS') return success({})
    if (event.httpMethod !== 'POST') return errorResponse({ message: 'Method not allowed', status: 405 })

    const body = JSON.parse(event.body || '{}')
    const { clubId, eventId, action } = body
    if (!clubId) return errorResponse({ message: 'clubId required', status: 400 })

    if (action !== 'club_confirm') {
      return errorResponse({ message: 'Unknown action', status: 400 })
    }

    await connectDB()
    const query = { clubId, 'payment.status': { $in: ['pending', 'submitted'] } }
    if (eventId) query.eventId = eventId

    const regs = await Registration.find(query)
    const now = new Date()
    for (const reg of regs) {
      reg.payment.status = 'confirmed'
      reg.payment.confirmedAt = now
      reg.payment.feedback = ''
      if (['pending_approval', 'approved', 'payment_pending'].includes(reg.status)) {
        reg.status = 'payment_confirmed'
      }
      await reg.save()
    }
    return success({ confirmed: regs.length })
  } catch (err) {
    return errorResponse(err)
  }
}