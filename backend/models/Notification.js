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
        enum: ["like", "comment", "linkAccepted", "jobApplication", "jobApplicationCancelled", "jobUpdate", "jobAccepted", "jobRejected", "discussionLike", "discussionComment", "discussionReply", "discussionMention", "discussionCommentLike", "discussionCommentDislike", "postReply", "postCommentLike", "postCommentDislike", "eventRSVP", "eventInterested", "eventReminder", "eventUpdate", "eventCancelled", "mentorshipRequest", "mentorshipAccepted", "mentorshipDeclined", "mentorshipEnded", "sessionScheduled", "sessionConfirmed", "sessionCancelled", "sessionCancelRequest", "sessionCompleted", "sessionFeedback", "postMention"],
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
    relatedMentorship: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Mentorship",
    },
    relatedSession: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "MentorshipSession",
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