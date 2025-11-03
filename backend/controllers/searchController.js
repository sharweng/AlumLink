import User from "../models/User.js";
import Post from "../models/Post.js";
import JobPost from "../models/JobPost.js";
import Discussion from "../models/Discussion.js";
import Event from "../models/Event.js";

export const globalSearch = async (req, res) => {
    try {
        const { query, filter } = req.query;
        
        if (!query || query.trim().length === 0) {
            return res.json({ users: [], posts: [], jobPosts: [], discussions: [], events: [] });
        }

        const searchQuery = query.trim();
        let userSearchResults = [];
        let postSearchResults = [];
        let jobPostSearchResults = [];
        let discussionSearchResults = [];
        let eventSearchResults = [];

        // Search Users
        if (!filter || filter === 'users' || filter === 'all') {
            const userSearchConditions = [
                { name: { $regex: searchQuery, $options: 'i' } },
                { username: { $regex: searchQuery, $options: 'i' } },
                { headline: { $regex: searchQuery, $options: 'i' } },
                { location: { $regex: searchQuery, $options: 'i' } },
                { skills: { $regex: searchQuery, $options: 'i' } },
                { course: { $regex: searchQuery, $options: 'i' } },
                { about: { $regex: searchQuery, $options: 'i' } },
                { role: { $regex: searchQuery, $options: 'i' } }
            ];

            // Search by batch year if query is a number
            if (!isNaN(searchQuery)) {
                userSearchConditions.push({ batch: parseInt(searchQuery) });
            }

          userSearchResults = await User.find({
              $or: userSearchConditions,
              banned: { $ne: true },
              permission: { $ne: 'superAdmin' }
          })
            .select("name username profilePicture headline location batch course skills role banned")
            .limit(10);
        }

        // Search Posts
        if (!filter || filter === 'posts' || filter === 'all') {
            postSearchResults = await Post.find({
                content: { $regex: searchQuery, $options: 'i' },
                banned: { $ne: true }
            })
            .populate({
                path: 'author',
                select: 'name username profilePicture headline batch course banned'
            })
            .select("content image createdAt banned")
            .sort({ createdAt: -1 })
            .limit(20);
            // Filter out posts by banned authors
            postSearchResults = postSearchResults.filter(p => !p.author?.banned);
        }

        // Search Job Posts
        if (!filter || filter === 'jobs' || filter === 'all') {
            const jobSearchConditions = [
                { title: { $regex: searchQuery, $options: 'i' } },
                { company: { $regex: searchQuery, $options: 'i' } },
                { location: { $regex: searchQuery, $options: 'i' } },
                { description: { $regex: searchQuery, $options: 'i' } },
                { skills: { $regex: searchQuery, $options: 'i' } },
                { type: { $regex: searchQuery, $options: 'i' } },
                { workType: { $regex: searchQuery, $options: 'i' } }
            ];

            jobPostSearchResults = await JobPost.find({
                $and: [
                    { isActive: true },
                    { $or: jobSearchConditions },
                    { banned: { $ne: true } }
                ]
            })
            .populate({
                path: 'author',
                select: 'name username profilePicture headline banned'
            })
            .select("title company location type workType salary createdAt skills banned")
            .sort({ createdAt: -1 })
            .limit(20);
            jobPostSearchResults = jobPostSearchResults.filter(j => !j.author?.banned);
        }

        // Search Discussions
        if (!filter || filter === 'discussions' || filter === 'all') {
            const discussionSearchConditions = [
                { title: { $regex: searchQuery, $options: 'i' } },
                { content: { $regex: searchQuery, $options: 'i' } },
                { category: { $regex: searchQuery, $options: 'i' } },
                { tags: { $regex: searchQuery, $options: 'i' } }
            ];

            discussionSearchResults = await Discussion.find({
                $or: discussionSearchConditions,
                banned: { $ne: true }
            })
            .populate({
                path: 'author',
                select: 'name username profilePicture headline banned'
            })
            .select("title content category tags createdAt images banned")
            .sort({ createdAt: -1 })
            .limit(20);
            discussionSearchResults = discussionSearchResults.filter(d => !d.author?.banned);
        }

        // Search Events
        if (!filter || filter === 'events' || filter === 'all') {
            const eventSearchConditions = [
                { title: { $regex: searchQuery, $options: 'i' } },
                { description: { $regex: searchQuery, $options: 'i' } },
                { location: { $regex: searchQuery, $options: 'i' } },
                { type: { $regex: searchQuery, $options: 'i' } }
            ];

            eventSearchResults = await Event.find({
                $or: eventSearchConditions,
                banned: { $ne: true }
            })
            .populate({
                path: 'organizer',
                select: 'name username profilePicture headline banned'
            })
            .select("title description location type eventDate startTime endTime status images createdAt banned")
            .sort({ eventDate: -1 })
            .limit(20);
            eventSearchResults = eventSearchResults.filter(e => !e.organizer?.banned);
        }

        res.json({
            users: userSearchResults,
            posts: postSearchResults,
            jobPosts: jobPostSearchResults,
            discussions: discussionSearchResults,
            events: eventSearchResults,
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
            course: { $regex: searchQuery, $options: 'i' },
            banned: { $ne: true },
            permission: { $ne: 'superAdmin' }
        });
        courses.forEach(course => {
            if (course) suggestions.push({ type: 'course', value: course });
        });

        // Get unique locations
        const locations = await User.distinct('location', {
            location: { $regex: searchQuery, $options: 'i' },
            banned: { $ne: true },
            permission: { $ne: 'superAdmin' }
        });
        locations.forEach(location => {
            if (location) suggestions.push({ type: 'location', value: location });
        });

        // Get unique skills
        const skills = await User.distinct('skills', {
            skills: { $regex: searchQuery, $options: 'i' },
            banned: { $ne: true },
            permission: { $ne: 'superAdmin' }
        });
        skills.forEach(skill => {
            if (skill) suggestions.push({ type: 'skill', value: skill });
        });

        // Get batch years if query is numeric
        if (!isNaN(searchQuery)) {
            const batches = await User.distinct('batch', {
                batch: parseInt(searchQuery),
                banned: { $ne: true },
                permission: { $ne: 'superAdmin' }
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