import mongoose from "mongoose";

const jobPostSchema = new mongoose.Schema({
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
    company: {
        type: String,
        required: true,
        trim: true,
    },
    location: {
        type: String,
        required: true,
        trim: true,
    },
    type: {
        type: String,
        required: true,
        enum: ["job", "part-time", "internship", "freelance"],
        default: "job",
    },
    workType: {
        type: String,
        required: true,
        enum: ["remote", "onsite", "hybrid"],
        default: "onsite",
    },
    description: {
        type: String,
        required: true,
    },
    requirements: {
        type: String,
        required: true,
    },
    skills: [{
        type: String,
        trim: true,
    }],
    salary: {
        min: {
            type: Number,
        },
        max: {
            type: Number,
        },
        currency: {
            type: String,
            default: "PHP",
        },
    },
    duration: {
        type: String, // For internships/freelance projects
    },
    applicationDeadline: {
        type: Date,
    },
    applicationUrl: {
        type: String,
    },
    applicationEmail: {
        type: String,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    applicants: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        appliedAt: {
            type: Date,
            default: Date.now,
        },
        status: {
            type: String,
            enum: ["pending", "reviewed", "shortlisted", "accepted", "rejected", "hired"],
            default: "pending",
        },
    }],
        shareCount: { type: Number, default: 0 },

    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    }],
    comments: [{
        content: { type: String },
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        createdAt: { type: Date, default: Date.now },
        editedAt: { type: Date },
    }],
    banned: { type: Boolean, default: false },
}, { timestamps: true });

// Index for better search performance
jobPostSchema.index({ title: "text", company: "text", skills: "text", location: "text" });
jobPostSchema.index({ type: 1, isActive: 1, createdAt: -1 });

const JobPost = mongoose.model("JobPost", jobPostSchema);

export default JobPost;