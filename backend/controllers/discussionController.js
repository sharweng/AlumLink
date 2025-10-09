import cloudinary from "../lib/cloudinary.js";
import Notification from "../models/Notification.js";
import Discussion from "../models/Discussion.js";

export const getAllDiscussions = async (req, res) => {
    try {
        const { category, tags, search, sort = 'recent' } = req.query;
        
        let query = {};
        
        // Filter by category if provided
        if (category && category !== 'All') {
            query.category = category;
        }
        
        // Filter by tags if provided
        if (tags) {
            const tagArray = tags.split(',');
            query.tags = { $in: tagArray };
        }
        
        // Search in title and content
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { content: { $regex: search, $options: 'i' } }
            ];
        }
        
        // Determine sort order
        let sortOption = { createdAt: -1 }; // default: most recent
        if (sort === 'popular') {
            sortOption = { views: -1 };
        } else if (sort === 'mostLiked') {
            // This creates a virtual field for likes count
            sortOption = { 'likes': -1 };
        }
        
        const discussions = await Discussion.find(query)
            .populate("author", "name username profilePicture headline")
            .populate("comments.user", "name username profilePicture")
            .sort(sortOption);

        res.status(200).json(discussions);
    } catch (error) {
        console.log("Error in getAllDiscussions:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getDiscussionById = async (req, res) => {
    try {
        const discussionId = req.params.id;
        
        // Increment view count
        const discussion = await Discussion.findByIdAndUpdate(
            discussionId,
            { $inc: { views: 1 } },
            { new: true }
        )
        .populate("author", "name username profilePicture headline")
        .populate("comments.user", "name username profilePicture headline");

        if (!discussion) {
            return res.status(404).json({ message: "Discussion not found" });
        }

        res.status(200).json(discussion);
    } catch (error) {
        console.log("Error in getDiscussionById:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const createDiscussion = async (req, res) => {
    try {
        const { title, content, images, files, tags, category } = req.body;

        if (!title || !content) {
            return res.status(400).json({ message: "Title and content are required" });
        }

        let uploadedImages = [];
        let uploadedFiles = [];

        // Upload images to cloudinary
        if (images && Array.isArray(images)) {
            for (const image of images) {
                const imgResult = await cloudinary.uploader.upload(image);
                uploadedImages.push(imgResult.secure_url);
            }
        }

        // Upload files to cloudinary (documents, pdfs, etc.)
        if (files && Array.isArray(files)) {
            for (const file of files) {
                const fileResult = await cloudinary.uploader.upload(file.data, {
                    resource_type: 'auto',
                    folder: 'discussion_files'
                });
                uploadedFiles.push({
                    url: fileResult.secure_url,
                    name: file.name,
                    type: file.type,
                    size: file.size
                });
            }
        }

        const newDiscussion = new Discussion({
            author: req.user._id,
            title,
            content,
            images: uploadedImages,
            files: uploadedFiles,
            tags: tags || [],
            category: category || 'General',
        });

        await newDiscussion.save();
        
        const populatedDiscussion = await Discussion.findById(newDiscussion._id)
            .populate("author", "name username profilePicture headline");
        
        res.status(201).json(populatedDiscussion);
    } catch (error) {
        console.log("Error in createDiscussion:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const updateDiscussion = async (req, res) => {
    try {
        const discussionId = req.params.id;
        const userId = req.user._id;
        const { title, content, images, files, tags, category } = req.body;

        const discussion = await Discussion.findById(discussionId);

        if (!discussion) {
            return res.status(404).json({ message: "Discussion not found" });
        }

        // Check if the current user is the author
        if (discussion.author.toString() !== userId.toString()) {
            return res.status(403).json({ message: "You are not authorized to edit this discussion" });
        }

        // Update fields
        if (title !== undefined) discussion.title = title;
        if (content !== undefined) discussion.content = content;
        if (tags !== undefined) discussion.tags = tags;
        if (category !== undefined) discussion.category = category;

        // Handle images update
        if (images !== undefined) {
            // Delete old images from cloudinary
            for (const oldImage of discussion.images) {
                const publicId = oldImage.split("/").pop().split(".")[0];
                await cloudinary.uploader.destroy(publicId);
            }
            
            // Upload new images
            let uploadedImages = [];
            if (Array.isArray(images)) {
                for (const image of images) {
                    const imgResult = await cloudinary.uploader.upload(image);
                    uploadedImages.push(imgResult.secure_url);
                }
            }
            discussion.images = uploadedImages;
        }

        // Handle files update
        if (files !== undefined) {
            // Delete old files from cloudinary
            for (const oldFile of discussion.files) {
                const publicId = oldFile.url.split("/").pop().split(".")[0];
                await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' });
            }
            
            // Upload new files
            let uploadedFiles = [];
            if (Array.isArray(files)) {
                for (const file of files) {
                    const fileResult = await cloudinary.uploader.upload(file.data, {
                        resource_type: 'auto',
                        folder: 'discussion_files'
                    });
                    uploadedFiles.push({
                        url: fileResult.secure_url,
                        name: file.name,
                        type: file.type,
                        size: file.size
                    });
                }
            }
            discussion.files = uploadedFiles;
        }

        discussion.editedAt = new Date();
        await discussion.save();

        const updatedDiscussion = await Discussion.findById(discussionId)
            .populate("author", "name username profilePicture headline")
            .populate("comments.user", "name username profilePicture");

        res.status(200).json(updatedDiscussion);
    } catch (error) {
        console.log("Error in updateDiscussion:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const deleteDiscussion = async (req, res) => {
    try {
        const discussionId = req.params.id;
        const userId = req.user._id;

        const discussion = await Discussion.findById(discussionId);

        if (!discussion) {
            return res.status(404).json({ message: "Discussion not found" });
        }

        // Check if the current user is the author
        if (discussion.author.toString() !== userId.toString()) {
            return res.status(403).json({ message: "You are not authorized to delete this discussion" });
        }

        // Delete images from cloudinary
        for (const image of discussion.images) {
            const publicId = image.split("/").pop().split(".")[0];
            await cloudinary.uploader.destroy(publicId);
        }

        // Delete files from cloudinary
        for (const file of discussion.files) {
            const publicId = file.url.split("/").pop().split(".")[0];
            await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' });
        }

        await Discussion.findByIdAndDelete(discussionId);
        res.status(200).json({ message: "Discussion deleted successfully" });
    } catch (error) {
        console.log("Error in deleteDiscussion:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const likeDiscussion = async (req, res) => {
    try {
        const discussionId = req.params.id;
        const discussion = await Discussion.findById(discussionId);
        const userId = req.user._id;

        if (!discussion) {
            return res.status(404).json({ message: "Discussion not found" });
        }

        if (discussion.likes.includes(userId)) {
            // If already liked, unlike it
            discussion.likes = discussion.likes.filter(id => id.toString() !== userId.toString());
        } else {
            discussion.likes.push(userId);

            // Create notification if the discussion owner is not the user liking it
            if (discussion.author.toString() !== userId.toString()) {
                const newNotification = new Notification({
                    recipient: discussion.author,
                    type: "like",
                    relatedUser: userId,
                    relatedPost: discussion._id,
                });

                await newNotification.save();
            }
        }

        await discussion.save();
        res.status(200).json(discussion);
    } catch (error) {
        console.log("Error in likeDiscussion:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const createComment = async (req, res) => {
    try {
        const discussionId = req.params.id;
        const { content } = req.body;

        if (!content || !content.trim()) {
            return res.status(400).json({ message: "Comment content is required" });
        }

        const discussion = await Discussion.findByIdAndUpdate(
            discussionId,
            { $push: { comments: { user: req.user._id, content } } },
            { new: true }
        )
        .populate("author", "name email username profilePicture headline")
        .populate("comments.user", "name username profilePicture");

        if (!discussion) {
            return res.status(404).json({ message: "Discussion not found" });
        }

        // Create notification if commenter is not the author
        if (discussion.author._id.toString() !== req.user._id.toString()) {
            const newNotification = new Notification({
                recipient: discussion.author._id,
                type: "comment",
                relatedUser: req.user._id,
                relatedPost: discussion._id,
            });

            await newNotification.save();
        }

        res.status(200).json(discussion);
    } catch (error) {
        console.log("Error in createComment:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const deleteComment = async (req, res) => {
    try {
        const discussionId = req.params.id;
        const commentId = req.params.commentId;
        const userId = req.user._id;

        const discussion = await Discussion.findById(discussionId).populate("comments.user", "_id");
        
        if (!discussion) {
            return res.status(404).json({ message: "Discussion not found" });
        }

        const comment = discussion.comments.id(commentId);
        
        if (!comment) {
            return res.status(404).json({ message: "Comment not found" });
        }

        // Only the comment author can delete
        const commentUserId = (comment.user && comment.user._id) ? comment.user._id : comment.user;
        if (commentUserId.toString() !== userId.toString()) {
            return res.status(403).json({ message: "You are not authorized to delete this comment" });
        }

        await Discussion.findByIdAndUpdate(
            discussionId,
            { $pull: { comments: { _id: commentId } } }
        );

        res.status(200).json({ message: "Comment deleted successfully" });
    } catch (error) {
        console.log("Error in deleteComment:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const updateComment = async (req, res) => {
    try {
        const { id, commentId } = req.params;
        const { content } = req.body;
        const userId = req.user._id;

        if (!content || !content.trim()) {
            return res.status(400).json({ message: "Comment content is required" });
        }

        const discussion = await Discussion.findById(id);
        
        if (!discussion) {
            return res.status(404).json({ message: "Discussion not found" });
        }

        const comment = discussion.comments.id(commentId);
        
        if (!comment) {
            return res.status(404).json({ message: "Comment not found" });
        }

        // Only comment author can edit their own comment
        if (comment.user.toString() !== userId.toString()) {
            return res.status(403).json({ message: "You can only edit your own comments" });
        }

        comment.content = content.trim();
        comment.editedAt = new Date();
        await discussion.save();

        const populatedDiscussion = await Discussion.findById(id)
            .populate("author", "name username profilePicture headline")
            .populate("comments.user", "name username profilePicture");

        res.status(200).json(populatedDiscussion);
    } catch (error) {
        console.log("Error in updateComment:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};
