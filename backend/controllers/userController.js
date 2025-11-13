export const updateUserById = async (req, res) => {
    try {
        const { id } = req.params;
        const allowedFields = [
            "name", "username", "email", "headline", "about", "location", "profilePicture", "bannerImg", "skills", "experience", "linksVisibility", "role", "isActive", "banned", "bannedReason", "batch", "course", "tuptId"
        ];
        const updatedData = {};
        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                updatedData[field] = req.body[field];
            }
        }

        // Password change logic
        if (req.body.currentPassword || req.body.newPassword || req.body.confirmNewPassword) {
            if (!req.body.currentPassword || !req.body.newPassword || !req.body.confirmNewPassword) {
                return res.status(400).json({ message: "All password fields are required" });
            }
            if (req.body.newPassword.length < 6) {
                return res.status(400).json({ message: "New password must be at least 6 characters" });
            }
            if (req.body.newPassword !== req.body.confirmNewPassword) {
                return res.status(400).json({ message: "New passwords do not match" });
            }
            const user = await User.findById(id);
            if (!user) return res.status(404).json({ message: "User not found" });
            const bcrypt = await import('bcryptjs');
            const isMatch = await bcrypt.compare(req.body.currentPassword, user.password);
            if (!isMatch) {
                return res.status(400).json({ message: "Current password is incorrect" });
            }
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(req.body.newPassword, salt);
            updatedData.password = hashedPassword;
        }

        const user = await User.findByIdAndUpdate(id, { $set: updatedData }, { new: true }).select("-password");
        if (!user) return res.status(404).json({ message: "User not found" });
        res.json(user);
    } catch (error) {
        console.log("Error in updateUserById userController:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};
import cloudinary from "../lib/cloudinary.js"
import User from "../models/User.js"
import { uploadFileToR2, deleteFileFromR2 } from "../lib/r2.js"

export const getSuggestedLinks = async (req, res) => {
    try {
        const currentUser = await User.findById(req.user._id).select("links")

        // find users who are not already linked, not banned, and also not suggest the current user
        const suggestedUsers = await User.find({
            _id: { $ne: req.user._id, $nin: currentUser.links },
            banned: { $ne: true },
            permission: { $ne: 'superAdmin' }
        }).select("name username profilePicture headline batch course banned").limit(5)

        res.json(suggestedUsers)
    } catch (error) {
        console.log("Error in getSuggestedLinks userController:", error.message)
        res.status(500).json({ message: "Internal server error" })
    }
}

export const getPublicProfile = async (req, res) => {
    try {
        const { username } = req.params;
        const user = await User.findOne({ username }).select("-password");

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json(user);
    } catch (error) {
        console.log("Error in getPublicProfile userController:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }   
}

export const updateProfile = async (req, res) => {
    try {
        const allowedFields = [
            "username",
            "headline", 
            "about", 
            "location", 
            "profilePicture", 
            "bannerImg", 
            "skills", 
            "experience",
            "linksVisibility"
        ];

        const updatedData = {};

        for (const field of allowedFields) {
            if(req.body[field]){
                updatedData[field] = req.body[field];
            }
        }

        if (req.body.profilePicture) {
            const result = await cloudinary.uploader.upload(req.body.profilePicture)
            updatedData.profilePicture = result.secure_url;
        }

        if (req.body.bannerImg) {
            const result = await cloudinary.uploader.upload(req.body.bannerImg)
            updatedData.bannerImg = result.secure_url;
        }

        // If experience is being updated and user is an alumni, check work relevance with AI
        if (req.body.experience && req.user.role === 'alumni' && req.user.course) {
            const { isExperienceRelatedToCourse } = await import('../lib/gemini.js');
            
            // Process each experience entry
            for (const exp of req.body.experience) {
                // Only check if not already determined
                if (exp.isRelatedToCourse === undefined && exp.title && exp.company) {
                    try {
                        const isRelated = await isExperienceRelatedToCourse(
                            exp.title,
                            exp.company,
                            req.user.course
                        );
                        exp.isRelatedToCourse = isRelated;
                    } catch (error) {
                        console.log("Error checking experience relevance:", error.message);
                        // Leave isRelatedToCourse undefined if check fails
                        exp.isRelatedToCourse = undefined;
                    }
                }
            }
        }

        const user = await User.findByIdAndUpdate(
            req.user._id, 
            { $set: updatedData }, 
            { new: true }
        ).select("-password");

        res.json(user);
    } catch (error) {
        console.log("Error in updateProfile userController:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const toggleMentorStatus = async (req, res) => {
    try {
        const { isMentor, mentorBio, mentorExpertise, mentorAvailability, maxMentees } = req.body;
        
        const updateData = { isMentor };
        
        if (isMentor) {
            // If becoming a mentor, require bio and expertise
            if (!mentorBio || !mentorExpertise || mentorExpertise.length === 0) {
                return res.status(400).json({ message: "Mentor bio and expertise are required" });
            }
            updateData.mentorBio = mentorBio;
            updateData.mentorExpertise = mentorExpertise;
            updateData.mentorAvailability = mentorAvailability || "";
            updateData.maxMentees = maxMentees || 5;
        }
        
        const user = await User.findByIdAndUpdate(
            req.user._id,
            { $set: updateData },
            { new: true }
        ).select("-password");
        
        res.json(user);
    } catch (error) {
        console.log("Error in toggleMentorStatus userController:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const uploadCV = async (req, res) => {
    try {
        const { fileData, fileName, mimeType } = req.body;
        
        // Validate file type (only PDF and DOCX allowed)
        const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        if (!allowedTypes.includes(mimeType)) {
            return res.status(400).json({ message: "Only PDF and DOCX files are allowed" });
        }

        // Check file size (max 5MB)
        const base64Data = fileData.replace(/^data:.+;base64,/, "");
        const buffer = Buffer.from(base64Data, "base64");
        const fileSizeInMB = buffer.length / (1024 * 1024);
        
        if (fileSizeInMB > 5) {
            return res.status(400).json({ message: "File size must be less than 5MB" });
        }

        const user = await User.findById(req.user._id);

        // Delete old CV if exists
        if (user.cvKey) {
            try {
                await deleteFileFromR2(user.cvKey);
            } catch (error) {
                console.log("Error deleting old CV from R2:", error.message);
            }
        }

        // Upload new CV to R2
        const fileExtension = fileName.split(".").pop();
        const uniqueFileName = `cv_${req.user._id}_${Date.now()}.${fileExtension}`;
        
        const { url, key } = await uploadFileToR2(fileData, uniqueFileName, mimeType, 'cvs');

        // Update user with CV info
        user.cvUrl = url;
        user.cvKey = key;
        user.cvFileName = fileName;
        await user.save();

        res.json({
            message: "CV uploaded successfully",
            cvUrl: url,
            cvFileName: fileName
        });
    } catch (error) {
        console.log("Error in uploadCV userController:", error.message);
        res.status(500).json({ message: "Failed to upload CV" });
    }
}

export const deleteCV = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (!user.cvKey) {
            return res.status(404).json({ message: "No CV found" });
        }

        // Delete from R2
        try {
            await deleteFileFromR2(user.cvKey);
        } catch (error) {
            console.log("Error deleting CV from R2:", error.message);
        }

        // Update user
        user.cvUrl = "";
        user.cvKey = "";
        user.cvFileName = "";
        await user.save();

        res.json({ message: "CV deleted successfully" });
    } catch (error) {
        console.log("Error in deleteCV userController:", error.message);
        res.status(500).json({ message: "Failed to delete CV" });
    }
}