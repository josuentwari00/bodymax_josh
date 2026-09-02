import { connectDB } from './_shared/db.js'
import Event from './_shared/models/Event.js'
import Club from './_shared/models/Club.js'
import Boxer from './_shared/models/Boxer.js'
import Registration from './_shared/models/Registration.js'
import Bout from './_shared/models/Bout.js'
import { nextPowerOfTwo, buildBracket } from './_shared/bracket.js'
import { requireRole, success, errorResponse } from './_shared/middleware/auth.js'
import { normalizeRequest } from './_shared/request.js'

const ELIGIBLE = { $in: ['eligible', 'payment_confirmed', 'weighed'] }

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
    const { weight = '', age = '', gender = '', bouts } = body
    if (!Array.isArray(bouts) || bouts.length === 0) {
      return errorResponse({ message: 'Provide at least one pairing (bouts)', status: 400 })
    }

    await connectDB()

    const ev = await Event.findById(eventId)
    if (!ev) return errorResponse({ message: 'Event not found', status: 404 })

    const category = { weight, age, gender }

    const usedIds = bouts.flatMap((p) => [p.boxerAId, p.boxerBId]).filter(Boolean)
    if (usedIds.length === 0) {
      return errorResponse({ message: 'Select at least one boxer in the pairings', status: 400 })
    }

    const catFilter = {}
    if (weight) catFilter['category.weight'] = weight
    if (age) catFilter['category.age'] = age
    if (gender) catFilter['category.gender'] = gender

    const valid = await Registration.find({
      _id: { $in: usedIds },
      eventId,
      status: ELIGIBLE,
      ...catFilter,
    }).lean()

    const validSet = new Set(valid.map((r) => String(r._id)))
    for (const pid of usedIds) {
      if (!validSet.has(String(pid))) {
        return errorResponse({ message: 'One of the selected boxers is not eligible for this category', status: 400 })
      }
    }

    // Remove existing drawn bouts for this event/category (allow re-making the draw)
    await Bout.deleteMany({
      eventId,
      'category.weight': weight,
      'category.age': age,
      'category.gender': gender,
    })

    const leafList = []
    for (const p of bouts) {
      leafList.push(p.boxerAId || null)
      leafList.push(p.boxerBId || null)
    }
    const size = nextPowerOfTwo(leafList.length)
    while (leafList.length < size) leafList.push(null)

    await buildBracket({ eventId, category, leafSlots: leafList })

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

    return success({ message: 'Manual draw created', bouts: allBouts, size })
  } catch (err) {
    return errorResponse(err)
  }
}