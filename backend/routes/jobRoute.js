import express from "express";
import { protectRoute } from "../middleware/authMiddleware.js";
import {
    getAllJobPosts,
    getJobPostById,
    createJobPost,
    updateJobPost,
    deleteJobPost,
    likeJobPost,
    commentOnJobPost,
    applyToJob,
    cancelApplication,
    searchJobPosts,
    getMyJobPosts,
    getMyApplications,
    deleteCommentFromJobPost,
    editCommentOnJobPost,
    acceptApplicant,
    rejectApplicant
} from "../controllers/jobController.js";

import { banJobPost, unbanJobPost } from "../controllers/jobController.js";

const router = express.Router();

// Specific routes must come before dynamic routes
router.get("/my-posts", protectRoute, getMyJobPosts);
router.get("/my-applications", protectRoute, getMyApplications);
router.get("/search", protectRoute, searchJobPosts);

// Public routes (protected but accessible to all authenticated users)
router.get("/", protectRoute, getAllJobPosts);
router.get("/:id", protectRoute, getJobPostById);

// Job post management routes
router.post("/", protectRoute, createJobPost);
router.put("/:id", protectRoute, updateJobPost);
router.delete("/:id", protectRoute, deleteJobPost);

// Admin moderation routes for job posts
router.put('/:id/ban', protectRoute, banJobPost);
router.put('/:id/unban', protectRoute, unbanJobPost);

// Interaction routes
router.post("/:id/like", protectRoute, likeJobPost);
router.post("/:id/comment", protectRoute, commentOnJobPost);
router.put("/:id/comment/:commentId", protectRoute, editCommentOnJobPost);
router.delete("/:id/comment/:commentId", protectRoute, deleteCommentFromJobPost);
router.post("/:id/apply", protectRoute, applyToJob);
router.post("/:id/cancel", protectRoute, cancelApplication);

// Applicant management routes
router.put("/:id/applicants/:applicantId/accept", protectRoute, acceptApplicant);
router.put("/:id/applicants/:applicantId/reject", protectRoute, rejectApplicant);

export default router;