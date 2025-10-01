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
    searchJobPosts,
    getMyJobPosts,
    deleteCommentFromJobPost
} from "../controllers/jobController.js";

const router = express.Router();

// Public routes (protected but accessible to all authenticated users)
router.get("/", protectRoute, getAllJobPosts);
router.get("/search", protectRoute, searchJobPosts);
router.get("/my-posts", protectRoute, getMyJobPosts);
router.get("/:id", protectRoute, getJobPostById);

// Job post management routes
router.post("/", protectRoute, createJobPost);
router.put("/:id", protectRoute, updateJobPost);
router.delete("/:id", protectRoute, deleteJobPost);

// Interaction routes
router.post("/:id/like", protectRoute, likeJobPost);
router.post("/:id/comment", protectRoute, commentOnJobPost);
router.delete("/:id/comment/:commentId", protectRoute, deleteCommentFromJobPost);
router.post("/:id/apply", protectRoute, applyToJob);

export default router;