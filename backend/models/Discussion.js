import mongoose from "mongoose";

const discussionSchema = new mongoose.Schema({
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    title: {
        type: String,
        required: true,
        trim: true,
    },
    content: { 
        type: String,
        required: true,
    },
    images: [{ 
        type: String 
    }],
    files: [{
        url: { type: String },
        key: { type: String }, // R2 storage key for deletion
        name: { type: String },
        type: { type: String },
        size: { type: Number },
    }],
    tags: [{ 
        type: String,
        trim: true,
    }],
    category: {
        type: String,
        enum: ['General', 'Technical', 'Career', 'Events', 'Help', 'Other'],
        default: 'General',
    },
    likes: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "User" 
    }],
    comments: [{
        content: { type: String },
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        createdAt: { type: Date, default: Date.now },
        editedAt: { type: Date },
        likes: [{ 
            type: mongoose.Schema.Types.ObjectId, 
            ref: "User" 
        }],
        dislikes: [{ 
            type: mongoose.Schema.Types.ObjectId, 
            ref: "User" 
        }],
        replies: [{
            content: { type: String },
            user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
            createdAt: { type: Date, default: Date.now },
            editedAt: { type: Date },
        }]
    }],
    views: {
        type: Number,
        default: 0,
    },
    isPinned: {
        type: Boolean,
        default: false,
    },
    editedAt: { 
        type: Date 
    },
}, { timestamps: true });

const Discussion = mongoose.model("Discussion", discussionSchema);

export default Discussion;
