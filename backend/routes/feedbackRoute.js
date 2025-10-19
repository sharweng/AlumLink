import express from 'express';
import { createFeedback, listFeedback } from '../controllers/feedbackController.js';
import { protectRoute } from '../middleware/authMiddleware.js';

// middleware to require admin role after protectRoute
const requireAdmin = (req, res, next) => {
	if (!req.user || req.user.role !== 'admin') {
		return res.status(403).json({ message: 'Admin access required' });
	}
	next();
};

const router = express.Router();

// public submission endpoint (optionally authenticated)
// public submission endpoint (authenticated optional)
router.post('/', createFeedback);

// admin listing
router.get('/', protectRoute, requireAdmin, listFeedback);

export default router;
