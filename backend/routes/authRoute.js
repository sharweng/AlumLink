import express from "express";
import { signup, login, logout, getCurrentUser, getSocketToken } from "../controllers/authController.js";
import { protectRoute } from "../middleware/authMiddleware.js";

const router = express.Router()

router.post("/signup", signup)
router.post("/login", login)
router.post("/logout", logout)

router.get("/me", protectRoute, getCurrentUser)
router.get("/socket-token", protectRoute, getSocketToken)

export default router
