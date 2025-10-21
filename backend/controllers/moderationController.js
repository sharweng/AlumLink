import ModerationLog from "../models/ModerationLog.js";

export const getModerationLogs = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admins only.' })
    }

    const logs = await ModerationLog.find().populate('performedBy', 'name username').sort({ performedAt: -1 }).limit(1000)
    res.status(200).json(logs)
  } catch (error) {
    console.log('Error in getModerationLogs:', error.message)
    res.status(500).json({ message: 'Internal server error' })
  }
}
