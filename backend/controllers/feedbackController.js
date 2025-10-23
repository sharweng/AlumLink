import Feedback from '../models/Feedback.js'

export const createFeedback = async (req, res) => {
  try {
    const { message, metadata } = req.body

    if (!message || !message.trim()) {
      return res.status(400).json({ message: 'Message is required' })
    }

    const feedback = new Feedback({
      message: message.trim(),
      user: req.user ? req.user._id : undefined,
      metadata: metadata || {}
    })

    await feedback.save()

    res.status(201).json(feedback)
  } catch (err) {
    console.error('Error creating feedback:', err.message)
    res.status(500).json({ message: 'Internal server error' })
  }
}

export const listFeedbacks = async (req, res) => {
  try {
    const feedbacks = await Feedback.find().populate('user', 'name username email').sort({ createdAt: -1 })
    res.status(200).json(feedbacks)
  } catch (err) {
    console.error('Error listing feedbacks:', err.message)
    res.status(500).json({ message: 'Internal server error' })
  }
}

export const markFeedbackSeen = async (req, res) => {
  try {
    const { id } = req.params
    const feedback = await Feedback.findByIdAndUpdate(id, { seen: true }, { new: true })
    if (!feedback) {
      return res.status(404).json({ message: 'Feedback not found' })
    }
    res.status(200).json(feedback)
  } catch (err) {
    console.error('Error marking feedback seen:', err.message)
    res.status(500).json({ message: 'Internal server error' })
  }
}


export const markAllFeedbacksSeen = async (req, res) => {
  try {
    await Feedback.updateMany({ seen: false }, { seen: true })
    res.status(200).json({ message: 'All feedbacks marked as seen' })
  } catch (err) {
    console.error('Error marking all feedbacks seen:', err.message)
    res.status(500).json({ message: 'Internal server error' })
  }
}

export const deleteFeedback = async (req, res) => {
  try {
    const { id } = req.params
    const feedback = await Feedback.findByIdAndDelete(id)
    if (!feedback) {
      return res.status(404).json({ message: 'Feedback not found' })
    }
    res.status(200).json({ message: 'Feedback deleted' })
  } catch (err) {
    console.error('Error deleting feedback:', err.message)
    res.status(500).json({ message: 'Internal server error' })
  }
}
