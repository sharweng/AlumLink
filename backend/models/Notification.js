import mongoose from "mongoose";    

const notificationSchema = new mongoose.Schema({
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    type: {
        type: String,
        required: true,
        enum: ["like", "comment", "linkAccepted", "jobApplication", "jobApplicationCancelled", "discussionLike", "discussionComment", "discussionReply", "discussionMention", "discussionCommentLike", "discussionCommentDislike"],
    },
    relatedUser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
    relatedPost: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Post",
    },
    relatedJobPost: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "JobPost",
    },
    relatedDiscussion: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Discussion",
    },
    relatedComment: {
        type: String, // Store comment ID as string since it's a subdocument
    },
    relatedReply: {
        type: String, // Store reply ID as string since it's a subdocument
    },
    read: {
        type: Boolean,
        default: false,
    },
}, { timestamps: true });

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;