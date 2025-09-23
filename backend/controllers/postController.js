import cloudinary from "../lib/cloudinary";
import Post from "../models/Post"

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