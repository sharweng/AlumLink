import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
// import { sendWelcomeEmail } from "../emails/emailHandlers.js"; // for production
import { sendWelcomeEmail } from "../emails/nodemailerHandlers.js"; // for sandbox

export const signup = async (req, res) => {
    try {
        const { name, username, email, password, confirmPassword, batch, course } = req.body;

        if(!name || !username || !email || !password || !confirmPassword || !batch || !course) {
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
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Generate headline from batch and course
        let headline = "AlumniLink User";
        if (batch && course) {
            headline = `${batch} Graduate, ${course}`;
        }

        const newUser = new User({
            name,
            username,
            email,
            password: hashedPassword,
            batch,
            course,
            headline,
        });

        await newUser.save();

        const token = jwt.sign({ userId: newUser._id }, process.env.JWT_SECRET, { expiresIn: "3d" });

        res.cookie("jwt-alumnilink", token, {
            httpOnly: true, // prevents XSS attacks
            secure: process.env.NODE_ENV === "production", // prevents man-in-the-middle attacks
            sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax", // lax for development
            maxAge: 3 * 24 * 60 * 60 * 1000, // 3 days
        });

        res.status(201).json({ message: "User registered successfully" ,  newUser: {
            _id: newUser._id,
            name: newUser.name,
            email: newUser.email
        }});

        // todo: send welcome email
        const profileUrl = process.env.CLIENT_URL + "/profile/" + newUser.username;

        try {
            await sendWelcomeEmail(newUser.email, newUser.name, profileUrl);
        } catch (emailError) {
            console.error("Error sending welcome email:", emailError);
        }

    } catch (error) {
        console.log("Error in signup authController:", error.message)
        res.status(500).json({ message: "Internal server error" })
    }
}

export const login = async (req, res) => {
    try {
        const { username, password } = req.body;

        if(!username || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const user = await User.findOne({ username });
        if (!user) {
            return res.status(400).json({ message: "Invalid credentials" });
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
                isSuperAdmin: user.isSuperAdmin
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
        res.json(req.user);
    } catch (error) {
        console.log("Error in getCurrentUser authController:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const getSocketToken = async (req, res) => {
    try {
        // Generate a token for Socket.IO authentication
        const token = jwt.sign({ userId: req.user._id }, process.env.JWT_SECRET, { expiresIn: "3d" });
        res.json({ token });
    } catch (error) {
        console.log("Error in getSocketToken:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
}
