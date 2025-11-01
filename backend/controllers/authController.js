
import User from "../models/User.js";
import PendingUser from "../models/PendingUser.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { sendWelcomeEmail } from "../emails/nodemailerHandlers.js"; // for sandbox
import { transporter } from "../lib/nodemailer.js";
import { createVerificationEmailTemplate } from "../emails/emailTemplates.js";

// In-memory store for reset codes (for demo; use DB in production)
const passwordResetCodes = new Map(); // email -> { code, expires }

export const requestPasswordReset = async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "No account found with that email." });
    // Generate code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 min
    passwordResetCodes.set(email, { code, expires });
    // Send email
    try {
        if (process.env.NODE_ENV === 'production') {
            // Use SendGrid handler in production
            const { sendVerificationEmail } = await import("../emails/emailHandlers.js");
            await sendVerificationEmail(email, code);
        } else {
            await transporter.sendMail({
                from: process.env.NODEMAILER_EMAIL_FROM,
                to: email,
                subject: "AlumniLink Password Reset Code",
                html: createVerificationEmailTemplate(code),
            });
        }
    } catch (err) {
        return res.status(500).json({ message: "Failed to send reset code email." });
    }
    res.json({ message: "Password reset code sent to your email." });
};

export const verifyResetCode = async (req, res) => {
    const { email, code } = req.body;
    if (!email || !code) return res.status(400).json({ message: "Email and code are required" });
    const entry = passwordResetCodes.get(email);
    if (!entry || entry.code !== code) return res.status(400).json({ message: "Invalid or expired code." });
    if (entry.expires < new Date()) {
        passwordResetCodes.delete(email);
        return res.status(400).json({ message: "Code expired. Please request a new one." });
    }
    res.json({ message: "Code verified. You may reset your password." });
};

export const resetPassword = async (req, res) => {
    const { email, code, newPassword } = req.body;
    if (!email || !code || !newPassword) return res.status(400).json({ message: "All fields are required" });
    const entry = passwordResetCodes.get(email);
    if (!entry || entry.code !== code) return res.status(400).json({ message: "Invalid or expired code." });
    if (entry.expires < new Date()) {
        passwordResetCodes.delete(email);
        return res.status(400).json({ message: "Code expired. Please request a new one." });
    }
    if (newPassword.length < 6) return res.status(400).json({ message: "Password must be at least 6 characters" });
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "No account found with that email." });
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();
    passwordResetCodes.delete(email);
    res.json({ message: "Password reset successful. You can now log in." });
};


export const signup = async (req, res) => {
    try {
        // PATCH: Only do duplicate checks and return if resend is true (pre-check, don't create/update PendingUser)
        if (req.body.resend) {
            const { email, username, tuptId } = req.body;
            const errors = {};
            if (await User.findOne({ email })) errors.email = "Email already in use";
            if (await User.findOne({ username })) errors.username = "Username already in use";
            if (await User.findOne({ tuptId })) errors.tuptId = "TUPT-ID already in use";
            if (Object.keys(errors).length > 0) {
                return res.status(400).json({ message: Object.values(errors)[0] });
            }
            // No errors, just return success
            return res.json({ message: "OK" });
        }

        const { name, username, email, password, confirmPassword, batch, course, tuptId } = req.body;
        if(!name || !username || !email || !password || !confirmPassword || !batch || !course || !tuptId) {
            return res.status(400).json({ message: "All fields are required" });
        }
        if(password.length < 6) {
            return res.status(400).json({ message: "Password must be at least 6 characters" });
        }
        if(password !== confirmPassword) {
            return res.status(400).json({ message: "Passwords do not match" });
        }
        const existingEmail = await User.findOne({ email });
        if (existingEmail) {
            return res.status(400).json({ message: "Email already in use" });
        }
        const existingUsername = await User.findOne({ username });
        if (existingUsername) {
            return res.status(400).json({ message: "Username already in use" });
        }
        const existingTuptId = await User.findOne({ tuptId });
        if (existingTuptId) {
            return res.status(400).json({ message: "TUPT-ID already in use" });
        }
        // Check for pending user with same email/username/tuptId
        let pendingUser = await PendingUser.findOne({ email });
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        let headline = "AlumniLink User";
        if (batch && course) {
            headline = `Batch ${batch}, ${course}`;
        }
        // Generate verification code
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        const codeExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry
        if (pendingUser) {
            // Update code and expiry, and other info
            pendingUser.name = name;
            pendingUser.username = username;
            pendingUser.password = hashedPassword;
            pendingUser.batch = batch;
            pendingUser.course = course;
            pendingUser.tuptId = tuptId;
            pendingUser.headline = headline;
            pendingUser.verificationCode = verificationCode;
            pendingUser.codeExpires = codeExpires;
            await pendingUser.save();
        } else {
            pendingUser = new PendingUser({
                name,
                username,
                email,
                password: hashedPassword,
                batch,
                course,
                tuptId,
                headline,
                verificationCode,
                codeExpires,
            });
            await pendingUser.save();
        }
        // Send verification email (use handler for template)
        try {
            const { sendVerificationEmail } = await import("../emails/nodemailerHandlers.js");
            await sendVerificationEmail(email, verificationCode);
        } catch (emailError) {
            console.error("Error sending verification email:", emailError);
        }
        res.status(201).json({ message: "Verification code sent to email. Please enter the code to complete registration." });
    } catch (error) {
        console.log("Error in signup authController:", error.message)
        res.status(500).json({ message: "Internal server error" })
    }
}

export const verifySignupCode = async (req, res) => {
    try {
        const { email, code } = req.body;
        const pendingUser = await PendingUser.findOne({ email });
        if (!pendingUser) {
            return res.status(400).json({ message: "No pending registration for this email." });
        }
        if (pendingUser.verificationCode !== code) {
            return res.status(400).json({ message: "Invalid verification code." });
        }
        if (pendingUser.codeExpires < new Date()) {
            await PendingUser.deleteOne({ email });
            return res.status(400).json({ message: "Verification code expired. Please sign up again." });
        }
        // Create user
        const { name, username, email: userEmail, password, batch, course, tuptId, headline } = pendingUser;
        const newUser = new User({ name, username, email: userEmail, password, batch, course, tuptId, headline });
        await newUser.save();
        await PendingUser.deleteOne({ email });
        // Send welcome email
        const profileUrl = process.env.CLIENT_URL + "/profile/" + newUser.username;
        try {
            await sendWelcomeEmail(newUser.email, newUser.name, profileUrl);
        } catch (emailError) {
            console.error("Error sending welcome email:", emailError);
        }
        const token = jwt.sign({ userId: newUser._id }, process.env.JWT_SECRET, { expiresIn: "3d" });
        res.cookie("jwt-alumnilink", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
            maxAge: 3 * 24 * 60 * 60 * 1000,
        });
        res.status(201).json({ message: "User registered and verified successfully", newUser: { _id: newUser._id, name: newUser.name, email: newUser.email } });
    } catch (error) {
        console.log("Error in verifySignupCode:", error.message)
        res.status(500).json({ message: "Internal server error" })
    }
}
export const login = async (req, res) => {
    try {
        const { identifier, password } = req.body;
        if (!identifier || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }
        // Check if identifier is an email
        let user;
        if (/^\S+@\S+\.\S+$/.test(identifier)) {
            user = await User.findOne({ email: identifier });
        } else {
            user = await User.findOne({ username: identifier });
        }
        if (!user) {
            return res.status(400).json({ message: "Invalid credentials" });
        }
        // Check if user is banned
        if (user.banned) {
            return res.status(403).json({ message: "Your account has been banned." });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid credentials" });
        }
        // Check if user is deactivated
        if (!user.isActive) {
            return res.status(403).json({ message: "Your account has been deactivated. Please contact an administrator." });
        }
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "3d" });
        await res.cookie("jwt-alumnilink", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax", // lax for development
            maxAge: 3 * 24 * 60 * 60 * 1000,
        });
        res.json({ 
            message: "Logged in successfully", 
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                permission: user.permission
            }
        });
    } catch (error) {
        console.log("Error in login authController:", error.message)
        res.status(500).json({ message: "Internal server error" })
    }
}

export const logout = (req, res) => {
    res.clearCookie("jwt-alumnilink")
    res.json({ message: "Logged out successfully" })
}

export const getCurrentUser = async (req, res) => {
    try { 
        if (req.user.banned) {
            res.clearCookie("jwt-alumnilink");
            return res.status(403).json({ message: "Your account has been banned. You have been logged out." });
        }
        res.json(req.user);
    } catch (error) {
        console.log("Error in getCurrentUser authController:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const getSocketToken = async (req, res) => {
    try {
        if (req.user.banned) {
            res.clearCookie("jwt-alumnilink");
            return res.status(403).json({ message: "Your account has been banned. You have been logged out." });
        }
        // Generate a token for Socket.IO authentication
        const token = jwt.sign({ userId: req.user._id }, process.env.JWT_SECRET, { expiresIn: "3d" });
        res.json({ token });
    } catch (error) {
        console.log("Error in getSocketToken:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const verifyPassword = async (req, res) => {
    try {
        const { password } = req.body;
        
        if (!password) {
            return res.status(400).json({ message: "Password is required" });
        }

        // Get the authenticated user's full data including password
        const user = await User.findById(req.user._id);
        
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Verify the password
        const isMatch = await bcrypt.compare(password, user.password);
        
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid password" });
        }

        res.json({ message: "Password verified successfully" });
    } catch (error) {
        console.log("Error in verifyPassword:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};
