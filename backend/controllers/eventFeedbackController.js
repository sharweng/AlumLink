import Event from '../models/Event.js'
import EventFeedback from '../models/EventFeedback.js'
import profanityFilter from '../lib/profanityFilter.js'

export const createEventFeedback = async (req, res) => {
  try {
    const eventId = req.params.id
    const { message, metadata } = req.body

    if (!message || !message.trim()) {
      return res.status(400).json({ message: 'Message is required' })
    }

    const event = await Event.findById(eventId)
    if (!event) return res.status(404).json({ message: 'Event not found' })

    // Sanitize message for profanity
    const cleanedMessage = profanityFilter.clean(message.trim())

    const feedback = new EventFeedback({
      event: eventId,
      user: req.user ? req.user._id : undefined,
      message: cleanedMessage,
      metadata: metadata || {}
    })

    await feedback.save()

    res.status(201).json(feedback)
  } catch (err) {
    console.error('Error creating event feedback:', err.message)
    res.status(500).json({ message: 'Internal server error' })
  }
}

export const listEventFeedbacks = async (req, res) => {
  try {
    const eventId = req.params.id
    const event = await Event.findById(eventId)
    if (!event) return res.status(404).json({ message: 'Event not found' })

    // Only the event organizer or admins can view all event feedbacks
    const requester = req.user
    const isOrganizer = requester && event.organizer && requester._id.toString() === event.organizer.toString()
    const isAdmin = requester && (requester.permission === 'admin' || requester.permission === 'superAdmin')
    if (!isOrganizer && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized to view event feedbacks' })
    }

    const feedbacks = await EventFeedback.find({ event: eventId })
      .populate('user', 'name username profilePicture')
      .sort({ createdAt: -1 })

    res.status(200).json(feedbacks)
  } catch (err) {
    console.error('Error listing event feedbacks:', err.message)
    res.status(500).json({ message: 'Internal server error' })
  }
}
