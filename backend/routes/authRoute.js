import express from "express";
import { signup, login, logout, getCurrentUser, getSocketToken, verifySignupCode, requestPasswordReset, verifyResetCode, resetPassword } from "../controllers/authController.js";
import { protectRoute } from "../middleware/authMiddleware.js";

const router = express.Router()

router.post("/signup", signup)
router.post("/verify-signup-code", verifySignupCode)
router.post("/login", login)
router.post("/logout", logout)

// Forgot password endpoints
router.post("/request-password-reset", requestPasswordReset)
router.post("/verify-reset-code", verifyResetCode)
router.post("/reset-password", resetPassword)

router.get("/me", protectRoute, getCurrentUser)
router.get("/socket-token", protectRoute, getSocketToken)

export default router
