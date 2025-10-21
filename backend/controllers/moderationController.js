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

export const deleteModerationLog = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admins only.' })
    }

    const { id } = req.params
    const log = await ModerationLog.findById(id)
    if (!log) return res.status(404).json({ message: 'Moderation log not found' })

    await ModerationLog.deleteOne({ _id: id })
    res.status(200).json({ message: 'Moderation log deleted' })
  } catch (error) {
    console.log('Error in deleteModerationLog:', error.message)
    res.status(500).json({ message: 'Internal server error' })
  }
}

export const deleteAllModerationLogs = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admins only.' })
    }

    // Be careful: this will remove all moderation logs. Admin-only.
    await ModerationLog.deleteMany({})
    res.status(200).json({ message: 'All moderation logs deleted' })
  } catch (error) {
    console.log('Error in deleteAllModerationLogs:', error.message)
    res.status(500).json({ message: 'Internal server error' })
  }
}
