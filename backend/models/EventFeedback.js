import mongoose from 'mongoose'

const eventFeedbackSchema = new mongoose.Schema({
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  message: {
    type: String,
    required: true,
  },
  metadata: {
    type: Object,
    default: {}
  }
}, { timestamps: true })

const EventFeedback = mongoose.model('EventFeedback', eventFeedbackSchema)

export default EventFeedback
