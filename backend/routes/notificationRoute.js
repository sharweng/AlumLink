import express from "express";
import { protectRoute } from "../middleware/authMiddleware.js";
import { getUserNotifications, markNotificationAsRead, deleteNotification } from "../controllers/notificationController.js";

const router = express.Router();

router.get("/", protectRoute, getUserNotifications);
router.put("/:id/read", protectRoute, markNotificationAsRead);
router.delete("/:id", protectRoute, deleteNotification);

export default router;