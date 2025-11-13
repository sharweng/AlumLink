

import mongoose from "mongoose";

const eventSchema = new mongoose.Schema({
    organizer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    title: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        required: true,
    },
    type: {
        type: String,
        enum: ['Reunion', 'Webinar', 'Workshop'],
        required: true,
    },
    eventDate: { type: String, required: true },
    eventTime: { type: String, required: true },
    eventDuration: { type: Number, default: 2 },
    location: { type: String, required: true },
    isVirtual: {
        type: Boolean,
        default: false,
    },
    virtualLink: {
        type: String,
    },
    images: [{
        type: String
    }],
    capacity: {
        type: Number,
        default: 0,
    },
    requiresTicket: {
        type: Boolean,
        default: false,
    },
    ticketPrice: {
        type: Number,
        default: 0,
    },
    attendees: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        rsvpStatus: {
            type: String,
            enum: ['going', 'interested', 'not_going'],
            default: 'going'
        },
        ticketId: {
            type: String,
        },
        rsvpDate: {
            type: Date,
            default: Date.now
        },
        reminderEnabled: {
            type: Boolean,
            default: false
        }
    }],
    tags: [{
        type: String,
        trim: true,
    }],
    status: {
        type: String,
        enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
        default: 'upcoming',
    },
    isPinned: {
        type: Boolean,
        default: false,
    },
    shareCount: { type: Number, default: 0 },
    editedAt: {
        type: Date
    },
    banned: { type: Boolean, default: false },
    cancelReason: {
        type: String,
        default: '',
    },
}, { timestamps: true });

const Event = mongoose.model("Event", eventSchema);

export default Event;
