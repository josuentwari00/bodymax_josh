import { connectDB } from './_shared/db.js'
import Event from './_shared/models/Event.js'
import Registration from './_shared/models/Registration.js'
import Bout from './_shared/models/Bout.js'
import { nextPowerOfTwo, buildBracket } from './_shared/bracket.js'
import { requireRole, success, errorResponse } from './_shared/middleware/auth.js'
import { normalizeRequest } from './_shared/request.js'

export default async (event) => {
  event = await normalizeRequest(event)
  try {
    await requireRole('promoter')(event)

    if (event.httpMethod === 'OPTIONS') return success({})
    if (event.httpMethod !== 'POST') {
      return errorResponse({ message: 'Method not allowed', status: 405 })
    }

    const params = event.queryStringParameters || {}
    const { eventId } = params
    if (!eventId) return errorResponse({ message: 'eventId required', status: 400 })

    const body = JSON.parse(event.body || '{}')
    const { weight = '', age = '', gender = '' } = body

    await connectDB()

    const ev = await Event.findById(eventId)
    if (!ev) return errorResponse({ message: 'Event not found', status: 404 })

    const query = {
      eventId,
      status: { $in: ['eligible', 'payment_confirmed', 'weighed'] },
    }
    if (weight) query['category.weight'] = weight
    if (age) query['category.age'] = age
    if (gender) query['category.gender'] = gender

    const eligible = await Registration.find(query).populate('clubId').lean()
    if (eligible.length < 2) {
      return errorResponse({ message: 'At least 2 eligible boxers are needed to create a draw', status: 400 })
    }

    // Allow re-generation: remove existing drawn bouts for this event/category
    await Bout.deleteMany({
      eventId,
      'category.weight': weight,
      'category.age': age,
      'category.gender': gender,
    })

    const N = eligible.length
    const size = nextPowerOfTwo(N)

    // Shuffle participants for a random draw
    let participants = [...eligible]
    for (let i = participants.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[participants[i], participants[j]] = [participants[j], participants[i]]
    }

    // Assign participants to leaf slots, spreading byes evenly
    const leafSlots = new Array(size).fill(null)
    const byes = size - participants.length
    if (byes > 0) {
      const step = size / byes
      const byeSet = new Set()
      for (let i = 0; i < byes; i++) {
        byeSet.add(Math.min(size - 1, Math.floor(i * step)))
      }
      let pi = 0
      for (let s = 0; s < size; s++) {
        if (!byeSet.has(s)) leafSlots[s] = participants[pi++]._id
      }
    } else {
      for (let i = 0; i < participants.length; i++) leafSlots[i] = participants[i]._id
    }

    await buildBracket({ eventId, category: { weight, age, gender }, leafSlots })

    const allBouts = await Bout.find({
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
      .populate('winnerId')
      .lean()

    return success({ message: 'Draw generated', bouts: allBouts, participants: eligible.length, size })
  } catch (err) {
    return errorResponse(err)
  }
}