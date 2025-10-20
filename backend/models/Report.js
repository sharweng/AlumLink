import mongoose from 'mongoose'

const reportSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['post', 'job', 'event', 'discussion', 'other'],
    required: true,
  },
  target: {
    // store the id of the reported resource (string or ObjectId)
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
  // optional finer-grained target (e.g., comment or reply id under a post/discussion)
  subTarget: {
    type: mongoose.Schema.Types.Mixed,
  },
  details: {
    type: String,
    default: ''
  },
  reporter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  status: {
    type: String,
    enum: ['open', 'in_review', 'resolved'],
    default: 'open'
  },
  seen: {
    type: Boolean,
    default: false
  }
}, { timestamps: true })

const Report = mongoose.model('Report', reportSchema)

export default Report
