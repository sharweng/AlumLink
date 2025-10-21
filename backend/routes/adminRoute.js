import express from "express";
import { protectRoute } from "../middleware/authMiddleware.js";
import {
    getAllUsers,
    updateUserRole,
    toggleUserStatus,
    getDashboardStats
} from "../controllers/adminController.js";
import { getModerationLogs } from "../controllers/moderationController.js";
import { deleteModerationLog, deleteAllModerationLogs } from "../controllers/moderationController.js";

const router = express.Router();

router.get("/stats", protectRoute, getDashboardStats);
router.get("/users", protectRoute, getAllUsers);
router.put("/users/:userId/role", protectRoute, updateUserRole);
router.put("/users/:userId/toggle-status", protectRoute, toggleUserStatus);
router.get('/moderation-logs', protectRoute, getModerationLogs);
router.delete('/moderation-logs/:id', protectRoute, deleteModerationLog);
router.delete('/moderation-logs', protectRoute, deleteAllModerationLogs);

export default router;
