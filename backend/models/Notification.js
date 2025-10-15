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
        enum: ["like", "comment", "linkAccepted", "jobApplication", "jobApplicationCancelled", "jobUpdate", "discussionLike", "discussionComment", "discussionReply", "discussionMention", "discussionCommentLike", "discussionCommentDislike", "eventRSVP", "eventInterested", "eventReminder", "eventUpdate", "eventCancelled"],
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
    relatedEvent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Event",
    },
    relatedComment: {
        type: String, // Store comment ID as string since it's a subdocument
    },
    relatedReply: {
        type: String, // Store reply ID as string since it's a subdocument
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed, // For additional context like RSVP action
    },
    read: {
        type: Boolean,
        default: false,
    },
}, { timestamps: true });

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;