import Report from '../models/Report.js'
import Feedback from '../models/Feedback.js'
import User from '../models/User.js'

export const createReport = async (req, res) => {
  try {
    const { type, target, details } = req.body

    if (!type || !target) {
      return res.status(400).json({ message: 'type and target are required' })
    }

    const report = new Report({
      type,
      target,
      details: details || '',
      reporter: req.user ? req.user._id : undefined,
    })

    await report.save()

    res.status(201).json(report)
  } catch (err) {
    console.error('Error creating report:', err.message)
    res.status(500).json({ message: 'Internal server error' })
  }
}

export const listReports = async (req, res) => {
  try {
    const reports = await Report.find().populate('reporter', 'name username email').sort({ createdAt: -1 })
    res.status(200).json(reports)
  } catch (err) {
    console.error('Error listing reports:', err.message)
    res.status(500).json({ message: 'Internal server error' })
  }
}

export const markReportSeen = async (req, res) => {
  try {
    const { id } = req.params
    const report = await Report.findByIdAndUpdate(id, { seen: true }, { new: true })
    if (!report) {
      return res.status(404).json({ message: 'Report not found' })
    }
    res.status(200).json(report)
  } catch (err) {
    console.error('Error marking report seen:', err.message)
    res.status(500).json({ message: 'Internal server error' })
  }
}

export const markAllReportsSeen = async (req, res) => {
  try {
    await Report.updateMany({ seen: false }, { seen: true })
    res.status(200).json({ message: 'All reports marked as seen' })
  } catch (err) {
    console.error('Error marking all reports seen:', err.message)
    res.status(500).json({ message: 'Internal server error' })
  }
}
