import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
    conversation: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Conversation",
        required: true
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    content: {
        type: String,
        required: true,
        trim: true
    },
    messageType: {
        type: String,
        enum: ["text", "call-notification"],
        default: "text"
    },
    // For call notifications
    callData: {
        callId: String,
        callType: {
            type: String,
            enum: ["video", "audio"]
        },
        duration: Number, // in seconds
        status: {
            type: String,
            enum: ["initiated", "answered", "missed", "ended"]
        }
    },
    readBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }],
    deletedFor: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }]
}, { timestamps: true });

// Index for efficient querying
messageSchema.index({ conversation: 1, createdAt: -1 });
messageSchema.index({ sender: 1 });

const Message = mongoose.model("Message", messageSchema);

export default Message;
