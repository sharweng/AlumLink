import express from "express";
import { protectRoute } from "../middleware/authMiddleware.js";
import { 
    getAllDiscussions, 
    getDiscussionById, 
    createDiscussion, 
    updateDiscussion, 
    deleteDiscussion, 
    likeDiscussion, 
    createComment, 
    deleteComment, 
    updateComment,
    createReply,
    deleteReply,
    updateReply,
    likeComment,
    dislikeComment
    ,
    banDiscussion,
    unbanDiscussion,
    banDiscussionComment,
    unbanDiscussionComment,
    banDiscussionReply,
    unbanDiscussionReply
} from "../controllers/discussionController.js";

const router = express.Router();

router.get("/", protectRoute, getAllDiscussions);
router.post("/create", protectRoute, createDiscussion);
router.get("/:id", protectRoute, getDiscussionById);
router.put("/:id", protectRoute, updateDiscussion);
router.delete("/:id", protectRoute, deleteDiscussion);
router.post("/:id/like", protectRoute, likeDiscussion);
router.post("/:id/comment", protectRoute, createComment);
router.delete("/:id/comment/:commentId", protectRoute, deleteComment);
router.put("/:id/comment/:commentId", protectRoute, updateComment);
router.post("/:id/comment/:commentId/like", protectRoute, likeComment);
router.post("/:id/comment/:commentId/dislike", protectRoute, dislikeComment);
router.post("/:id/comment/:commentId/reply", protectRoute, createReply);
router.delete("/:id/comment/:commentId/reply/:replyId", protectRoute, deleteReply);
router.put("/:id/comment/:commentId/reply/:replyId", protectRoute, updateReply);

// Admin ban/unban for discussions/comments/replies
router.put('/:id/ban', protectRoute, banDiscussion);
router.put('/:id/unban', protectRoute, unbanDiscussion);
router.put('/:id/comment/:commentId/ban', protectRoute, banDiscussionComment);
router.put('/:id/comment/:commentId/unban', protectRoute, unbanDiscussionComment);
router.put('/:id/comment/:commentId/reply/:replyId/ban', protectRoute, banDiscussionReply);
router.put('/:id/comment/:commentId/reply/:replyId/unban', protectRoute, unbanDiscussionReply);

export default router;
