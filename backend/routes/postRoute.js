import express from "express";
import { protectRoute } from "../middleware/authMiddleware.js";
import { createPost, getFeedPosts } from "../controllers/postController.js";

const router = express.Router();

router.get("/", protectRoute, getFeedPosts);
router.post("/create", protectRoute, createPost);

export default router;