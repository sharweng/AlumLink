import express from "express";
import { protectRoute } from "../middleware/authMiddleware.js";
import { 
    createPost, 
    getFeedPosts, 
    deletePost, 
    editPost, 
    getPostById, 
    createComment, 
    likePost, 
    removeComment, 
    editCommentOnPost,
    createReply,
    deleteReply,
    updateReply,
    likeComment,
    dislikeComment,
    getUserPosts,
    banPost,
    unbanPost,
    banComment,
    unbanComment,
    banReply,
    unbanReply,
    updatePostsVisibility
} from "../controllers/postController.js";

const router = express.Router();

router.get("/", protectRoute, getFeedPosts);
router.get("/user/:username", protectRoute, getUserPosts);
router.post("/create", protectRoute, createPost);
router.delete("/delete/:id", protectRoute, deletePost);
router.put("/edit/:id", protectRoute, editPost);
router.get("/:id", protectRoute, getPostById);
router.post("/:id/comment", protectRoute, createComment);
router.post("/:id/like", protectRoute, likePost);
router.delete("/:id/comment/:commentId", protectRoute, removeComment);
router.put("/:id/comment/:commentId", protectRoute, editCommentOnPost);
router.post("/:id/comment/:commentId/reply", protectRoute, createReply);
router.delete("/:id/comment/:commentId/reply/:replyId", protectRoute, deleteReply);
router.put("/:id/comment/:commentId/reply/:replyId", protectRoute, updateReply);
router.post("/:id/comment/:commentId/like", protectRoute, likeComment);
router.post("/:id/comment/:commentId/dislike", protectRoute, dislikeComment);
router.put("/visibility", protectRoute, updatePostsVisibility);
    
    // Admin ban/unban endpoints for posts, comments and replies
    router.put('/:id/ban', protectRoute, banPost);
    router.put('/:id/unban', protectRoute, unbanPost);
    router.put('/:id/comment/:commentId/ban', protectRoute, banComment);
    router.put('/:id/comment/:commentId/unban', protectRoute, unbanComment);
    router.put('/:id/comment/:commentId/reply/:replyId/ban', protectRoute, banReply);
    router.put('/:id/comment/:commentId/reply/:replyId/unban', protectRoute, unbanReply);

export default router;