import express from "express";
import { protectRoute } from "../middleware/authMiddleware.js";
import { createPost, getFeedPosts, deletePost, getPostById, createComment, likePost, removeComment, editCommentOnPost } from "../controllers/postController.js";

const router = express.Router();

router.get("/", protectRoute, getFeedPosts);
router.post("/create", protectRoute, createPost);
router.delete("/delete/:id", protectRoute, deletePost);
router.get("/:id", protectRoute, getPostById);
router.post("/:id/comment", protectRoute, createComment);
router.post("/:id/like", protectRoute, likePost);
router.delete("/:id/comment/:commentId", protectRoute, removeComment);
router.put("/:id/comment/:commentId", protectRoute, editCommentOnPost);

export default router;