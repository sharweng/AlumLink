import express from 'express'
import { protectRoute } from '../middleware/authMiddleware.js'
import { createReport, listReports, markReportSeen, markAllReportsSeen } from '../controllers/reportController.js'

const router = express.Router()

router.post('/', protectRoute, createReport)
router.get('/', protectRoute, listReports)

import { deleteReport } from '../controllers/reportController.js'

router.put('/:id/seen', protectRoute, markReportSeen)
router.put('/mark-all-seen', protectRoute, markAllReportsSeen)
router.delete('/:id', protectRoute, deleteReport)

export default router
