import express from "express";
import { protectRoute } from "../middleware/authMiddleware.js";
import {
    getAllUsers,
    updateUserRole,
    updateUserPermission,
    toggleUserStatus,
    getDashboardStats,
    banUser,
    unbanUser,
    getAllPostsAdmin,
    getAllJobsAdmin,
    importUsers
} from "../controllers/adminController.js";
import { getModerationLogs } from "../controllers/moderationController.js";
import { deleteModerationLog, deleteAllModerationLogs } from "../controllers/moderationController.js";

const router = express.Router();

router.get("/stats", protectRoute, getDashboardStats);
router.get("/all-posts", protectRoute, getAllPostsAdmin);
router.get("/all-jobs", protectRoute, getAllJobsAdmin);
router.get("/users", protectRoute, getAllUsers);
router.post("/users/import", protectRoute, importUsers);
router.put("/users/:userId/role", protectRoute, updateUserRole);
router.put("/users/:userId/permission", protectRoute, updateUserPermission);
router.put("/users/:userId/toggle-status", protectRoute, toggleUserStatus);
router.put("/users/:userId/ban", protectRoute, banUser);
router.put("/users/:userId/unban", protectRoute, unbanUser);
router.get('/moderation-logs', protectRoute, getModerationLogs);
router.delete('/moderation-logs/:id', protectRoute, deleteModerationLog);
router.delete('/moderation-logs', protectRoute, deleteAllModerationLogs);

export default router;
