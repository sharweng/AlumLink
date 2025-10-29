import Post from "../models/Post.js";
import JobPost from "../models/JobPost.js";
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
        res.status(200).json({ message: "User banned successfully." });
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
        res.status(200).json({ message: "User unbanned successfully." });
    } catch (error) {
        console.log("Error in unbanUser adminController:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};
