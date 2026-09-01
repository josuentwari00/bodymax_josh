import mongoose from 'mongoose'
import { connectDB } from './_shared/db.js'
import Event from './_shared/models/Event.js'
import Registration from './_shared/models/Registration.js'
import Bout from './_shared/models/Bout.js'
import { requireRole, success, errorResponse } from './_shared/middleware/auth.js'
import { normalizeRequest } from './_shared/request.js'

function nextPowerOfTwo(n) {
  let p = 1
  while (p < n) p *= 2
  return p
}

function roundName(rounds, round) {
  if (round === rounds) return 'Final'
  if (round === rounds - 1) return 'Semi-Final'
  if (round === rounds - 2) return 'Quarter-Final'
  if (round === rounds - 3) return 'Round of 16'
  if (round === 1) return 'Preliminary'
  return `Round ${round}`
}

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
    const { seedByClub = true, weight = '', age = '', gender = '' } = body

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
    const roundsCount = Math.log2(size)

    // Shuffle participants
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

    let boutNumber = 1

    // Round 1 (leaf pairs)
    const savedR1 = []
    for (let m = 0; m < size / 2; m++) {
      const a = leafSlots[2 * m]
      const b = leafSlots[2 * m + 1]
      const bout = new Bout({
        eventId,
        category: { weight, age, gender },
        round: 1,
        roundName: roundName(roundsCount, 1),
        boutNumber: boutNumber++,
        bracketPosition: m,
        boxerAId: a,
        boxerBId: b,
        status: a && b ? 'scheduled' : 'walkover',
      })
      if (!a || !b) {
        bout.winnerId = a || b
        bout.result = { winnerId: a || b, method: 'Walkover', recordedAt: new Date() }
      }
      savedR1.push(await bout.save())
    }

    // Map round -> slot -> bout id for parent linking
    const roundById = {}
    roundById[1] = {}
    savedR1.forEach((b, i) => { roundById[1][i] = b._id })

    // Rounds 2..roundsCount
    for (let r = 1; r < roundsCount; r++) {
      const matchCount = size / Math.pow(2, r + 1)
      const prev = roundById[r]
      const cur = {}
      for (let m = 0; m < matchCount; m++) {
        const parentA = prev[2 * m]
        const parentB = prev[2 * m + 1]
        const bout = new Bout({
          eventId,
          category: { weight, age, gender },
          round: r + 1,
          roundName: roundName(roundsCount, r + 1),
          boutNumber: boutNumber++,
          bracketPosition: m,
          status: 'ready',
        })
        const saved = await bout.save()
        cur[m] = saved._id
        await Promise.all([
          Bout.updateOne({ _id: parentA }, { $set: { parentBoutId: saved._id, feedSide: 'A' } }),
          Bout.updateOne({ _id: parentB }, { $set: { parentBoutId: saved._id, feedSide: 'B' } }),
        ])
      }
      roundById[r + 1] = cur
    }

    // Advance walkover winners from round 1 into round 2
    const round2 = roundById[2] || {}
    for (let i = 0; i < savedR1.length; i++) {
      const bout = savedR1[i]
      if (bout.status === 'walkover' && bout.winnerId && round2[Math.floor(i / 2)]) {
        const side = i % 2 === 0 ? 'A' : 'B'
        const r2boutId = round2[Math.floor(i / 2)]
        const set = side === 'A' ? { boxerAId: bout.winnerId } : { boxerBId: bout.winnerId }
        await Bout.updateOne({ _id: r2boutId }, { $set: set })
      }
    }

    const allBouts = await Bout.find({
      eventId,
      'category.weight': weight,
      'category.age': age,
      'category.gender': gender,
    })
      .sort({ round: 1, bracketPosition: 1 })
      .populate('boxerAId')
      .populate('boxerBId')
      .populate('winnerId')
      .lean()

    return success({ message: 'Draw generated', bouts: allBouts, participants: eligible.length, size })
  } catch (err) {
    return errorResponse(err)
  }
}
