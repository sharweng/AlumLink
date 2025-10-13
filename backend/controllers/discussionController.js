import cloudinary from "../lib/cloudinary.js";
import Notification from "../models/Notification.js";
import Discussion from "../models/Discussion.js";
import User from "../models/User.js";

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
            .populate("comments.replies.user", "name username profilePicture")
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
        .populate("comments.user", "name username profilePicture headline")
        .populate("comments.replies.user", "name username profilePicture");

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
        const { title, content, tags, category, removedImages, removedFiles, newImages, newFiles } = req.body;

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

        // Handle removed images
        if (removedImages && Array.isArray(removedImages) && removedImages.length > 0) {
            for (const imageUrl of removedImages) {
                // Delete from cloudinary
                const publicId = imageUrl.split("/").pop().split(".")[0];
                await cloudinary.uploader.destroy(publicId);
                
                // Remove from discussion.images array
                discussion.images = discussion.images.filter(img => img !== imageUrl);
            }
        }

        // Handle new images
        if (newImages && Array.isArray(newImages) && newImages.length > 0) {
            for (const image of newImages) {
                const imgResult = await cloudinary.uploader.upload(image);
                discussion.images.push(imgResult.secure_url);
            }
        }

        // Handle removed files
        if (removedFiles && Array.isArray(removedFiles) && removedFiles.length > 0) {
            for (const fileUrl of removedFiles) {
                // Delete from cloudinary
                const publicId = fileUrl.split("/").pop().split(".")[0];
                await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' });
                
                // Remove from discussion.files array
                discussion.files = discussion.files.filter(file => file.url !== fileUrl);
            }
        }

        // Handle new files
        if (newFiles && Array.isArray(newFiles) && newFiles.length > 0) {
            for (const file of newFiles) {
                const fileResult = await cloudinary.uploader.upload(file.data, {
                    resource_type: 'auto',
                    folder: 'discussion_files'
                });
                discussion.files.push({
                    url: fileResult.secure_url,
                    name: file.name,
                    type: file.type,
                    size: file.size
                });
            }
        }

        discussion.editedAt = new Date();
        await discussion.save();

        const updatedDiscussion = await Discussion.findById(discussionId)
            .populate("author", "name username profilePicture headline")
            .populate("comments.user", "name username profilePicture")
            .populate("comments.replies.user", "name username profilePicture");

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
                    type: "discussionLike",
                    relatedUser: userId,
                    relatedDiscussion: discussion._id,
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
        .populate("comments.user", "name username profilePicture")
        .populate("comments.replies.user", "name username profilePicture");

        if (!discussion) {
            return res.status(404).json({ message: "Discussion not found" });
        }

        // Get the newly created comment
        const newComment = discussion.comments[discussion.comments.length - 1];

        // Create notification if commenter is not the author
        if (discussion.author._id.toString() !== req.user._id.toString()) {
            const newNotification = new Notification({
                recipient: discussion.author._id,
                type: "discussionComment",
                relatedUser: req.user._id,
                relatedDiscussion: discussion._id,
                relatedComment: newComment._id.toString(),
            });

            await newNotification.save();
        }

        // Check for mentions in the comment and create notifications
        const mentionRegex = /@(\w+)/g;
        const mentions = content.match(mentionRegex);
        
        if (mentions) {
            const usernames = mentions.map(m => m.substring(1)); // Remove @ symbol
            const mentionedUsers = await User.find({ 
                username: { $in: usernames },
                _id: { $ne: req.user._id } // Don't notify yourself
            });

            for (const mentionedUser of mentionedUsers) {
                // Don't create duplicate notification if already notified as discussion author
                if (mentionedUser._id.toString() !== discussion.author._id.toString()) {
                    const mentionNotification = new Notification({
                        recipient: mentionedUser._id,
                        type: "discussionMention",
                        relatedUser: req.user._id,
                        relatedDiscussion: discussion._id,
                        relatedComment: newComment._id.toString(),
                    });

                    await mentionNotification.save();
                }
            }
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
            .populate("comments.user", "name username profilePicture")
            .populate("comments.replies.user", "name username profilePicture");

        res.status(200).json(populatedDiscussion);
    } catch (error) {
        console.log("Error in updateComment:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const createReply = async (req, res) => {
    try {
        const { id, commentId } = req.params;
        const { content } = req.body;

        if (!content || !content.trim()) {
            return res.status(400).json({ message: "Reply content is required" });
        }

        const discussion = await Discussion.findById(id);

        if (!discussion) {
            return res.status(404).json({ message: "Discussion not found" });
        }

        const comment = discussion.comments.id(commentId);

        if (!comment) {
            return res.status(404).json({ message: "Comment not found" });
        }

        comment.replies.push({
            user: req.user._id,
            content: content.trim(),
        });

        await discussion.save();

        const populatedDiscussion = await Discussion.findById(id)
            .populate("author", "name email username profilePicture headline")
            .populate("comments.user", "name username profilePicture")
            .populate("comments.replies.user", "name username profilePicture");

        // Get the newly created reply
        const newReply = comment.replies[comment.replies.length - 1];

        // Create notification for the comment author if replier is not the comment author
        if (comment.user.toString() !== req.user._id.toString()) {
            const newNotification = new Notification({
                recipient: comment.user,
                type: "discussionReply",
                relatedUser: req.user._id,
                relatedDiscussion: discussion._id,
                relatedComment: comment._id.toString(),
                relatedReply: newReply._id.toString(),
            });

            await newNotification.save();
        }

        // Check for mentions in the reply and create notifications
        const mentionRegex = /@(\w+)/g;
        const mentions = content.match(mentionRegex);
        
        if (mentions) {
            const usernames = mentions.map(m => m.substring(1)); // Remove @ symbol
            const mentionedUsers = await User.find({ 
                username: { $in: usernames },
                _id: { $ne: req.user._id } // Don't notify yourself
            });

            for (const mentionedUser of mentionedUsers) {
                // Don't create duplicate notification if already notified as comment author
                if (mentionedUser._id.toString() !== comment.user.toString()) {
                    const mentionNotification = new Notification({
                        recipient: mentionedUser._id,
                        type: "discussionMention",
                        relatedUser: req.user._id,
                        relatedDiscussion: discussion._id,
                        relatedComment: comment._id.toString(),
                        relatedReply: newReply._id.toString(),
                    });

                    await mentionNotification.save();
                }
            }
        }

        res.status(200).json(populatedDiscussion);
    } catch (error) {
        console.log("Error in createReply:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const deleteReply = async (req, res) => {
    try {
        const { id, commentId, replyId } = req.params;
        const userId = req.user._id;

        const discussion = await Discussion.findById(id);

        if (!discussion) {
            return res.status(404).json({ message: "Discussion not found" });
        }

        const comment = discussion.comments.id(commentId);

        if (!comment) {
            return res.status(404).json({ message: "Comment not found" });
        }

        const reply = comment.replies.id(replyId);

        if (!reply) {
            return res.status(404).json({ message: "Reply not found" });
        }

        // Only reply author can delete
        if (reply.user.toString() !== userId.toString()) {
            return res.status(403).json({ message: "You are not authorized to delete this reply" });
        }

        comment.replies.pull(replyId);
        await discussion.save();

        res.status(200).json({ message: "Reply deleted successfully" });
    } catch (error) {
        console.log("Error in deleteReply:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const updateReply = async (req, res) => {
    try {
        const { id, commentId, replyId } = req.params;
        const { content } = req.body;
        const userId = req.user._id;

        if (!content || !content.trim()) {
            return res.status(400).json({ message: "Reply content is required" });
        }

        const discussion = await Discussion.findById(id);

        if (!discussion) {
            return res.status(404).json({ message: "Discussion not found" });
        }

        const comment = discussion.comments.id(commentId);

        if (!comment) {
            return res.status(404).json({ message: "Comment not found" });
        }

        const reply = comment.replies.id(replyId);

        if (!reply) {
            return res.status(404).json({ message: "Reply not found" });
        }

        // Only reply author can edit
        if (reply.user.toString() !== userId.toString()) {
            return res.status(403).json({ message: "You can only edit your own replies" });
        }

        reply.content = content.trim();
        reply.editedAt = new Date();
        await discussion.save();

        const populatedDiscussion = await Discussion.findById(id)
            .populate("author", "name username profilePicture headline")
            .populate("comments.user", "name username profilePicture")
            .populate("comments.replies.user", "name username profilePicture");

        res.status(200).json(populatedDiscussion);
    } catch (error) {
        console.log("Error in updateReply:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const likeComment = async (req, res) => {
    try {
        const { id, commentId } = req.params;
        const userId = req.user._id;

        const discussion = await Discussion.findById(id);

        if (!discussion) {
            return res.status(404).json({ message: "Discussion not found" });
        }

        const comment = discussion.comments.id(commentId);

        if (!comment) {
            return res.status(404).json({ message: "Comment not found" });
        }

        // Initialize likes and dislikes if they don't exist
        if (!comment.likes) comment.likes = [];
        if (!comment.dislikes) comment.dislikes = [];

        const hasLiked = comment.likes.includes(userId);
        const hasDisliked = comment.dislikes.includes(userId);

        if (hasLiked) {
            // Remove like
            comment.likes = comment.likes.filter(id => id.toString() !== userId.toString());
        } else {
            // Add like and remove dislike if exists
            comment.likes.push(userId);
            if (hasDisliked) {
                comment.dislikes = comment.dislikes.filter(id => id.toString() !== userId.toString());
            }

            // Create notification if liker is not the comment author
            if (comment.user.toString() !== userId.toString()) {
                const newNotification = new Notification({
                    recipient: comment.user,
                    type: "discussionCommentLike",
                    relatedUser: userId,
                    relatedDiscussion: discussion._id,
                    relatedComment: commentId,
                });

                await newNotification.save();
            }
        }

        await discussion.save();

        const populatedDiscussion = await Discussion.findById(id)
            .populate("author", "name username profilePicture headline")
            .populate("comments.user", "name username profilePicture")
            .populate("comments.replies.user", "name username profilePicture");

        res.status(200).json(populatedDiscussion);
    } catch (error) {
        console.log("Error in likeComment:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const dislikeComment = async (req, res) => {
    try {
        const { id, commentId } = req.params;
        const userId = req.user._id;

        const discussion = await Discussion.findById(id);

        if (!discussion) {
            return res.status(404).json({ message: "Discussion not found" });
        }

        const comment = discussion.comments.id(commentId);

        if (!comment) {
            return res.status(404).json({ message: "Comment not found" });
        }

        // Initialize likes and dislikes if they don't exist
        if (!comment.likes) comment.likes = [];
        if (!comment.dislikes) comment.dislikes = [];

        const hasLiked = comment.likes.includes(userId);
        const hasDisliked = comment.dislikes.includes(userId);

        if (hasDisliked) {
            // Remove dislike
            comment.dislikes = comment.dislikes.filter(id => id.toString() !== userId.toString());
        } else {
            // Add dislike and remove like if exists
            comment.dislikes.push(userId);
            if (hasLiked) {
                comment.likes = comment.likes.filter(id => id.toString() !== userId.toString());
            }

            // Create notification if disliker is not the comment author
            if (comment.user.toString() !== userId.toString()) {
                const newNotification = new Notification({
                    recipient: comment.user,
                    type: "discussionCommentDislike",
                    relatedUser: userId,
                    relatedDiscussion: discussion._id,
                    relatedComment: commentId,
                });

                await newNotification.save();
            }
        }

        await discussion.save();

        const populatedDiscussion = await Discussion.findById(id)
            .populate("author", "name username profilePicture headline")
            .populate("comments.user", "name username profilePicture")
            .populate("comments.replies.user", "name username profilePicture");

        res.status(200).json(populatedDiscussion);
    } catch (error) {
        console.log("Error in dislikeComment:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};
