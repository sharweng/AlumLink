import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    username: {
        type: String,
        required: true,
        unique: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    profilePicture: {
        type: String,
        default: "",
    },
    bannerImg: {
        type: String,
        default: "",
    },
    headline: {
        type: String,
        default: "AlumniLink User",
    },
    location: {
        type: String,
        default: "Philippines",
    },
    about: {
        type: String,
        default: "This is my bio",
    },
    skills: [String],
    experience: [{
            title: String,
            company: String,
            startDate: Date,
            endDate: Date,
            description: String,
        },
    ],
    batch: {
        type: Number,
        required: true,
    },
    course: {
        type: String,
        required: true,
    },
    links: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    }],
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user',
    },
    isSuperAdmin: {
        type: Boolean,
        default: false,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    // Mentorship fields
    isMentor: {
        type: Boolean,
        default: false,
    },
    mentorBio: {
        type: String,
        default: "",
    },
    mentorExpertise: [String],
    mentorAvailability: {
        type: String,
        default: "",
    },
    maxMentees: {
        type: Number,
        default: 5,
    },
}, { timestamps: true });

const User = mongoose.model("User", userSchema);

export default User;