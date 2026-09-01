import { connectDB } from '../_shared/db.js'
import Club from '../_shared/models/Club.js'
import Boxer from '../_shared/models/Boxer.js'
import { requireAuth, requireRole, success, errorResponse } from '../_shared/middleware/auth.js'

export default async (event) => {
  try {
    await connectDB()
    const user = await requireAuth(event)

    const { clubId: requested, populate } = event.queryStringParameters || {}

    if (user.role === 'club') {
      if (requested && requested !== String(user.clubId)) {
        return errorResponse({ message: 'Forbidden', status: 403 })
      }
      const club = await Club.findById(user.clubId).lean()
      if (!club) {
        return errorResponse({ message: 'Club not found', status: 404 })
      }
      const boxers = await Boxer.find({ clubId: club._id }).lean()
      return success({ club, boxers })
    }

    if (user.role === 'promoter') {
      const query = requested ? { _id: requested } : {}
      const clubs = requested ? [await Club.findById(requested).lean()] : await Club.find().lean()

      const withBoxers = populate === 'true'
      let result = clubs
      if (withBoxers && requested) {
        const boxers = await Boxer.find({ clubId: requested }).lean()
        return success({ club: clubs[0], boxers })
      }
      for (const c of result) {
        c.boxerCount = await Boxer.countDocuments({ clubId: c._id })
      }
      return success(requested ? { club: result[0] } : { clubs: result })
    }

    return errorResponse({ message: 'Forbidden', status: 403 })
  } catch (err) {
    return errorResponse(err)
  }
}
