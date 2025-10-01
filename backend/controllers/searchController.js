import User from "../models/User.js";
import Post from "../models/Post.js";

export const globalSearch = async (req, res) => {
    try {
        const { query, filter } = req.query;
        
        if (!query || query.trim().length === 0) {
            return res.json({ users: [], posts: [] });
        }

        const searchQuery = query.trim();
        let userSearchResults = [];
        let postSearchResults = [];

        // Search Users
        if (!filter || filter === 'users' || filter === 'all') {
            const userSearchConditions = [
                { name: { $regex: searchQuery, $options: 'i' } },
                { username: { $regex: searchQuery, $options: 'i' } },
                { headline: { $regex: searchQuery, $options: 'i' } },
                { location: { $regex: searchQuery, $options: 'i' } },
                { skills: { $regex: searchQuery, $options: 'i' } },
                { course: { $regex: searchQuery, $options: 'i' } },
                { about: { $regex: searchQuery, $options: 'i' } }
            ];

            // Search by batch year if query is a number
            if (!isNaN(searchQuery)) {
                userSearchConditions.push({ batch: parseInt(searchQuery) });
            }

            userSearchResults = await User.find({
                $or: userSearchConditions
            })
            .select("name username profilePicture headline location batch course skills")
            .limit(10);
        }

        // Search Posts
        if (!filter || filter === 'posts' || filter === 'all') {
            postSearchResults = await Post.find({
                content: { $regex: searchQuery, $options: 'i' }
            })
            .populate({
                path: 'author',
                select: 'name username profilePicture headline batch course'
            })
            .select("content image createdAt")
            .sort({ createdAt: -1 })
            .limit(10);
        }

        res.json({
            users: userSearchResults,
            posts: postSearchResults,
            query: searchQuery
        });

    } catch (error) {
        console.log("Error in globalSearch controller:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const searchSuggestions = async (req, res) => {
    try {
        const { query } = req.query;
        
        if (!query || query.trim().length < 2) {
            return res.json({ suggestions: [] });
        }

        const searchQuery = query.trim();
        const suggestions = [];

        // Get unique courses
        const courses = await User.distinct('course', {
            course: { $regex: searchQuery, $options: 'i' }
        });
        courses.forEach(course => {
            if (course) suggestions.push({ type: 'course', value: course });
        });

        // Get unique locations
        const locations = await User.distinct('location', {
            location: { $regex: searchQuery, $options: 'i' }
        });
        locations.forEach(location => {
            if (location) suggestions.push({ type: 'location', value: location });
        });

        // Get unique skills
        const skills = await User.distinct('skills', {
            skills: { $regex: searchQuery, $options: 'i' }
        });
        skills.forEach(skill => {
            if (skill) suggestions.push({ type: 'skill', value: skill });
        });

        // Get batch years if query is numeric
        if (!isNaN(searchQuery)) {
            const batches = await User.distinct('batch', {
                batch: parseInt(searchQuery)
            });
            batches.forEach(batch => {
                if (batch) suggestions.push({ type: 'batch', value: batch.toString() });
            });
        }

        res.json({ suggestions: suggestions.slice(0, 5) });

    } catch (error) {
        console.log("Error in searchSuggestions controller:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};