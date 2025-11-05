import Post from "../models/Post.js";
import JobPost from "../models/JobPost.js";
import bcrypt from "bcryptjs";
import { isExperienceRelatedToCourse } from "../lib/gemini.js";
import { sendAccountCredentialsEmail } from "../emails/nodemailerHandlers.js";
// Admin: Get all posts (including banned)
export const getAllPostsAdmin = async (req, res) => {
    try {
        if (!['admin', 'superAdmin'].includes(req.user.permission)) {
            return res.status(403).json({ message: "Access denied. Admins only." });
        }
        const posts = await Post.find().sort({ createdAt: -1 });
        res.status(200).json(posts);
    } catch (error) {
        console.log("Error in getAllPostsAdmin:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Admin: Get all jobs (including banned)
export const getAllJobsAdmin = async (req, res) => {
    try {
        if (!['admin', 'superAdmin'].includes(req.user.permission)) {
            return res.status(403).json({ message: "Access denied. Admins only." });
        }
        const jobs = await JobPost.find().sort({ createdAt: -1 });
        res.status(200).json(jobs);
    } catch (error) {
        console.log("Error in getAllJobsAdmin:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};
import User from "../models/User.js";

// Get all users (admin only)
export const getAllUsers = async (req, res) => {
    try {
        // Check if requester is admin
        if (!['admin', 'superAdmin'].includes(req.user.permission)) {
            return res.status(403).json({ message: "Access denied. Admins only." });
        }

        const users = await User.find()
            .select('-password')
            .sort({ createdAt: -1 });

        res.status(200).json(users);
    } catch (error) {
        console.log("Error in getAllUsers adminController:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Update user role (admin only)
export const updateUserRole = async (req, res) => {
    try {
        const { userId } = req.params;
        const { role } = req.body;

        // Check if requester is admin
        if (!['admin', 'superAdmin'].includes(req.user.permission)) {
            return res.status(403).json({ message: "Access denied. Admins only." });
        }

        // Validate role
        if (!['user', 'admin'].includes(role)) {
            return res.status(400).json({ message: "Invalid role. Must be 'user' or 'admin'." });
        }

        // Prevent admin from changing their own role
        if (userId === req.user._id.toString()) {
            return res.status(400).json({ message: "You cannot change your own role." });
        }

        // Check if target user is a super admin
        const targetUser = await User.findById(userId);
        if (!targetUser) {
            return res.status(404).json({ message: "User not found" });
        }

        // Prevent regular admins from changing super admin permissions
        if (targetUser.permission === 'superAdmin' && req.user.permission !== 'superAdmin') {
            return res.status(403).json({ message: "Only super admins can modify super admin permissions." });
        }

        const user = await User.findByIdAndUpdate(
            userId,
            { role },
            { new: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({ 
            message: `User role updated to ${role}`, 
            user 
        });
    } catch (error) {
        console.log("Error in updateUserRole adminController:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Update user permission (admin only)
export const updateUserPermission = async (req, res) => {
    try {
        const { userId } = req.params;
        const { permission } = req.body;

        // Check if requester is admin
        if (!['admin', 'superAdmin'].includes(req.user.permission)) {
            return res.status(403).json({ message: "Access denied. Admins only." });
        }

        // Validate permission
        if (!['regular', 'admin', 'superAdmin'].includes(permission)) {
            return res.status(400).json({ message: "Invalid permission. Must be 'regular', 'admin', or 'superAdmin'." });
        }

        // Prevent admin from changing their own permission
        if (userId === req.user._id.toString()) {
            return res.status(400).json({ message: "You cannot change your own permission." });
        }

        // Check if target user exists
        const targetUser = await User.findById(userId);
        if (!targetUser) {
            return res.status(404).json({ message: "User not found" });
        }

        // Prevent regular admins from changing super admin permissions
        if (targetUser.permission === 'superAdmin' && req.user.permission !== 'superAdmin') {
            return res.status(403).json({ message: "Only super admins can modify super admin permissions." });
        }

        // If trying to set someone to superAdmin, only superAdmin can do this
        if (permission === 'superAdmin' && req.user.permission !== 'superAdmin') {
            return res.status(403).json({ message: "Only super admins can promote users to superAdmin." });
        }

        const user = await User.findByIdAndUpdate(
            userId,
            { permission },
            { new: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({ 
            message: `User permission updated to ${permission}`, 
            user
        });
    } catch (error) {
        console.log("Error in updateUserPermission adminController:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Toggle user active status (admin only)
export const toggleUserStatus = async (req, res) => {
    try {
        const { userId } = req.params;

        // Check if requester is admin
        if (!['admin', 'superAdmin'].includes(req.user.permission)) {
            return res.status(403).json({ message: "Access denied. Admins only." });
        }

        // Prevent admin from deactivating themselves
        if (userId === req.user._id.toString()) {
            return res.status(400).json({ message: "You cannot deactivate yourself." });
        }

        // Check if target user is a super admin
        const targetUser = await User.findById(userId);
        if (!targetUser) {
            return res.status(404).json({ message: "User not found" });
        }

        // Prevent regular admins from deactivating super admins
        if (targetUser.permission === 'superAdmin' && req.user.permission !== 'superAdmin') {
            return res.status(403).json({ message: "Only super admins can deactivate super admins." });
        }

        const user = await User.findByIdAndUpdate(
            userId,
            { isActive: !targetUser.isActive },
            { new: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({ 
            message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`, 
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                isActive: user.isActive
            }
        });
    } catch (error) {
        console.log("Error in toggleUserStatus adminController:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Get dashboard statistics (admin only)
export const getDashboardStats = async (req, res) => {
    try {
        // Check if requester is admin
        if (!['admin', 'superAdmin'].includes(req.user.permission)) {
            return res.status(403).json({ message: "Access denied. Admins only." });
        }

        const totalUsers = await User.countDocuments();
        const activeUsers = await User.countDocuments({ isActive: true });
        const inactiveUsers = await User.countDocuments({ isActive: false });
        const adminUsers = await User.countDocuments({ role: 'admin' });
        const regularUsers = await User.countDocuments({ role: 'user' });

        // Get recent users (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const recentUsers = await User.countDocuments({ 
            createdAt: { $gte: sevenDaysAgo } 
        });

        res.status(200).json({
            totalUsers,
            activeUsers,
            inactiveUsers,
            adminUsers,
            regularUsers,
            recentUsers
        });
    } catch (error) {
        console.log("Error in getDashboardStats adminController:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Ban a user (admin only)
export const banUser = async (req, res) => {
    try {
        if (!['admin', 'superAdmin'].includes(req.user.permission)) {
            return res.status(403).json({ message: "Access denied. Admins only." });
        }
        const { userId } = req.params;
        const { reason } = req.body;
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        if (user.banned) {
            return res.status(400).json({ message: "User is already banned." });
        }
        user.banned = true;
        user.bannedReason = reason || "";
        await user.save();
        
        // Return updated user data
        const updatedUser = await User.findById(userId).select('-password');
        res.status(200).json({ message: "User banned successfully.", user: updatedUser });
    } catch (error) {
        console.log("Error in banUser adminController:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Unban a user (admin only)
export const unbanUser = async (req, res) => {
    try {
        if (!['admin', 'superAdmin'].includes(req.user.permission)) {
            return res.status(403).json({ message: "Access denied. Admins only." });
        }
        const { userId } = req.params;
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        if (!user.banned) {
            return res.status(400).json({ message: "User is not banned." });
        }
        user.banned = false;
        user.bannedReason = "";
        await user.save();
        
        // Return updated user data
        const updatedUser = await User.findById(userId).select('-password');
        res.status(200).json({ message: "User unbanned successfully.", user: updatedUser });
    } catch (error) {
        console.log("Error in unbanUser adminController:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Import users from CSV (admin only)
export const importUsers = async (req, res) => {
    try {
        if (req.user.permission !== 'superAdmin') {
            return res.status(403).json({ message: "Access denied. Super admins only." });
        }

        const { users } = req.body;
        
        if (!users || !Array.isArray(users) || users.length === 0) {
            return res.status(400).json({ message: "No users data provided" });
        }

        const results = {
            created: [],
            updated: [],
            errors: []
        };

        // For staff imports, find the highest TUPT-AS-XXXX number
        let maxStaffNumber = 0;
        if (users.some(u => u.role === 'staff')) {
            const staffUsers = await User.find({ tuptId: /^TUPT-AS-/i }).select('tuptId');
            staffUsers.forEach(user => {
                const match = user.tuptId.match(/TUPT-AS-(\d+)/i);
                if (match) {
                    const num = parseInt(match[1]);
                    if (num > maxStaffNumber) maxStaffNumber = num;
                }
            });
        }

        for (const userData of users) {
            try {
                let { fullname, tuptId, email, course, experienceTitle, experienceCompany, experienceStartDate, experienceEndDate, role } = userData;

                // Validate required fields based on role
                if (role === 'staff') {
                    // Staff only requires fullname and email
                    if (!fullname || !email) {
                        results.errors.push({ 
                            fullname, 
                            email, 
                            error: "Missing required fields (fullname or email) for staff" 
                        });
                        continue;
                    }
                    // Auto-generate TUPT-ID for staff
                    maxStaffNumber++;
                    tuptId = `TUPT-AS-${String(maxStaffNumber).padStart(4, '0')}`;
                } else {
                    // Students and alumni require tuptId
                    if (!fullname || !tuptId || !email) {
                        results.errors.push({ 
                            fullname, 
                            tuptId, 
                            email, 
                            error: "Missing required fields (fullname, tuptId, or email)" 
                        });
                        continue;
                    }
                }

                // Handle comma-separated names (Last, First Middle -> First Middle Last)
                if (fullname.includes(',')) {
                    const parts = fullname.split(',').map(p => p.trim());
                    if (parts.length === 2) {
                        // parts[0] is last name, parts[1] is first and middle names
                        fullname = `${parts[1]} ${parts[0]}`;
                    }
                }

                // Extract batch from TUPT-ID (e.g., TUPT-20-0563 -> 2020)
                // For staff (TUPT-AS-XXXX), batch is the year the account was created
                let batch = new Date().getFullYear(); // Default to current year
                if (role !== 'staff') {
                    const tuptIdMatch = tuptId.match(/TUPT-(\d{2})-/i);
                    if (tuptIdMatch) {
                        const yearPrefix = parseInt(tuptIdMatch[1]);
                        // Assume 20XX for years 00-99
                        batch = 2000 + yearPrefix;
                    }
                }
                // For staff, batch is already set to current year above

                // Extract last 4 digits from TUPT-ID
                const last4Match = tuptId.match(/(\d{4})$/);
                const last4Digits = last4Match ? last4Match[1] : '0000';

                // Generate username from fullname
                // Example: Sharwin John Marbella -> sjmarbella
                const nameParts = fullname.trim().split(/\s+/);
                const lastName = nameParts[nameParts.length - 1].toLowerCase();
                const initials = nameParts.slice(0, -1).map(part => part.charAt(0).toLowerCase()).join('');
                const username = initials + lastName;

                // Generate password: lastname + last4digits
                // Example: marbella1119 or reyes0895
                const password = lastName + last4Digits;

                // Check if user exists by tuptId or email (lowercase email for comparison)
                let existingUser = await User.findOne({ 
                    $or: [{ tuptId }, { email: email.toLowerCase() }] 
                });

                if (existingUser) {
                    // For existing users, ONLY update experience fields
                    // Do not update any other fields (name, email, course, role, etc.)
                    let experienceChanged = false;

                    // Update or replace experience if provided
                    if (experienceTitle && experienceCompany && experienceStartDate && experienceEndDate) {
                        // If all experience fields are provided, replace the entire experience array
                        const experienceEntry = {
                            title: experienceTitle,
                            company: experienceCompany,
                            startDate: new Date(experienceStartDate),
                            endDate: new Date(experienceEndDate)
                        };

                        // Use Gemini AI to check if experience is related to course
                        try {
                            const isRelated = await isExperienceRelatedToCourse(
                                experienceTitle, 
                                experienceCompany, 
                                existingUser.course || course
                            );
                            experienceEntry.isRelatedToCourse = isRelated;
                        } catch (error) {
                            console.log("Error checking experience relevance:", error.message);
                            // If AI fails, set to undefined (will use keyword matching on frontend)
                            experienceEntry.isRelatedToCourse = undefined;
                        }

                        // Check if experience is different
                        const currentExp = existingUser.experience && existingUser.experience[0];
                        if (!currentExp || 
                            currentExp.title !== experienceTitle ||
                            currentExp.company !== experienceCompany ||
                            currentExp.startDate?.getTime() !== new Date(experienceStartDate).getTime() ||
                            currentExp.endDate?.getTime() !== new Date(experienceEndDate).getTime()) {
                            // Replace existing experience with new one
                            existingUser.experience = [experienceEntry];
                            experienceChanged = true;
                        }
                    }

                    // Only save if experience changed
                    if (experienceChanged) {
                        await existingUser.save();
                        results.updated.push({ 
                            username: existingUser.username, 
                            email: existingUser.email, 
                            name: existingUser.name 
                        });
                    }
                    // If no experience changes, don't save or count as updated
                } else {
                    // Check if username already exists, if so, add a number
                    let finalUsername = username;
                    let counter = 1;
                    while (await User.findOne({ username: finalUsername })) {
                        finalUsername = `${username}${counter}`;
                        counter++;
                    }

                    // Create new user
                    const salt = await bcrypt.genSalt(10);
                    const hashedPassword = await bcrypt.hash(password, salt);

                    const experience = [];
                    if (experienceTitle || experienceCompany) {
                        const experienceEntry = {};
                        if (experienceTitle) experienceEntry.title = experienceTitle;
                        if (experienceCompany) experienceEntry.company = experienceCompany;
                        if (experienceStartDate) experienceEntry.startDate = new Date(experienceStartDate);
                        if (experienceEndDate) experienceEntry.endDate = new Date(experienceEndDate);
                        
                        // Use Gemini AI to check if experience is related to course
                        if (experienceTitle && experienceCompany && course) {
                            try {
                                const isRelated = await isExperienceRelatedToCourse(
                                    experienceTitle, 
                                    experienceCompany, 
                                    course
                                );
                                experienceEntry.isRelatedToCourse = isRelated;
                            } catch (error) {
                                console.log("Error checking experience relevance:", error.message);
                                // If AI fails, set to undefined (will use keyword matching on frontend)
                                experienceEntry.isRelatedToCourse = undefined;
                            }
                        }
                        
                        experience.push(experienceEntry);
                    }

                    // Determine headline based on role
                    let headline = "AlumniLink User";
                    if (course) {
                        if (role === 'student') {
                            headline = `Student, ${course}`;
                        } else if (role === 'alumni') {
                            headline = `Alumni, ${course}`;
                        } else if (role === 'staff') {
                            // For staff, course field contains department
                            headline = `Staff, ${course}`;
                        }
                    } else if (role === 'staff') {
                        headline = "Staff";
                    }

                    const newUser = new User({
                        name: fullname,
                        username: finalUsername,
                        email: email.toLowerCase(),
                        password: hashedPassword,
                        tuptId: tuptId,
                        course: course || "Not Specified",
                        batch: batch, // Set to current year for staff, extracted year for students/alumni
                        headline: headline,
                        experience: experience.length > 0 ? experience : undefined,
                        role: role || "student"
                    });

                    await newUser.save();
                    results.created.push({ 
                        username: finalUsername, 
                        email: email, 
                        name: fullname,
                        tempPassword: password 
                    });
                }
            } catch (error) {
                console.log("Error processing user:", error.message);
                results.errors.push({ 
                    fullname: userData.fullname, 
                    tuptId: userData.tuptId, 
                    email: userData.email, 
                    error: error.message 
                });
            }
        }

        res.status(200).json({
            message: "Import completed",
            results
        });
    } catch (error) {
        console.log("Error in importUsers adminController:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Delete a user (superAdmin only)
export const deleteUser = async (req, res) => {
    try {
        if (req.user.permission !== 'superAdmin') {
            return res.status(403).json({ message: "Access denied. Super admins only." });
        }

        const { userId } = req.params;

        // Prevent super admin from deleting themselves
        if (userId === req.user._id.toString()) {
            return res.status(400).json({ message: "You cannot delete yourself." });
        }

        const user = await User.findByIdAndDelete(userId);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({ 
            message: `User ${user.name} deleted successfully`
        });
    } catch (error) {
        console.log("Error in deleteUser adminController:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Send credentials email to selected users
export const sendCredentialsEmails = async (req, res) => {
    try {
        // Check if requester is admin
        if (!['admin', 'superAdmin'].includes(req.user.permission)) {
            return res.status(403).json({ message: "Access denied. Admins only." });
        }

        const { userIds } = req.body;

        if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
            return res.status(400).json({ message: "User IDs are required" });
        }

        const users = await User.find({ _id: { $in: userIds } });

        if (users.length === 0) {
            return res.status(404).json({ message: "No users found" });
        }

        const loginUrl = `${process.env.CLIENT_URL}/login`;
        let successCount = 0;
        let errorCount = 0;
        const errors = [];

        for (const user of users) {
            try {
                // Generate password: last word of full name + last 4 digits of TUPT-ID (lowercase)
                const nameParts = user.name.trim().split(' ');
                const lastName = nameParts[nameParts.length - 1].toLowerCase();
                const tuptIdLast4 = user.tuptId ? user.tuptId.slice(-4) : '0000';
                const generatedPassword = `${lastName}${tuptIdLast4}`;

                await sendAccountCredentialsEmail(
                    user.email,
                    user.name,
                    user.username,
                    user.email,
                    generatedPassword,
                    loginUrl
                );
                successCount++;
            } catch (error) {
                console.error(`Failed to send email to ${user.email}:`, error);
                errorCount++;
                errors.push({ userId: user._id, email: user.email, error: error.message });
            }
        }

        res.status(200).json({
            message: `Emails sent: ${successCount} successful, ${errorCount} failed`,
            successCount,
            errorCount,
            errors: errorCount > 0 ? errors : undefined
        });
    } catch (error) {
        console.log("Error in sendCredentialsEmails:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};
