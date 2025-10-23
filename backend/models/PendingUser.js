import mongoose from "mongoose";

const pendingUserSchema = new mongoose.Schema({
    name: String,
    username: String,
    email: String,
    password: String,
    batch: Number,
    course: String,
    tuptId: String,
    headline: String,
    verificationCode: String,
    codeExpires: Date,
}, { timestamps: true });

const PendingUser = mongoose.model("PendingUser", pendingUserSchema);

export default PendingUser;
