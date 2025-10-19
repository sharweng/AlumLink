import Post from "../models/Post.js";
import Discussion from "../models/Discussion.js";
import JobPost from "../models/JobPost.js";
import Event from "../models/Event.js";
import User from "../models/User.js";

// Helper function to get date 30 days ago
const getLastMonth = () => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date;
};

// Posts recognition
export const getPostsRecognition = async (req, res) => {
    try {
        const lastMonth = getLastMonth();
        const limit = parseInt(req.query.limit) || 3;

        // Top Posters
        const topPosters = await Post.aggregate([
            { $match: { createdAt: { $gte: lastMonth } } },
            { $group: { _id: "$author", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: limit },
            {
                $lookup: {
                    from: "users",
                    localField: "_id",
                    foreignField: "_id",
                    as: "user"
                }
            },
            { $unwind: "$user" },
            {
                $project: {
                    _id: 0,
                    user: { _id: 1, name: 1, username: 1, profilePicture: 1 },
                    count: 1
                }
            }
        ]);

        // Top Commenters
        const topCommenters = await Post.aggregate([
            { $match: { createdAt: { $gte: lastMonth } } },
            { $unwind: "$comments" },
            { $group: { _id: "$comments.user", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: limit },
            {
                $lookup: {
                    from: "users",
                    localField: "_id",
                    foreignField: "_id",
                    as: "user"
                }
            },
            { $unwind: "$user" },
            {
                $project: {
                    _id: 0,
                    user: { _id: 1, name: 1, username: 1, profilePicture: 1 },
                    count: 1
                }
            }
        ]);

        // Top Reactors (likers)
        const topReactors = await Post.aggregate([
            { $match: { createdAt: { $gte: lastMonth } } },
            { $unwind: "$likes" },
            { $group: { _id: "$likes", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: limit },
            {
                $lookup: {
                    from: "users",
                    localField: "_id",
                    foreignField: "_id",
                    as: "user"
                }
            },
            { $unwind: "$user" },
            {
                $project: {
                    _id: 0,
                    user: { _id: 1, name: 1, username: 1, profilePicture: 1 },
                    count: 1
                }
            }
        ]);

        res.status(200).json({
            topPosters,
            topCommenters,
            topReactors
        });
    } catch (error) {
        console.error("Error in getPostsRecognition:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Discussions recognition
export const getDiscussionsRecognition = async (req, res) => {
    try {
        const lastMonth = getLastMonth();
        const limit = parseInt(req.query.limit) || 3;

        // Top Discussion Posters
        const topPosters = await Discussion.aggregate([
            { $match: { createdAt: { $gte: lastMonth } } },
            { $group: { _id: "$author", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: limit },
            {
                $lookup: {
                    from: "users",
                    localField: "_id",
                    foreignField: "_id",
                    as: "user"
                }
            },
            { $unwind: "$user" },
            {
                $project: {
                    _id: 0,
                    user: { _id: 1, name: 1, username: 1, profilePicture: 1 },
                    count: 1
                }
            }
        ]);

        // Top Commenters
        const topCommenters = await Discussion.aggregate([
            { $match: { createdAt: { $gte: lastMonth } } },
            { $unwind: "$comments" },
            { $group: { _id: "$comments.user", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: limit },
            {
                $lookup: {
                    from: "users",
                    localField: "_id",
                    foreignField: "_id",
                    as: "user"
                }
            },
            { $unwind: "$user" },
            {
                $project: {
                    _id: 0,
                    user: { _id: 1, name: 1, username: 1, profilePicture: 1 },
                    count: 1
                }
            }
        ]);

        // Top Reactors
        const topReactors = await Discussion.aggregate([
            { $match: { createdAt: { $gte: lastMonth } } },
            { $unwind: "$likes" },
            { $group: { _id: "$likes", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: limit },
            {
                $lookup: {
                    from: "users",
                    localField: "_id",
                    foreignField: "_id",
                    as: "user"
                }
            },
            { $unwind: "$user" },
            {
                $project: {
                    _id: 0,
                    user: { _id: 1, name: 1, username: 1, profilePicture: 1 },
                    count: 1
                }
            }
        ]);

        // Most Disliked (most dislikes received on comments)
        const mostDisliked = await Discussion.aggregate([
            { $match: { createdAt: { $gte: lastMonth } } },
            { $unwind: "$comments" },
            { $unwind: "$comments.dislikes" },
            { $group: { _id: "$comments.user", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: limit },
            {
                $lookup: {
                    from: "users",
                    localField: "_id",
                    foreignField: "_id",
                    as: "user"
                }
            },
            { $unwind: "$user" },
            {
                $project: {
                    _id: 0,
                    user: { _id: 1, name: 1, username: 1, profilePicture: 1 },
                    count: 1
                }
            }
        ]);

        res.status(200).json({
            topPosters,
            topCommenters,
            topReactors,
            mostDisliked
        });
    } catch (error) {
        console.error("Error in getDiscussionsRecognition:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Jobs recognition
export const getJobsRecognition = async (req, res) => {
    try {
        const lastMonth = getLastMonth();
        const limit = parseInt(req.query.limit) || 3;

        // Top Job Posters
        const topJobPosters = await JobPost.aggregate([
            { $match: { createdAt: { $gte: lastMonth } } },
            { $group: { _id: "$author", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: limit },
            {
                $lookup: {
                    from: "users",
                    localField: "_id",
                    foreignField: "_id",
                    as: "user"
                }
            },
            { $unwind: "$user" },
            {
                $project: {
                    _id: 0,
                    user: { _id: 1, name: 1, username: 1, profilePicture: 1 },
                    count: 1
                }
            }
        ]);

        // Top Applicants
        const topApplicants = await JobPost.aggregate([
            { $match: { createdAt: { $gte: lastMonth } } },
            { $unwind: "$applicants" },
            { $group: { _id: "$applicants.user", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: limit },
            {
                $lookup: {
                    from: "users",
                    localField: "_id",
                    foreignField: "_id",
                    as: "user"
                }
            },
            { $unwind: "$user" },
            {
                $project: {
                    _id: 0,
                    user: { _id: 1, name: 1, username: 1, profilePicture: 1 },
                    count: 1
                }
            }
        ]);

        res.status(200).json({
            topJobPosters,
            topApplicants
        });
    } catch (error) {
        console.error("Error in getJobsRecognition:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Events recognition
export const getEventsRecognition = async (req, res) => {
    try {
        const lastMonth = getLastMonth();
        const limit = parseInt(req.query.limit) || 3;

        // Top Organizers
        const topOrganizers = await Event.aggregate([
            { $match: { createdAt: { $gte: lastMonth } } },
            { $group: { _id: "$organizer", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: limit },
            {
                $lookup: {
                    from: "users",
                    localField: "_id",
                    foreignField: "_id",
                    as: "user"
                }
            },
            { $unwind: "$user" },
            {
                $project: {
                    _id: 0,
                    user: { _id: 1, name: 1, username: 1, profilePicture: 1 },
                    count: 1
                }
            }
        ]);

        // Top Attendees
        const topAttendees = await Event.aggregate([
            { $match: { createdAt: { $gte: lastMonth } } },
            { $unwind: "$attendees" },
            { $group: { _id: "$attendees.user", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: limit },
            {
                $lookup: {
                    from: "users",
                    localField: "_id",
                    foreignField: "_id",
                    as: "user"
                }
            },
            { $unwind: "$user" },
            {
                $project: {
                    _id: 0,
                    user: { _id: 1, name: 1, username: 1, profilePicture: 1 },
                    count: 1
                }
            }
        ]);

        res.status(200).json({
            topOrganizers,
            topAttendees
        });
    } catch (error) {
        console.error("Error in getEventsRecognition:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};
