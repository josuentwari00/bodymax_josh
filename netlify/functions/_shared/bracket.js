import Bout from '../models/Bout.js'

export function nextPowerOfTwo(n) {
  let p = 1
  while (p < n) p *= 2
  return p
}

export function roundName(rounds, round) {
  if (round === rounds) return 'Final'
  if (round === rounds - 1) return 'Semi-Final'
  if (round === rounds - 2) return 'Quarter-Final'
  if (round === rounds - 3) return 'Round of 16'
  if (round === 1) return 'Preliminary'
  return `Round ${round}`
}

// Build a full single-elimination bracket from an ordered set of leaf slots.
// leafSlots: array of Registration ids (or null for empty/walkover slots), length must be a power of two.
export async function buildBracket({ eventId, category, leafSlots }) {
  const size = leafSlots.length
  const roundsCount = Math.log2(size)
  let boutNumber = 1

  // Round 1 (leaf pairs)
  const savedR1 = []
  for (let m = 0; m < size / 2; m++) {
    const a = leafSlots[2 * m]
    const b = leafSlots[2 * m + 1]
    const bout = new Bout({
      eventId,
      category,
      round: 1,
      roundName: roundName(roundsCount, 1),
      boutNumber: boutNumber++,
      bracketPosition: m,
      boxerAId: a,
      boxerBId: b,
      status: a && b ? 'scheduled' : 'walkover',
    })
    if (!a || !b) {
      bout.winnerId = a || b || null
      bout.result = { winnerId: bout.winnerId, method: 'Walkover', recordedAt: new Date() }
    }
    savedR1.push(await bout.save())
  }

  // Map round -> position -> bout id for parent linking
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
        category,
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

  return { size, roundsCount }
}