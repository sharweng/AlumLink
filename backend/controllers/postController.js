import { sendCommentNotificationEmail } from "../emails/nodemailerHandlers.js";
import cloudinary from "../lib/cloudinary.js";
import Notification from "../models/Notification.js";
import Post from "../models/Post.js"
import ModerationLog from "../models/ModerationLog.js";
import User from "../models/User.js";

export const getFeedPosts = async (req, res) => {
    try {
        const userLinks = Array.isArray(req.user.links) ? req.user.links : [];


        const posts = await Post.find({ author:{$in: [...userLinks, req.user._id]} })
            .populate("author", "name username profilePicture headline banned")
            .populate("comments.user", "name username profilePicture")
            .populate("comments.replies.user", "name username profilePicture")
            .where('author.banned').ne(true) // Exclude banned users
            .sort({ createdAt: -1 });

            res.status(200).json(posts);
    } catch (error) {
        console.log("Error in getFeedPosts postController:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const getUserPosts = async (req, res) => {
    try {
        const { username } = req.params;
    const isAdmin = ['admin', 'superAdmin'].includes(req.user.permission);
        const isOwner = req.user.username === username;

        // Find user by username to get _id
        const User = (await import("../models/User.js")).default;
        const user = await User.findOne({ username });
        if (!user) return res.status(404).json({ message: "User not found" });

        // Check postsVisibility
        let canView = false;
        if (isAdmin || isOwner) {
            canView = true;
        } else if (user.postsVisibility === 'public') {
            canView = true;
        } else if (user.postsVisibility === 'links') {
            // Check if viewer is linked
            canView = user.links.map(l => l.toString()).includes(req.user._id.toString());
        }
        if (!canView) {
            return res.status(200).json([]);
        }

        let query = { author: user._id };
        if (!isAdmin && !isOwner) {
            query.banned = { $ne: true };
        }

        const posts = await Post.find(query)
            .populate("author", "name username profilePicture headline banned")
            .populate("comments.user", "name username profilePicture")
            .populate("comments.replies.user", "name username profilePicture")
            .where('author.banned').ne(true) // Exclude banned users
            .sort({ createdAt: -1 });

        res.status(200).json(posts);
    } catch (error) {
        console.log("Error in getUserPosts postController:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const createPost = async (req, res) => {
    try {
        const { content, image, images } = req.body;

        let newPost

        // Handle multiple images
        if (images && images.length > 0) {
            const uploadPromises = images.map(img => cloudinary.uploader.upload(img));
            const imgResults = await Promise.all(uploadPromises);
            const imageUrls = imgResults.map(result => result.secure_url);
            
            newPost = new Post({
                author: req.user._id,
                content,
                images: imageUrls
            });
        } 
        // Handle single image (backward compatibility)
        else if (image) {
            const imgResult = await cloudinary.uploader.upload(image)
            newPost = new Post({
                author: req.user._id,
                content,
                image: imgResult.secure_url
            });
        } 
        // No images
        else {
            newPost = new Post({
                author: req.user._id,
                content,
            });
        }

        await newPost.save();
        res.status(201).json(newPost);
    } catch (error) {
        console.log("Error in createPost postController:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const deletePost = async (req, res) => {
    try {
        const postId = req.params.id;
        const userId = req.user._id;

        const post = await Post.findById(postId);

        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }

        // checks if the current user is the author of the post
        if (post.author.toString() !== userId.toString()) {
            return res.status(403).json({ message: "You are not authorized to delete this post" });
        }

        // deletes images from cloudinary if exists
        if (post.images && post.images.length > 0) {
            const deletePromises = post.images.map(imageUrl => {
                const publicId = imageUrl.split("/").pop().split(".")[0];
                return cloudinary.uploader.destroy(publicId);
            });
            await Promise.all(deletePromises);
        }
        // delete single image (backward compatibility)
        else if (post.image) {
            const publicId = post.image.split("/").pop().split(".")[0];
            await cloudinary.uploader.destroy(publicId);
        }

        await Post.findByIdAndDelete(postId);
        res.status(200).json({ message: "Post deleted successfully" });
    } catch (error) {
        console.log("Error in deletePost postController:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const editPost = async (req, res) => {
    try {
        const postId = req.params.id;
        const userId = req.user._id;
        const { content, image, removedImages, newImages } = req.body;

        const post = await Post.findById(postId);

        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }

        // checks if the current user is the author of the post
        if (post.author.toString() !== userId.toString()) {
            return res.status(403).json({ message: "You are not authorized to edit this post" });
        }

        // Handle removed images from array
        if (removedImages && removedImages.length > 0 && post.images && post.images.length > 0) {
            // Delete removed images from Cloudinary
            const deletePromises = removedImages.map(imageUrl => {
                const publicId = imageUrl.split("/").pop().split(".")[0];
                return cloudinary.uploader.destroy(publicId);
            });
            await Promise.all(deletePromises);
            
            // Update images array by filtering out removed images
            post.images = post.images.filter(img => !removedImages.includes(img));
        }

        // Handle new images being added to existing images array
        if (newImages && newImages.length > 0) {
            const uploadPromises = newImages.map(img => cloudinary.uploader.upload(img));
            const imgResults = await Promise.all(uploadPromises);
            const newImageUrls = imgResults.map(result => result.secure_url);
            
            // Add new images to existing images array
            if (post.images && post.images.length > 0) {
                post.images = [...post.images, ...newImageUrls];
            } else {
                post.images = newImageUrls;
            }
        }

        // Handle single image update (backward compatibility)
        if (image === null) {
            // Remove existing image
            if (post.image) {
                const publicId = post.image.split("/").pop().split(".")[0];
                await cloudinary.uploader.destroy(publicId);
            }
            post.image = undefined;
        } else if (image) {
            // Delete old image from cloudinary if exists and new image is provided
            if (post.image) {
                const publicId = post.image.split("/").pop().split(".")[0];
                await cloudinary.uploader.destroy(publicId);
            }
            // Upload new image
            const imgResult = await cloudinary.uploader.upload(image);
            post.image = imgResult.secure_url;
        }

        // Update content
        if (content !== undefined) {
            post.content = content;
        }

        post.editedAt = new Date();
        await post.save();

        // Return populated post
        const updatedPost = await Post.findById(postId)
            .populate("author", "name username profilePicture headline")
            .populate("comments.user", "name username profilePicture");

        res.status(200).json(updatedPost);
    } catch (error) {
        console.log("Error in editPost postController:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const getPostById = async (req, res) => {
    try {
        const postId = req.params.id;
    const post = await Post.findById(postId)
    .populate("author", "name username profilePicture headline banned")
    .populate("comments.user", "name username profilePicture headline")
    .populate("comments.replies.user", "name username profilePicture")

        res.status(200).json(post);
    } catch (error) {
        console.log("Error in getPostById postController:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const createComment = async (req, res) => {
    try {
        const postId = req.params.id;
        const { content } = req.body;

        const post = await Post.findByIdAndUpdate(postId, {
            $push: { comments: { user: req.user._id, content } }
        }, { new: true })
        .populate("author", "name email username profilePicture headline")
        .populate("comments.user", "name username profilePicture")
        .populate("comments.replies.user", "name username profilePicture");

        // Get the newly created comment
        const newComment = post.comments[post.comments.length - 1];

        // notification logic
        if (post.author._id.toString() !== req.user._id.toString()) {
            const newNotification = new Notification({
                recipient: post.author._id,
                type: "comment",
                relatedUser: req.user._id,
                relatedPost: post._id,
                relatedComment: newComment._id.toString(),
            });

            await newNotification.save();
            
            // removed email if commented because it takes up too much sandbox email
            // try {
            //     const postUrl = process.env.CLIENT_URL + `/posts/${postId}`;
            //     await sendCommentNotificationEmail(post.author.email, post.author.name, req.user.name, postUrl, content);
            // } catch (error) {
            //     console.log("Error sending comment notification email:", error.message);
            // }
        }

        res.status(200).json(post);
    } catch (error) {
        console.log("Error in createComment postController:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const removeComment = async (req, res) => {
    try {
        const postId = req.params.id;
        const commentId = req.params.commentId;
        const userId = req.user._id;

        // Find the post and the comment
        const post = await Post.findById(postId).populate("comments.user", "_id");
        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }

        // Find the comment
        const comment = post.comments.id(commentId);
        if (!comment) {
            return res.status(404).json({ message: "Comment not found" });
        }

        // Only the comment author can delete (handle both ObjectId and populated user)
        const commentUserId = (comment.user && comment.user._id) ? comment.user._id : comment.user;
        if (commentUserId.toString() !== userId.toString()) {
            console.log("DEBUG: commentUserId", commentUserId, "userId", userId);
            return res.status(403).json({ message: "You are not authorized to delete this comment" });
        }

        // Remove the comment using $pull for robustness
        await Post.findByIdAndUpdate(
            postId,
            { $pull: { comments: { _id: commentId } } }
        );

        res.status(200).json({ message: "Comment deleted successfully" });
    } catch (error) {
        console.log("Error in removeComment postController:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const editCommentOnPost = async (req, res) => {
    try {
        const { id, commentId } = req.params;
        const { content } = req.body;
        const userId = req.user._id;

        if (!content || !content.trim()) {
            return res.status(400).json({ message: "Comment content is required" });
        }

        const post = await Post.findById(id);
        
        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }

        const comment = post.comments.id(commentId);
        
        if (!comment) {
            return res.status(404).json({ message: "Comment not found" });
        }

        // Only comment author can edit their own comment
        if (comment.user.toString() !== userId.toString()) {
            return res.status(403).json({ message: "You can only edit your own comments" });
        }

        comment.content = content.trim();
        comment.editedAt = new Date();
        await post.save();

        const populatedPost = await Post.findById(id)
            .populate("author", "name username profilePicture headline")
            .populate("comments.user", "name username profilePicture");

        res.status(200).json(populatedPost);
    } catch (error) {
        console.log("Error in editCommentOnPost:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const likePost = async (req, res) => {
    try {
        const postId = req.params.id;
        const post = await Post.findById(postId);
        const userId = req.user._id;

        if (post.likes.includes(userId)) {
            // if already liked, unlike it
            post.likes = post.likes.filter(id => id.toString() !== userId.toString());
        } else {
            post.likes.push(userId);

            // create notification if the post owner is not the user liking the post
            if (post.author.toString() !== userId.toString()) {
                const newNotification = new Notification({
                    recipient: post.author,
                    type: "like",
                    relatedUser: userId,
                    relatedPost: post._id,
                });

                await newNotification.save();
            }
        }

        await post.save();
        res.status(200).json(post);
    } catch (error) {
        console.log("Error in likePost postController:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const createReply = async (req, res) => {
    try {
        const { id, commentId } = req.params;
        const { content } = req.body;

        if (!content || !content.trim()) {
            return res.status(400).json({ message: "Reply content is required" });
        }

        const post = await Post.findById(id);

        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }

        const comment = post.comments.id(commentId);

        if (!comment) {
            return res.status(404).json({ message: "Comment not found" });
        }

        comment.replies.push({
            user: req.user._id,
            content: content.trim(),
        });

        await post.save();

        const populatedPost = await Post.findById(id)
            .populate("author", "name email username profilePicture headline")
            .populate("comments.user", "name username profilePicture")
            .populate("comments.replies.user", "name username profilePicture");

        // Get the newly created reply
        const newReply = comment.replies[comment.replies.length - 1];

        // Create notification for the comment author if replier is not the comment author
        if (comment.user.toString() !== req.user._id.toString()) {
            const newNotification = new Notification({
                recipient: comment.user,
                type: "postReply",
                relatedUser: req.user._id,
                relatedPost: post._id,
                relatedComment: comment._id.toString(),
                relatedReply: newReply._id.toString(),
            });

            await newNotification.save();
        }

        res.status(200).json({ data: populatedPost, commentId: comment._id.toString() });
    } catch (error) {
        console.log("Error in createReply:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const deleteReply = async (req, res) => {
    try {
        const { id, commentId, replyId } = req.params;
        const userId = req.user._id;

        const post = await Post.findById(id).populate("comments.replies.user", "_id");

        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }

        const comment = post.comments.id(commentId);

        if (!comment) {
            return res.status(404).json({ message: "Comment not found" });
        }

        const reply = comment.replies.id(replyId);

        if (!reply) {
            return res.status(404).json({ message: "Reply not found" });
        }

        // Check if the user is the author of the reply
        if (reply.user._id.toString() !== userId.toString()) {
            return res.status(403).json({ message: "You are not authorized to delete this reply" });
        }

        // Remove the reply
        reply.deleteOne();
        await post.save();

        const updatedPost = await Post.findById(id)
            .populate("author", "name username profilePicture headline")
            .populate("comments.user", "name username profilePicture")
            .populate("comments.replies.user", "name username profilePicture");

        res.status(200).json(updatedPost);
    } catch (error) {
        console.log("Error in deleteReply:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const updateReply = async (req, res) => {
    try {
        const { id, commentId, replyId } = req.params;
        const { content } = req.body;
        const userId = req.user._id;

        if (!content || !content.trim()) {
            return res.status(400).json({ message: "Reply content is required" });
        }

        const post = await Post.findById(id).populate("comments.replies.user", "_id");

        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }

        const comment = post.comments.id(commentId);

        if (!comment) {
            return res.status(404).json({ message: "Comment not found" });
        }

        const reply = comment.replies.id(replyId);

        if (!reply) {
            return res.status(404).json({ message: "Reply not found" });
        }

        // Check if the user is the author of the reply
        if (reply.user._id.toString() !== userId.toString()) {
            return res.status(403).json({ message: "You are not authorized to edit this reply" });
        }

        reply.content = content.trim();
        reply.editedAt = new Date();
        await post.save();

        const updatedPost = await Post.findById(id)
            .populate("author", "name username profilePicture headline")
            .populate("comments.user", "name username profilePicture")
            .populate("comments.replies.user", "name username profilePicture");

        res.status(200).json(updatedPost);
    } catch (error) {
        console.log("Error in updateReply:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const likeComment = async (req, res) => {
    try {
        const { id, commentId } = req.params;
        const userId = req.user._id;

        const post = await Post.findById(id);

        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }

        const comment = post.comments.id(commentId);

        if (!comment) {
            return res.status(404).json({ message: "Comment not found" });
        }

        const isLiked = comment.likes.includes(userId);

        if (isLiked) {
            // Remove like
            comment.likes = comment.likes.filter(id => id.toString() !== userId.toString());
        } else {
            // Add like and remove dislike if exists
            comment.likes.push(userId);
            comment.dislikes = comment.dislikes.filter(id => id.toString() !== userId.toString());
            
            // Create notification for comment owner if liker is not the comment author
            if (comment.user.toString() !== userId.toString()) {
                const newNotification = new Notification({
                    recipient: comment.user,
                    type: "postCommentLike",
                    relatedUser: userId,
                    relatedPost: post._id,
                    relatedComment: commentId,
                });

                await newNotification.save();
            }
        }

        await post.save();

        const updatedPost = await Post.findById(id)
            .populate("author", "name username profilePicture headline")
            .populate("comments.user", "name username profilePicture")
            .populate("comments.replies.user", "name username profilePicture");

        res.status(200).json(updatedPost);
    } catch (error) {
        console.log("Error in likeComment:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const dislikeComment = async (req, res) => {
    try {
        const { id, commentId } = req.params;
        const userId = req.user._id;

        const post = await Post.findById(id);

        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }

        const comment = post.comments.id(commentId);

        if (!comment) {
            return res.status(404).json({ message: "Comment not found" });
        }

        const isDisliked = comment.dislikes.includes(userId);

        if (isDisliked) {
            // Remove dislike
            comment.dislikes = comment.dislikes.filter(id => id.toString() !== userId.toString());
        } else {
            // Add dislike and remove like if exists
            comment.dislikes.push(userId);
            comment.likes = comment.likes.filter(id => id.toString() !== userId.toString());
            
            // Create notification for comment owner if disliker is not the comment author
            if (comment.user.toString() !== userId.toString()) {
                const newNotification = new Notification({
                    recipient: comment.user,
                    type: "postCommentDislike",
                    relatedUser: userId,
                    relatedPost: post._id,
                    relatedComment: commentId,
                });

                await newNotification.save();
            }
        }

        await post.save();

        const updatedPost = await Post.findById(id)
            .populate("author", "name username profilePicture headline")
            .populate("comments.user", "name username profilePicture")
            .populate("comments.replies.user", "name username profilePicture");

        res.status(200).json(updatedPost);
    } catch (error) {
        console.log("Error in dislikeComment:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
}

// Admin: ban a post
export const banPost = async (req, res) => {
    try {
        // Only admins can ban content
        if (!['admin', 'superAdmin'].includes(req.user.permission)) {
            return res.status(403).json({ message: "Access denied. Admins only." });
        }

        const postId = req.params.id;
        const post = await Post.findById(postId);
        if (!post) return res.status(404).json({ message: 'Post not found' });

        // Allow regular admins to ban content regardless of author (as requested)
    post.banned = true;
    await post.save();

    // create moderation log (include optional reason)
    const reason = req.body?.reason
    await ModerationLog.create({ action: 'ban', targetType: 'post', targetId: postId, performedBy: req.user._id, reason })

        const populated = await Post.findById(postId)
            .populate("author", "name username profilePicture headline")
            .populate("comments.user", "name username profilePicture");

        res.status(200).json({ message: 'Post banned', post: populated });
    } catch (error) {
        console.log('Error in banPost:', error.message);
        res.status(500).json({ message: 'Internal server error' });
    }
}

// Admin: unban a post
export const unbanPost = async (req, res) => {
    try {
        if (!['admin', 'superAdmin'].includes(req.user.permission)) {
            return res.status(403).json({ message: "Access denied. Admins only." });
        }

        const postId = req.params.id;
        const post = await Post.findById(postId);
        if (!post) return res.status(404).json({ message: 'Post not found' });

    post.banned = false;
    await post.save();

    // create moderation log
    const reason = req.body?.reason
    await ModerationLog.create({ action: 'unban', targetType: 'post', targetId: postId, performedBy: req.user._id, reason })

        const populated = await Post.findById(postId)
            .populate("author", "name username profilePicture headline")
            .populate("comments.user", "name username profilePicture");

        res.status(200).json({ message: 'Post unbanned', post: populated });
    } catch (error) {
        console.log('Error in unbanPost:', error.message);
        res.status(500).json({ message: 'Internal server error' });
    }
}

// Admin: ban a comment
export const banComment = async (req, res) => {
    try {
        if (!['admin', 'superAdmin'].includes(req.user.permission)) {
            return res.status(403).json({ message: "Access denied. Admins only." });
        }

        const { id, commentId } = req.params; // post id and comment id
        const post = await Post.findById(id);
        if (!post) return res.status(404).json({ message: 'Post not found' });

        const comment = post.comments.id(commentId);
        if (!comment) return res.status(404).json({ message: 'Comment not found' });

    comment.banned = true;
    await post.save();

    const reason = req.body?.reason
    await ModerationLog.create({ action: 'ban', targetType: 'comment', targetId: commentId, parentId: id, performedBy: req.user._id, reason })

        const populated = await Post.findById(id)
            .populate("author", "name username profilePicture headline")
            .populate("comments.user", "name username profilePicture");

        res.status(200).json({ message: 'Comment banned', post: populated });
    } catch (error) {
        console.log('Error in banComment:', error.message);
        res.status(500).json({ message: 'Internal server error' });
    }
}

// Admin: unban a comment
export const unbanComment = async (req, res) => {
    try {
        if (!['admin', 'superAdmin'].includes(req.user.permission)) {
            return res.status(403).json({ message: "Access denied. Admins only." });
        }

        const { id, commentId } = req.params; // post id and comment id
        const post = await Post.findById(id);
        if (!post) return res.status(404).json({ message: 'Post not found' });

        const comment = post.comments.id(commentId);
        if (!comment) return res.status(404).json({ message: 'Comment not found' });

    comment.banned = false;
    await post.save();

    const reason = req.body?.reason
    await ModerationLog.create({ action: 'unban', targetType: 'comment', targetId: commentId, parentId: id, performedBy: req.user._id, reason })

        const populated = await Post.findById(id)
            .populate("author", "name username profilePicture headline")
            .populate("comments.user", "name username profilePicture");

        res.status(200).json({ message: 'Comment unbanned', post: populated });
    } catch (error) {
        console.log('Error in unbanComment:', error.message);
        res.status(500).json({ message: 'Internal server error' });
    }
}

// Admin: ban a reply
export const banReply = async (req, res) => {
    try {
        if (!['admin', 'superAdmin'].includes(req.user.permission)) {
            return res.status(403).json({ message: "Access denied. Admins only." });
        }

        const { id, commentId, replyId } = req.params;
        const post = await Post.findById(id);
        if (!post) return res.status(404).json({ message: 'Post not found' });

        const comment = post.comments.id(commentId);
        if (!comment) return res.status(404).json({ message: 'Comment not found' });

        const reply = comment.replies.id(replyId);
        if (!reply) return res.status(404).json({ message: 'Reply not found' });

    reply.banned = true;
    await post.save();

    const reason = req.body?.reason
    await ModerationLog.create({ action: 'ban', targetType: 'reply', targetId: replyId, parentId: id, commentId: commentId, performedBy: req.user._id, reason })

        const populated = await Post.findById(id)
            .populate("author", "name username profilePicture headline")
            .populate("comments.user", "name username profilePicture")
            .populate("comments.replies.user", "name username profilePicture");

        res.status(200).json({ message: 'Reply banned', post: populated });
    } catch (error) {
        console.log('Error in banReply:', error.message);
        res.status(500).json({ message: 'Internal server error' });
    }
}

// Admin: unban a reply
export const unbanReply = async (req, res) => {
    try {
        if (!['admin', 'superAdmin'].includes(req.user.permission)) {
            return res.status(403).json({ message: "Access denied. Admins only." });
        }

        const { id, commentId, replyId } = req.params;
        const post = await Post.findById(id);
        if (!post) return res.status(404).json({ message: 'Post not found' });

        const comment = post.comments.id(commentId);
        if (!comment) return res.status(404).json({ message: 'Comment not found' });

        const reply = comment.replies.id(replyId);
        if (!reply) return res.status(404).json({ message: 'Reply not found' });

    reply.banned = false;
    await post.save();

    const reason = req.body?.reason
    await ModerationLog.create({ action: 'unban', targetType: 'reply', targetId: replyId, parentId: id, commentId: commentId, performedBy: req.user._id, reason })

        const populated = await Post.findById(id)
            .populate("author", "name username profilePicture headline")
            .populate("comments.user", "name username profilePicture")
            .populate("comments.replies.user", "name username profilePicture");

        res.status(200).json({ message: 'Reply unbanned', post: populated });
    } catch (error) {
        console.log('Error in unbanReply:', error.message);
        res.status(500).json({ message: 'Internal server error' });
    }
}

// Update posts visibility
export const updatePostsVisibility = async (req, res) => {
    try {
        const { visibility } = req.body;
        if (!['public', 'links'].includes(visibility)) {
            return res.status(400).json({ message: "Invalid visibility option." });
        }
        await User.findByIdAndUpdate(req.user._id, { postsVisibility: visibility });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ message: "Failed to update posts visibility." });
    }
};
