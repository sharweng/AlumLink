import JobPost from "../models/JobPost.js";
import Notification from "../models/Notification.js";

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
            .populate("comments.user", "name username profilePicture")
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
            .populate("comments.user", "name username profilePicture")
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

        // Check if user is the comment author or job post author
        if (comment.user.toString() !== userId.toString() && jobPost.author.toString() !== userId.toString()) {
            return res.status(403).json({ message: "You can only delete your own comments or comments on your job posts" });
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