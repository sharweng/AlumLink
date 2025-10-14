import mongoose from "mongoose";

// Track reminders that users have deleted to prevent re-sending
const deletedReminderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    event: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Event",
        required: true,
    },
    reminderWindowStart: {
        type: Date,
        required: true, // When the 24-hour window started (event start - 24 hours)
    },
}, { timestamps: true });

// Index for faster lookups
deletedReminderSchema.index({ user: 1, event: 1, reminderWindowStart: 1 });

const DeletedReminder = mongoose.model("DeletedReminder", deletedReminderSchema);

export default DeletedReminder;
