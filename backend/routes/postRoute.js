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
    dislikeComment
} from "../controllers/postController.js";

const router = express.Router();

router.get("/", protectRoute, getFeedPosts);
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

export default router;