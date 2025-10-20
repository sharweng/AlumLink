import mongoose from 'mongoose'

const feedbackSchema = new mongoose.Schema({
	message: {
		type: String,
		required: true,
	},
	user: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User',
	},
	metadata: {
		type: Object,
		default: {}
	},
	seen: {
		type: Boolean,
		default: false
	}
}, { timestamps: true })

const Feedback = mongoose.model('Feedback', feedbackSchema)

export default Feedback
