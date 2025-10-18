import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema({
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    }],
    lastMessage: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Message"
    },
    lastMessageAt: {
        type: Date,
        default: Date.now
    },
    // Track unread count per user
    unreadCount: {
        type: Map,
        of: Number,
        default: {}
    }
}, { timestamps: true });

// Ensure exactly 2 participants and no duplicates
conversationSchema.pre('save', function(next) {
    if (this.participants.length !== 2) {
        return next(new Error('A conversation must have exactly 2 participants'));
    }
    
    const uniqueParticipants = [...new Set(this.participants.map(p => p.toString()))];
    if (uniqueParticipants.length !== 2) {
        return next(new Error('Participants must be unique'));
    }
    
    next();
});

// Index for finding conversations by participants
conversationSchema.index({ participants: 1 });
conversationSchema.index({ lastMessageAt: -1 });

const Conversation = mongoose.model("Conversation", conversationSchema);

export default Conversation;
