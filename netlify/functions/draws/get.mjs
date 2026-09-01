import { connectDB } from '../_shared/db.js'
import Event from '../_shared/models/Event.js'
import Registration from '../_shared/models/Registration.js'
import Bout from '../_shared/models/Bout.js'
import { requireAuth, success, errorResponse } from '../_shared/middleware/auth.js'

export default async (event) => {
  try {
    const user = await requireAuth(event)

    const params = event.queryStringParameters || {}
    const { eventId, weight = '', age = '', gender = '' } = params
    if (!eventId) return errorResponse({ message: 'eventId required', status: 400 })

    await connectDB()

    const bouts = await Bout.find({
      eventId,
      'category.weight': weight,
      'category.age': age,
      'category.gender': gender,
    })
      .sort({ round: 1, bracketPosition: 1 })
      .populate({
        path: 'boxerAId',
        populate: { path: 'boxerId clubId' },
      })
      .populate({
        path: 'boxerBId',
        populate: { path: 'boxerId clubId' },
      })
      .populate({
        path: 'winnerId',
        populate: { path: 'boxerId' },
      })
      .lean()

    // Group by round
    const byRound = {}
    for (const b of bouts) {
      if (!byRound[b.round]) byRound[b.round] = []
      byRound[b.round].push(b)
    }

    return success({ bouts, byRound })
  } catch (err) {
    return errorResponse(err)
  }
}
