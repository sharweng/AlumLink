import express from "express";
import { protectRoute } from "../middleware/authMiddleware.js";
import {
    getAllUsers,
    updateUserRole,
    toggleUserStatus,
    getDashboardStats
} from "../controllers/adminController.js";

const router = express.Router();

router.get("/stats", protectRoute, getDashboardStats);
router.get("/users", protectRoute, getAllUsers);
router.put("/users/:userId/role", protectRoute, updateUserRole);
router.put("/users/:userId/toggle-status", protectRoute, toggleUserStatus);

export default router;
