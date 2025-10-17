import mongoose from "mongoose";

const mentorshipSchema = new mongoose.Schema({
    mentor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    mentee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    status: {
        type: String,
        enum: ["pending", "accepted", "declined", "completed", "cancelled"],
        default: "pending",
    },
    requestMessage: {
        type: String,
        required: true,
    },
    goals: {
        type: String,
        default: "",
    },
    focusAreas: [String],
    startDate: {
        type: Date,
    },
    endDate: {
        type: Date,
    },
    notes: {
        type: String,
        default: "",
    },
}, {
    timestamps: true,
});

// Indexes for efficient queries
mentorshipSchema.index({ mentor: 1, status: 1 });
mentorshipSchema.index({ mentee: 1, status: 1 });

const Mentorship = mongoose.model("Mentorship", mentorshipSchema);

export default Mentorship;
