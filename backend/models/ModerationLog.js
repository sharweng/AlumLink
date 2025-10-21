import mongoose from 'mongoose'

const moderationLogSchema = new mongoose.Schema({
  action: { type: String, enum: ['ban', 'unban'], required: true },
  targetType: { type: String, required: true }, // e.g. post, comment, reply, job, event
  targetId: { type: String, required: true },
  parentId: { type: String }, // post id for comments/replies
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  performedAt: { type: Date, default: Date.now },
  reason: { type: String }
}, { timestamps: true })

const ModerationLog = mongoose.model('ModerationLog', moderationLogSchema)

export default ModerationLog
