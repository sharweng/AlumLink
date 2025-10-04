import { sendCommentNotificationEmail } from "../emails/nodemailerHandlers.js";
import cloudinary from "../lib/cloudinary.js";
import Notification from "../models/Notification.js";
import Post from "../models/Post.js"

export const getFeedPosts = async (req, res) => {
    try {
        const userLinks = Array.isArray(req.user.links) ? req.user.links : [];


        const posts = await Post.find({ author:{$in: [...userLinks, req.user._id]} })
            .populate("author", "name username profilePicture headline")
            .populate("comments.user", "name username profilePicture")
            .sort({ createdAt: -1 });

            res.status(200).json(posts);
    } catch (error) {
        console.log("Error in getFeedPosts postController:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const createPost = async (req, res) => {
    try {
        const { content, image } = req.body;

        let newPost

        if (image) {
            const imgResult = await cloudinary.uploader.upload(image)
            newPost = new Post({
                author: req.user._id,
                content,
                image: imgResult.secure_url
            });
        } else {
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

        // deletes image from cloudinary if exists
        if (post.image) {
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
        const { content, image } = req.body;

        const post = await Post.findById(postId);

        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }

        // checks if the current user is the author of the post
        if (post.author.toString() !== userId.toString()) {
            return res.status(403).json({ message: "You are not authorized to edit this post" });
        }

        // Handle image update
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
        .populate("author", "name username profilePicture headline")
        .populate("comments.user", "name username profilePicture headline")

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

        // notification logic
        if (post.author._id.toString() !== req.user._id.toString()) {
            const newNotification = new Notification({
                recipient: post.author._id,
                type: "comment",
                relatedUser: req.user._id,
                relatedPost: post._id,
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