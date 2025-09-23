import { sendCommentNotificationEmail } from "../emails/nodemailerHandlers.js";
import cloudinary from "../lib/cloudinary.js";
import Notification from "../models/Notification.js";
import Post from "../models/Post.js"

export const getFeedPosts = async (req, res) => {
    try {
        const posts = await Post.find({ author:{$in: req.user.links} })
            .populate("author", "name username profilePicture headline")
            .populate("comments.user", "name profilePicture")
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
        .populate("author", "name username profilePicture headline")

        // notification logic
        if (post.author._id.toString() !== req.user._id.toString()) {
            const newNotification = new Notification({
                recipient: post.author._id,
                type: "comment",
                relatedUser: req.user._id,
                relatedPost: post._id,
            });

            await newNotification.save();

            try {
                const postUrl = process.env.CLIENT_URL + `/posts/${post._id}`;
                await sendCommentNotificationEmail(post.author.email, post.author.name, req.user.name, postUrl, content);
            } catch (error) {
                console.log("Error sending comment notification email:", error.message);
            }
        }

        res.status(200).json(post);
    } catch (error) {
        console.log("Error in createComment postController:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
}

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