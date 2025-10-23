import express from 'express'
import { protectRoute } from '../middleware/authMiddleware.js'
import { createFeedback, listFeedbacks, markFeedbackSeen, markAllFeedbacksSeen, deleteFeedback } from '../controllers/feedbackController.js'

const router = express.Router()

// Anyone can send general feedback, but if they are authenticated we attach their user
router.post('/', protectRoute, createFeedback)

// Admin or protected route to list feedbacks
router.get('/', protectRoute, listFeedbacks)

router.put('/:id/seen', protectRoute, markFeedbackSeen)
router.put('/mark-all-seen', protectRoute, markAllFeedbacksSeen)
router.delete('/:id', protectRoute, deleteFeedback)

export default router
