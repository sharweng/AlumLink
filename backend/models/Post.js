import mongoose from "mongoose";

const postSchema = new mongoose.Schema({
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    content: { 
        type: String 
    },
    image: { 
        type: String 
    },
    images: [{ 
        type: String 
    }],
    likes: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "User" 
    }],
    comments: [{
        content: { type: String },
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        banned: { type: Boolean, default: false },
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
            banned: { type: Boolean, default: false },
            createdAt: { type: Date, default: Date.now },
            editedAt: { type: Date },
        }]
    }],
    banned: { type: Boolean, default: false },
    editedAt: { 
        type: Date 
    },
    shareCount: { type: Number, default: 0 },
}, { timestamps: true });

const Post = mongoose.model("Post", postSchema);

export default Post;