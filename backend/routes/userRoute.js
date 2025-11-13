import express from "express";
import { protectRoute } from "../middleware/authMiddleware.js";
import { getSuggestedLinks, getPublicProfile, updateProfile, toggleMentorStatus, updateUserById, uploadCV, deleteCV, extractCVData } from "../controllers/userController.js";

const router = express.Router();

router.get("/suggestions", protectRoute, getSuggestedLinks)
router.get("/:username", protectRoute, getPublicProfile);
router.put("/profile", protectRoute, updateProfile);
router.put("/toggle-mentor", protectRoute, toggleMentorStatus);
router.post("/cv/upload", protectRoute, uploadCV);
router.post("/cv/extract", protectRoute, extractCVData);
router.delete("/cv/delete", protectRoute, deleteCV);
router.put("/:id", protectRoute, updateUserById);

export default router;