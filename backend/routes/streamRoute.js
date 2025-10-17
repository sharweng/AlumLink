import express from "express";
import { protectRoute } from "../middleware/authMiddleware.js";
import { getStreamToken } from "../controllers/streamController.js";

const router = express.Router();

// Get Stream token for video calls
router.get("/token", protectRoute, getStreamToken);

export default router;
