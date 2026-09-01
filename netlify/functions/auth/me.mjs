import { connectDB } from '../../shared/db.js'
import User from '../../shared/models/User.js'
import { requireAuth, success, errorResponse } from '../../shared/middleware/auth.js'

export default async (event) => {
  try {
    const user = await requireAuth(event)
    await connectDB()
    const fresh = await User.findById(user._id).lean()
    return success({
      user: {
        id: fresh._id,
        name: fresh.name,
        email: fresh.email,
        role: fresh.role,
        clubId: fresh.clubId,
        officialRole: fresh.officialRole,
      },
    })
  } catch (err) {
    return errorResponse(err)
  }
}
