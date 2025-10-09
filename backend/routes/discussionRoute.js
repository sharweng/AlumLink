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
    updateComment 
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

export default router;
