import JobPost from "../models/JobPost.js";
import Notification from "../models/Notification.js";
import ModerationLog from "../models/ModerationLog.js";

export const getAllJobPosts = async (req, res) => {
    try {
        const { type, location, workType, skills, company, page = 1, limit = 10 } = req.query;
        
        const filter = { isActive: true };
        
        // Apply filters
        if (type && type !== 'all') filter.type = type;
        if (location) filter.location = { $regex: location, $options: 'i' };
        if (workType && workType !== 'all') filter.workType = workType;
        if (company) filter.company = { $regex: company, $options: 'i' };
        if (skills) filter.skills = { $in: skills.split(',').map(skill => skill.trim()) };

        const jobPosts = await JobPost.find(filter)
            .populate("author", "name username profilePicture headline")
                .populate({ path: 'author', select: 'name avatar banned' })
            .where('author.banned').ne(true)
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await JobPost.countDocuments(filter);

        res.status(200).json({
            jobPosts,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total
        });
    } catch (error) {
        console.log("Error in getAllJobPosts:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getJobPostById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const jobPost = await JobPost.findById(id)
            .populate("author", "name username profilePicture headline")
                .populate({ path: 'author', select: 'name avatar banned' })
            .populate("applicants.user", "name username profilePicture headline");

        if (!jobPost) {
            return res.status(404).json({ message: "Job post not found" });
        }

        res.status(200).json(jobPost);
    } catch (error) {
        console.log("Error in getJobPostById:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const createJobPost = async (req, res) => {
    try {
        const {
            title,
            company,
            location,
            type,
            workType,
            description,
            requirements,
            skills,
            salary,
            duration,
            applicationDeadline,
            applicationUrl,
            applicationEmail
        } = req.body;

        if (!title || !company || !location || !description || !requirements) {
            return res.status(400).json({ message: "Please fill in all required fields" });
        }

        const newJobPost = new JobPost({
            author: req.user._id,
            title,
            company,
            location,
            type: type || 'job',
            workType: workType || 'onsite',
            description,
            requirements,
            skills: skills || [],
            salary,
            duration,
            applicationDeadline,
            applicationUrl,
            applicationEmail
        });

        await newJobPost.save();
        
        const populatedJobPost = await JobPost.findById(newJobPost._id)
            .populate("author", "name username profilePicture headline");

        res.status(201).json(populatedJobPost);
    } catch (error) {
        console.log("Error in createJobPost:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const updateJobPost = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const jobPost = await JobPost.findById(id);
        
        if (!jobPost) {
            return res.status(404).json({ message: "Job post not found" });
        }

        if (jobPost.author.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "You can only update your own job posts" });
        }

        const updatedJobPost = await JobPost.findByIdAndUpdate(
            id, 
            updateData, 
            { new: true }
        ).populate("author", "name username profilePicture headline");

        // Send notifications to all applicants
        if (jobPost.applicants && jobPost.applicants.length > 0) {
            const notifications = jobPost.applicants.map(applicant => {
                const applicantId = typeof applicant.user === 'object' ? applicant.user._id : applicant.user;
                
                return new Notification({
                    recipient: applicantId,
                    type: "jobUpdate",
                    relatedUser: req.user._id,
                    relatedJobPost: jobPost._id,
                });
            });

            await Notification.insertMany(notifications);
        }

        res.status(200).json(updatedJobPost);
    } catch (error) {
        console.log("Error in updateJobPost:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const deleteJobPost = async (req, res) => {
    try {
        const { id } = req.params;

        const jobPost = await JobPost.findById(id);
        
        if (!jobPost) {
            return res.status(404).json({ message: "Job post not found" });
        }

        if (jobPost.author.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "You can only delete your own job posts" });
        }

        await JobPost.findByIdAndDelete(id);
        res.status(200).json({ message: "Job post deleted successfully" });
    } catch (error) {
        console.log("Error in deleteJobPost:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const likeJobPost = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        const jobPost = await JobPost.findById(id);
        
        if (!jobPost) {
            return res.status(404).json({ message: "Job post not found" });
        }

        const isLiked = jobPost.likes.includes(userId);

        if (isLiked) {
            // Unlike the job post
            jobPost.likes = jobPost.likes.filter(like => like.toString() !== userId.toString());
        } else {
            // Like the job post
            jobPost.likes.push(userId);
            
            // Create notification if it's not the author liking their own post
            if (jobPost.author.toString() !== userId.toString()) {
                const newNotification = new Notification({
                    recipient: jobPost.author,
                    type: "like",
                    relatedUser: userId,
                    relatedJobPost: id
                });
                await newNotification.save();
            }
        }

        await jobPost.save();
        res.status(200).json(jobPost);
    } catch (error) {
        console.log("Error in likeJobPost:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const commentOnJobPost = async (req, res) => {
    try {
        const { id } = req.params;
        const { content } = req.body;
        const userId = req.user._id;

        if (!content) {
            return res.status(400).json({ message: "Comment content is required" });
        }

        const jobPost = await JobPost.findById(id);
        
        if (!jobPost) {
            return res.status(404).json({ message: "Job post not found" });
        }

        const newComment = {
            content,
            user: userId,
            createdAt: new Date()
        };

        jobPost.comments.push(newComment);
        await jobPost.save();

        // Create notification if it's not the author commenting on their own post
        if (jobPost.author.toString() !== userId.toString()) {
            const newNotification = new Notification({
                recipient: jobPost.author,
                type: "comment",
                relatedUser: userId,
                relatedJobPost: id
            });
            await newNotification.save();
        }

        const populatedJobPost = await JobPost.findById(id)
            .populate("author", "name username profilePicture headline")
            .populate("comments.user", "name username profilePicture");

        res.status(200).json(populatedJobPost);
    } catch (error) {
        console.log("Error in commentOnJobPost:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const applyToJob = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        const jobPost = await JobPost.findById(id);
        
        if (!jobPost) {
            return res.status(404).json({ message: "Job post not found" });
        }

        // Check if user already applied
        const alreadyApplied = jobPost.applicants.some(
            applicant => applicant.user.toString() === userId.toString()
        );

        if (alreadyApplied) {
            return res.status(400).json({ message: "You have already applied to this job" });
        }

        // Add applicant
        jobPost.applicants.push({
            user: userId,
            appliedAt: new Date(),
            status: "pending"
        });

        await jobPost.save();

        // Create notification for job post author
        if (jobPost.author.toString() !== userId.toString()) {
            const newNotification = new Notification({
                recipient: jobPost.author,
                type: "jobApplication",
                relatedUser: userId,
                relatedJobPost: id
            });
            await newNotification.save();
        }

        res.status(200).json({ message: "Application submitted successfully" });
    } catch (error) {
        console.log("Error in applyToJob:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const cancelApplication = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        const jobPost = await JobPost.findById(id);
        
        if (!jobPost) {
            return res.status(404).json({ message: "Job post not found" });
        }

        // Check if user has applied
        const applicationIndex = jobPost.applicants.findIndex(
            applicant => applicant.user.toString() === userId.toString()
        );

        if (applicationIndex === -1) {
            return res.status(400).json({ message: "You have not applied to this job" });
        }

        // Remove the application
        jobPost.applicants.splice(applicationIndex, 1);
        await jobPost.save();

        // Create notification for job post author about cancelled application
        if (jobPost.author.toString() !== userId.toString()) {
            const newNotification = new Notification({
                recipient: jobPost.author,
                type: "jobApplicationCancelled",
                relatedUser: userId,
                relatedJobPost: id
            });
            await newNotification.save();
        }

        res.status(200).json({ message: "Application cancelled successfully" });
    } catch (error) {
        console.log("Error in cancelApplication:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const searchJobPosts = async (req, res) => {
    try {
        const { query, page = 1, limit = 10 } = req.query;

        if (!query) {
            return res.status(400).json({ message: "Search query is required" });
        }

        const searchFilter = {
            isActive: true,
            $text: { $search: query }
        };

        const jobPosts = await JobPost.find(searchFilter)
            .populate("author", "name username profilePicture headline")
            .where('author.banned').ne(true)
            .sort({ score: { $meta: "textScore" }, createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await JobPost.countDocuments(searchFilter);

        res.status(200).json({
            jobPosts,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total
        });
    } catch (error) {
        console.log("Error in searchJobPosts:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getMyJobPosts = async (req, res) => {
    try {
        const userId = req.user._id;
        const { page = 1, limit = 10 } = req.query;

        const jobPosts = await JobPost.find({ author: userId })
            .populate("author", "name username profilePicture headline")
            .populate("applicants.user", "name username profilePicture headline")
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await JobPost.countDocuments({ author: userId });

        res.status(200).json({
            jobPosts,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total
        });
    } catch (error) {
        console.log("Error in getMyJobPosts:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const deleteCommentFromJobPost = async (req, res) => {
    try {
        const { id, commentId } = req.params;
        const userId = req.user._id;

        const jobPost = await JobPost.findById(id);
        
        if (!jobPost) {
            return res.status(404).json({ message: "Job post not found" });
        }

        const comment = jobPost.comments.id(commentId);
        
        if (!comment) {
            return res.status(404).json({ message: "Comment not found" });
        }

        // Only comment author can delete their own comment
        if (comment.user.toString() !== userId.toString()) {
            return res.status(403).json({ message: "You can only delete your own comments" });
        }

        jobPost.comments.pull(commentId);
        await jobPost.save();

        const populatedJobPost = await JobPost.findById(id)
            .populate("author", "name username profilePicture headline")
            .populate("comments.user", "name username profilePicture");

        res.status(200).json(populatedJobPost);
    } catch (error) {
        console.log("Error in deleteCommentFromJobPost:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Admin: ban a job post
export const banJobPost = async (req, res) => {
    try {
        if (!['admin', 'superAdmin'].includes(req.user.permission)) {
            return res.status(403).json({ message: 'Access denied. Admins only.' });
        }

        const { id } = req.params;
        const jobPost = await JobPost.findById(id);
        if (!jobPost) return res.status(404).json({ message: 'Job post not found' });

        jobPost.banned = true;
        await jobPost.save();

        const reason = req.body?.reason;
        await ModerationLog.create({ action: 'ban', targetType: 'job', targetId: id, performedBy: req.user._id, reason });

        const populated = await JobPost.findById(id).populate('author', 'name username profilePicture headline').populate('comments.user', 'name username profilePicture');
        res.status(200).json({ message: 'Job post banned', jobPost: populated });
    } catch (error) {
        console.log('Error in banJobPost:', error.message);
        res.status(500).json({ message: 'Internal server error' });
    }
}

// Admin: unban a job post
export const unbanJobPost = async (req, res) => {
    try {
        if (!['admin', 'superAdmin'].includes(req.user.permission)) {
            return res.status(403).json({ message: 'Access denied. Admins only.' });
        }

        const { id } = req.params;
        const jobPost = await JobPost.findById(id);
        if (!jobPost) return res.status(404).json({ message: 'Job post not found' });

        jobPost.banned = false;
        await jobPost.save();

        const reason = req.body?.reason;
        await ModerationLog.create({ action: 'unban', targetType: 'job', targetId: id, performedBy: req.user._id, reason });

        const populated = await JobPost.findById(id).populate('author', 'name username profilePicture headline').populate('comments.user', 'name username profilePicture');
        res.status(200).json({ message: 'Job post unbanned', jobPost: populated });
    } catch (error) {
        console.log('Error in unbanJobPost:', error.message);
        res.status(500).json({ message: 'Internal server error' });
    }
}

export const editCommentOnJobPost = async (req, res) => {
    try {
        const { id, commentId } = req.params;
        const { content } = req.body;
        const userId = req.user._id;

        if (!content || !content.trim()) {
            return res.status(400).json({ message: "Comment content is required" });
        }

        const jobPost = await JobPost.findById(id);
        
        if (!jobPost) {
            return res.status(404).json({ message: "Job post not found" });
        }

        const comment = jobPost.comments.id(commentId);
        
        if (!comment) {
            return res.status(404).json({ message: "Comment not found" });
        }

        // Only comment author can edit their own comment
        if (comment.user.toString() !== userId.toString()) {
            return res.status(403).json({ message: "You can only edit your own comments" });
        }

        comment.content = content.trim();
        comment.editedAt = new Date();
        await jobPost.save();

        const populatedJobPost = await JobPost.findById(id)
            .populate("author", "name username profilePicture headline")
            .populate("comments.user", "name username profilePicture");

        res.status(200).json(populatedJobPost);
    } catch (error) {
        console.log("Error in editCommentOnJobPost:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};