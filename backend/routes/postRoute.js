import express from "express";
import { protectRoute } from "../middleware/authMiddleware.js";
import { createPost, getFeedPosts, deletePost, getPostById, createComment } from "../controllers/postController.js";

const router = express.Router();

router.get("/", protectRoute, getFeedPosts);
router.post("/create", protectRoute, createPost);
router.post("/delete/:id", protectRoute, deletePost);
router.get("/:id", protectRoute, getPostById);
router.post("/:id/comment", protectRoute, createComment);

export default router;