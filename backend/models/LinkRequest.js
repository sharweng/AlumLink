import mongoose from "mongoose";

const linkRequestSchema = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    status: {
        type: String,
        enum: ["pending", "accepted", "rejected"],
        default: "pending",
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    },
}, { timestamps: true });

const LinkRequest = mongoose.model("LinkRequest", linkRequestSchema);

export default LinkRequest;