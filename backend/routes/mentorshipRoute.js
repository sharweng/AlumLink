import express from "express";
import { protectRoute } from "../middleware/authMiddleware.js";
import {
    getAllMentors,
    requestMentorship,
    respondToMentorshipRequest,
    getMyMentorships,
    getMentorshipById,
    updateMentorship,
    createSession,
    getSessions,
    getSessionById,
    updateSession,
    confirmSession,
    cancelSession,
    addSessionFeedback,
    deleteSessionFeedback,
    deleteSession,
    getMentorshipProgress,
} from "../controllers/mentorshipController.js";

const router = express.Router();

// Mentor routes
router.get("/mentors", protectRoute, getAllMentors);

// Mentorship routes - specific routes BEFORE parameterized routes
router.post("/request", protectRoute, requestMentorship);
router.get("/my-mentorships", protectRoute, getMyMentorships);

// Session routes - must be before /:mentorshipId to avoid conflicts
router.post("/sessions", protectRoute, createSession);
router.get("/sessions", protectRoute, getSessions);
router.get("/sessions/:sessionId", protectRoute, getSessionById);
router.put("/sessions/:sessionId", protectRoute, updateSession);
router.put("/sessions/:sessionId/confirm", protectRoute, confirmSession);
router.put("/sessions/:sessionId/cancel", protectRoute, cancelSession);
router.post("/sessions/:sessionId/feedback", protectRoute, addSessionFeedback);
router.delete("/sessions/:sessionId/feedback", protectRoute, deleteSessionFeedback);
router.delete("/sessions/:sessionId", protectRoute, deleteSession);

// Mentorship parameterized routes - MUST be last
router.put("/:mentorshipId/respond", protectRoute, respondToMentorshipRequest);
router.get("/:mentorshipId/progress", protectRoute, getMentorshipProgress);
router.get("/:mentorshipId", protectRoute, getMentorshipById);
router.put("/:mentorshipId", protectRoute, updateMentorship);

export default router;
