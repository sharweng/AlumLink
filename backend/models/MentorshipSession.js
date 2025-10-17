import mongoose from "mongoose";

const mentorshipSessionSchema = new mongoose.Schema({
    mentorship: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Mentorship",
        required: true,
    },
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        default: "",
    },
    scheduledDate: {
        type: Date,
        required: true,
    },
    duration: {
        type: Number, // in minutes
        default: 60,
    },
    meetingLink: {
        type: String, // Google Meet, Zoom, or other video call link
        default: "",
    },
    location: {
        type: String, // For in-person meetings
        default: "",
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    confirmedByMentor: {
        type: Boolean,
        default: false,
    },
    confirmedByMentee: {
        type: Boolean,
        default: false,
    },
    status: {
        type: String,
        enum: ["pending", "scheduled", "completed", "cancelled", "rescheduled"],
        default: "pending",
    },
    agenda: {
        type: String,
        default: "",
    },
    notes: {
        type: String,
        default: "",
    },
    feedback: {
        mentorFeedback: {
            type: String,
            default: "",
        },
        menteeFeedback: {
            type: String,
            default: "",
        },
        rating: {
            type: Number,
            min: 1,
            max: 5,
        },
    },
    actionItems: [{
        task: String,
        completed: {
            type: Boolean,
            default: false,
        },
        dueDate: Date,
    }],
}, {
    timestamps: true,
});

// Indexes for efficient queries
mentorshipSessionSchema.index({ mentorship: 1, scheduledDate: -1 });
mentorshipSessionSchema.index({ status: 1, scheduledDate: 1 });

const MentorshipSession = mongoose.model("MentorshipSession", mentorshipSessionSchema);

export default MentorshipSession;
