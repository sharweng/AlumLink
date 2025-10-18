import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import User from "../models/User.js";
import Mentorship from "../models/Mentorship.js";
import { emitToUser } from "../lib/socket.js";

// Check if two users can message each other
export const canMessage = async (userId1, userId2) => {
    // Check if users are linked (connections)
    const user1 = await User.findById(userId1);
    const user2 = await User.findById(userId2);
    
    if (!user1 || !user2) return false;
    
    // Check if they are connections
    const areConnected = user1.links.includes(userId2) && user2.links.includes(userId1);
    if (areConnected) return true;
    
    // Check if they have an active mentorship
    const mentorship = await Mentorship.findOne({
        $or: [
            { mentor: userId1, mentee: userId2, status: "accepted" },
            { mentor: userId2, mentee: userId1, status: "accepted" }
        ]
    });
    
    return !!mentorship;
};

// Get or create conversation
export const getOrCreateConversation = async (req, res) => {
    try {
        const { userId } = req.params; // The other user
        const currentUserId = req.user._id;
        
        if (userId === currentUserId.toString()) {
            return res.status(400).json({ message: "Cannot message yourself" });
        }
        
        // Check if users can message each other
        const canMsg = await canMessage(currentUserId, userId);
        if (!canMsg) {
            return res.status(403).json({ 
                message: "You can only message your connections or mentorship partners" 
            });
        }
        
        // Find existing conversation
        let conversation = await Conversation.findOne({
            participants: { $all: [currentUserId, userId] }
        })
        .populate("participants", "name username profilePicture headline")
        .populate({
            path: "lastMessage",
            populate: {
                path: "sender",
                select: "name username profilePicture"
            }
        });
        
        // Create new conversation if doesn't exist
        if (!conversation) {
            conversation = await Conversation.create({
                participants: [currentUserId, userId]
            });
            
            conversation = await Conversation.findById(conversation._id)
                .populate("participants", "name username profilePicture headline");
        }
        
        res.status(200).json(conversation);
    } catch (error) {
        console.error("Error in getOrCreateConversation:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Get all conversations for current user
export const getConversations = async (req, res) => {
    try {
        const conversations = await Conversation.find({
            participants: req.user._id
        })
        .populate("participants", "name username profilePicture headline")
        .populate({
            path: "lastMessage",
            populate: {
                path: "sender",
                select: "name username profilePicture"
            }
        })
        .sort({ lastMessageAt: -1 });
        
        res.status(200).json(conversations);
    } catch (error) {
        console.error("Error in getConversations:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Get messages for a conversation
export const getMessages = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const { limit = 50, before } = req.query;
        
        const conversation = await Conversation.findById(conversationId);
        
        if (!conversation) {
            return res.status(404).json({ message: "Conversation not found" });
        }
        
        // Check if user is participant
        if (!conversation.participants.includes(req.user._id)) {
            return res.status(403).json({ message: "Not authorized" });
        }
        
        // Build query
        const query = {
            conversation: conversationId,
            deletedFor: { $ne: req.user._id }
        };
        
        if (before) {
            query.createdAt = { $lt: new Date(before) };
        }
        
        const messages = await Message.find(query)
            .populate("sender", "name username profilePicture")
            .sort({ createdAt: -1 })
            .limit(parseInt(limit));
        
        // Mark messages as read
        await Message.updateMany(
            {
                conversation: conversationId,
                sender: { $ne: req.user._id },
                readBy: { $ne: req.user._id }
            },
            {
                $addToSet: { readBy: req.user._id }
            }
        );
        
        // Update unread count
        conversation.unreadCount.set(req.user._id.toString(), 0);
        await conversation.save();
        
        res.status(200).json(messages.reverse());
    } catch (error) {
        console.error("Error in getMessages:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Send a message
export const sendMessage = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const { content, messageType = "text", callData } = req.body;
        
        const conversation = await Conversation.findById(conversationId);
        
        if (!conversation) {
            return res.status(404).json({ message: "Conversation not found" });
        }
        
        // Check if user is participant
        if (!conversation.participants.includes(req.user._id)) {
            return res.status(403).json({ message: "Not authorized" });
        }
        
        // Create message
        const message = await Message.create({
            conversation: conversationId,
            sender: req.user._id,
            content,
            messageType,
            callData,
            readBy: [req.user._id]
        });
        
        // Update conversation
        conversation.lastMessage = message._id;
        conversation.lastMessageAt = new Date();
        
        // Increment unread count for other participant
        const otherParticipant = conversation.participants.find(
            p => p.toString() !== req.user._id.toString()
        );
        
        console.log('Current user ID:', req.user._id.toString());
        console.log('All participants:', conversation.participants.map(p => p.toString()));
        console.log('Other participant ID:', otherParticipant ? otherParticipant.toString() : 'NOT FOUND');
        
        if (!otherParticipant) {
            console.error('ERROR: Could not find other participant in conversation');
            return res.status(500).json({ message: "Could not find recipient" });
        }
        
        const currentUnread = conversation.unreadCount.get(otherParticipant.toString()) || 0;
        conversation.unreadCount.set(otherParticipant.toString(), currentUnread + 1);
        
        await conversation.save();
        
        // Populate message
        const populatedMessage = await Message.findById(message._id)
            .populate("sender", "name username profilePicture");
        
        // Emit via Socket.IO to recipient
        const emitted = emitToUser(otherParticipant.toString(), "new-message", {
            message: populatedMessage,
            conversationId: conversationId
        });
        
        console.log(`Message sent to ${otherParticipant.toString()}, socket emitted: ${emitted}`);
        
        res.status(201).json(populatedMessage);
    } catch (error) {
        console.error("Error in sendMessage:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Delete message for current user
export const deleteMessage = async (req, res) => {
    try {
        const { messageId } = req.params;
        
        const message = await Message.findById(messageId);
        
        if (!message) {
            return res.status(404).json({ message: "Message not found" });
        }
        
        // Only sender can delete
        if (message.sender.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Not authorized" });
        }
        
        message.deletedFor.push(req.user._id);
        await message.save();
        
        res.status(200).json({ message: "Message deleted" });
    } catch (error) {
        console.error("Error in deleteMessage:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Get unread message count
export const getUnreadCount = async (req, res) => {
    try {
        const conversations = await Conversation.find({
            participants: req.user._id
        });
        
        let totalUnread = 0;
        conversations.forEach(conv => {
            const unread = conv.unreadCount.get(req.user._id.toString()) || 0;
            totalUnread += unread;
        });
        
        res.status(200).json({ unreadCount: totalUnread });
    } catch (error) {
        console.error("Error in getUnreadCount:", error);
        res.status(500).json({ message: "Server error" });
    }
};
