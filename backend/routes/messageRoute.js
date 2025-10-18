import express from "express";
import { protectRoute } from "../middleware/authMiddleware.js";
import { 
    getOrCreateConversation,
    getConversations,
    getMessages,
    sendMessage,
    deleteMessage,
    getUnreadCount
} from "../controllers/messageController.js";

const router = express.Router();

// Get all conversations
router.get("/conversations", protectRoute, getConversations);

// Get or create conversation with specific user
router.get("/conversations/:userId", protectRoute, getOrCreateConversation);

// Get messages for a conversation
router.get("/conversations/:conversationId/messages", protectRoute, getMessages);

// Send message
router.post("/conversations/:conversationId/messages", protectRoute, sendMessage);

// Delete message
router.delete("/messages/:messageId", protectRoute, deleteMessage);

// Get unread count
router.get("/unread-count", protectRoute, getUnreadCount);

export default router;
