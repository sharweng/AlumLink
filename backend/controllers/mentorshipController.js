import Mentorship from "../models/Mentorship.js";
import MentorshipSession from "../models/MentorshipSession.js";
import User from "../models/User.js";
import Notification from "../models/Notification.js";

// Get all mentors
export const getAllMentors = async (req, res) => {
    try {
        const { expertise, search } = req.query;
        
        const filter = { isMentor: true, isActive: true };
        
        if (expertise) {
            filter.mentorExpertise = { $in: [expertise] };
        }
        
        let mentors = await User.find(filter)
            .select("name username profilePicture headline location about skills mentorBio mentorExpertise mentorAvailability experience batch course")
            .sort({ createdAt: -1 });
        
        if (search) {
            const searchLower = search.toLowerCase();
            mentors = mentors.filter(mentor => 
                mentor.name.toLowerCase().includes(searchLower) ||
                mentor.mentorBio.toLowerCase().includes(searchLower) ||
                mentor.mentorExpertise.some(exp => exp.toLowerCase().includes(searchLower))
            );
        }
        
        res.status(200).json(mentors);
    } catch (error) {
        console.error("Error fetching mentors:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Request mentorship
export const requestMentorship = async (req, res) => {
    try {
        const { mentorId, requestMessage, goals, focusAreas } = req.body;
        
        if (!mentorId || !requestMessage) {
            return res.status(400).json({ message: "Mentor ID and request message are required" });
        }
        
        // Check if mentor exists and is actually a mentor
        const mentor = await User.findById(mentorId);
        if (!mentor || !mentor.isMentor) {
            return res.status(404).json({ message: "Mentor not found" });
        }
        
        // Check if there's already a pending or accepted mentorship
        const existingMentorship = await Mentorship.findOne({
            mentor: mentorId,
            mentee: req.user._id,
            status: { $in: ["pending", "accepted"] },
        });
        
        if (existingMentorship) {
            return res.status(400).json({ message: "You already have an active or pending mentorship with this mentor" });
        }
        
        const mentorship = await Mentorship.create({
            mentor: mentorId,
            mentee: req.user._id,
            requestMessage,
            goals: goals || "",
            focusAreas: focusAreas || [],
        });
        
        // Create notification for mentor
        await Notification.create({
            recipient: mentorId,
            type: "mentorshipRequest",
            relatedUser: req.user._id,
        });
        
        const populatedMentorship = await Mentorship.findById(mentorship._id)
            .populate("mentor", "name username profilePicture headline")
            .populate("mentee", "name username profilePicture headline");
        
        res.status(201).json(populatedMentorship);
    } catch (error) {
        console.error("Error requesting mentorship:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Respond to mentorship request (accept/decline)
export const respondToMentorshipRequest = async (req, res) => {
    try {
        const { mentorshipId } = req.params;
        const { status } = req.body; // "accepted" or "declined"
        
        if (!["accepted", "declined"].includes(status)) {
            return res.status(400).json({ message: "Invalid status" });
        }
        
        const mentorship = await Mentorship.findById(mentorshipId);
        
        if (!mentorship) {
            return res.status(404).json({ message: "Mentorship not found" });
        }
        
        // Only the mentor can respond
        if (mentorship.mentor.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Not authorized" });
        }
        
        if (mentorship.status !== "pending") {
            return res.status(400).json({ message: "Mentorship request is not pending" });
        }
        
        mentorship.status = status;
        if (status === "accepted") {
            mentorship.startDate = new Date();
        }
        await mentorship.save();
        
        // Create notification for mentee
        await Notification.create({
            recipient: mentorship.mentee,
            type: status === "accepted" ? "mentorshipAccepted" : "mentorshipDeclined",
            relatedUser: req.user._id,
        });
        
        const populatedMentorship = await Mentorship.findById(mentorship._id)
            .populate("mentor", "name username profilePicture headline")
            .populate("mentee", "name username profilePicture headline");
        
        res.status(200).json(populatedMentorship);
    } catch (error) {
        console.error("Error responding to mentorship request:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Get user's mentorships (as mentor or mentee)
export const getMyMentorships = async (req, res) => {
    try {
        const { role, status } = req.query; // role: "mentor" or "mentee"
        
        let filter = {};
        if (role === "mentor") {
            filter.mentor = req.user._id;
        } else if (role === "mentee") {
            filter.mentee = req.user._id;
        } else {
            filter.$or = [
                { mentor: req.user._id },
                { mentee: req.user._id },
            ];
        }
        
        if (status) {
            filter.status = status;
        }
        
        const mentorships = await Mentorship.find(filter)
            .populate("mentor", "name username profilePicture headline location mentorExpertise")
            .populate("mentee", "name username profilePicture headline location")
            .sort({ createdAt: -1 });
        
        res.status(200).json(mentorships);
    } catch (error) {
        console.error("Error fetching mentorships:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Get mentorship by ID
export const getMentorshipById = async (req, res) => {
    try {
        const { mentorshipId } = req.params;
        
        const mentorship = await Mentorship.findById(mentorshipId)
            .populate("mentor", "name username profilePicture headline location about skills mentorBio mentorExpertise")
            .populate("mentee", "name username profilePicture headline location about skills");
        
        if (!mentorship) {
            return res.status(404).json({ message: "Mentorship not found" });
        }
        
        // Check if user is part of this mentorship
        if (
            mentorship.mentor._id.toString() !== req.user._id.toString() &&
            mentorship.mentee._id.toString() !== req.user._id.toString()
        ) {
            return res.status(403).json({ message: "Not authorized" });
        }
        
        res.status(200).json(mentorship);
    } catch (error) {
        console.error("Error fetching mentorship:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Update mentorship (goals, notes, status)
export const updateMentorship = async (req, res) => {
    try {
        const { mentorshipId } = req.params;
        const { goals, notes, status } = req.body;
        
        const mentorship = await Mentorship.findById(mentorshipId);
        
        if (!mentorship) {
            return res.status(404).json({ message: "Mentorship not found" });
        }
        
        // Check if user is part of this mentorship
        if (
            mentorship.mentor.toString() !== req.user._id.toString() &&
            mentorship.mentee.toString() !== req.user._id.toString()
        ) {
            return res.status(403).json({ message: "Not authorized" });
        }
        
        if (goals) mentorship.goals = goals;
        if (notes) mentorship.notes = notes;
        if (status) {
            mentorship.status = status;
            if (status === "completed") {
                mentorship.endDate = new Date();
            }
        }
        
        await mentorship.save();
        
        const populatedMentorship = await Mentorship.findById(mentorship._id)
            .populate("mentor", "name username profilePicture headline")
            .populate("mentee", "name username profilePicture headline");
        
        res.status(200).json(populatedMentorship);
    } catch (error) {
        console.error("Error updating mentorship:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Create mentorship session
export const createSession = async (req, res) => {
    try {
        const { mentorshipId, title, description, scheduledDate, duration, meetingLink, location, agenda } = req.body;
        
        if (!mentorshipId || !title || !scheduledDate) {
            return res.status(400).json({ message: "Mentorship ID, title, and scheduled date are required" });
        }
        
        const mentorship = await Mentorship.findById(mentorshipId);
        
        if (!mentorship) {
            return res.status(404).json({ message: "Mentorship not found" });
        }
        
        // Check if user is part of this mentorship
        if (
            mentorship.mentor.toString() !== req.user._id.toString() &&
            mentorship.mentee.toString() !== req.user._id.toString()
        ) {
            return res.status(403).json({ message: "Not authorized" });
        }
        
        if (mentorship.status !== "accepted") {
            return res.status(400).json({ message: "Mentorship is not active" });
        }
        
        const isMentor = mentorship.mentor.toString() === req.user._id.toString();
        
        const session = await MentorshipSession.create({
            mentorship: mentorshipId,
            title,
            description: description || "",
            scheduledDate,
            duration: duration || 60,
            meetingLink: meetingLink || "",
            location: location || "",
            agenda: agenda || "",
            createdBy: req.user._id,
            confirmedByMentor: isMentor,
            confirmedByMentee: !isMentor,
            status: "pending",
        });
        
        // Create notification for the other party
        const otherUserId = mentorship.mentor.toString() === req.user._id.toString()
            ? mentorship.mentee
            : mentorship.mentor;
        
        await Notification.create({
            recipient: otherUserId,
            type: "sessionScheduled",
            relatedUser: req.user._id,
            relatedSession: session._id,
            relatedMentorship: mentorshipId,
        });
        
        const populatedSession = await MentorshipSession.findById(session._id)
            .populate({
                path: "mentorship",
                populate: [
                    { path: "mentor", select: "name username profilePicture headline" },
                    { path: "mentee", select: "name username profilePicture headline" },
                ],
            });
        
        res.status(201).json(populatedSession);
    } catch (error) {
        console.error("Error creating session:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Get sessions for a mentorship or all user sessions
export const getSessions = async (req, res) => {
    try {
        const { mentorshipId, status } = req.query;
        
        let filter = {};
        
        if (mentorshipId) {
            filter.mentorship = mentorshipId;
        } else {
            // Get all sessions for user's mentorships
            const userMentorships = await Mentorship.find({
                $or: [{ mentor: req.user._id }, { mentee: req.user._id }],
            }).select("_id");
            
            filter.mentorship = { $in: userMentorships.map(m => m._id) };
        }
        
        if (status) {
            filter.status = status;
        }
        
        const sessions = await MentorshipSession.find(filter)
            .populate({
                path: "mentorship",
                populate: [
                    { path: "mentor", select: "name username profilePicture headline" },
                    { path: "mentee", select: "name username profilePicture headline" },
                ],
            })
            .sort({ scheduledDate: -1 });
        
        res.status(200).json(sessions);
    } catch (error) {
        console.error("Error fetching sessions:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Get session by ID
export const getSessionById = async (req, res) => {
    try {
        const { sessionId } = req.params;
        
        const session = await MentorshipSession.findById(sessionId)
            .populate({
                path: "mentorship",
                populate: [
                    { path: "mentor", select: "name username profilePicture headline" },
                    { path: "mentee", select: "name username profilePicture headline" },
                ],
            });
        
        if (!session) {
            return res.status(404).json({ message: "Session not found" });
        }
        
        // Check if user is part of this mentorship
        if (
            session.mentorship.mentor._id.toString() !== req.user._id.toString() &&
            session.mentorship.mentee._id.toString() !== req.user._id.toString()
        ) {
            return res.status(403).json({ message: "Not authorized" });
        }
        
        res.status(200).json(session);
    } catch (error) {
        console.error("Error fetching session:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Update session
export const updateSession = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const { title, description, scheduledDate, duration, meetingLink, location, agenda, status, notes, actionItems } = req.body;
        
        const session = await MentorshipSession.findById(sessionId).populate("mentorship");
        
        if (!session) {
            return res.status(404).json({ message: "Session not found" });
        }
        
        // Check if user is part of this mentorship
        if (
            session.mentorship.mentor.toString() !== req.user._id.toString() &&
            session.mentorship.mentee.toString() !== req.user._id.toString()
        ) {
            return res.status(403).json({ message: "Not authorized" });
        }
        
        if (title) session.title = title;
        if (description !== undefined) session.description = description;
        if (scheduledDate) session.scheduledDate = scheduledDate;
        if (duration) session.duration = duration;
        if (meetingLink !== undefined) session.meetingLink = meetingLink;
        if (location !== undefined) session.location = location;
        if (agenda !== undefined) session.agenda = agenda;
        if (status) session.status = status;
        if (notes !== undefined) session.notes = notes;
        if (actionItems) session.actionItems = actionItems;
        
        await session.save();
        
        const populatedSession = await MentorshipSession.findById(session._id)
            .populate({
                path: "mentorship",
                populate: [
                    { path: "mentor", select: "name username profilePicture headline" },
                    { path: "mentee", select: "name username profilePicture headline" },
                ],
            });
        
        res.status(200).json(populatedSession);
    } catch (error) {
        console.error("Error updating session:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Confirm session (accept proposed session time)
export const confirmSession = async (req, res) => {
    try {
        const { sessionId } = req.params;
        
        const session = await MentorshipSession.findById(sessionId).populate("mentorship");
        
        if (!session) {
            return res.status(404).json({ message: "Session not found" });
        }
        
        const isMentor = session.mentorship.mentor.toString() === req.user._id.toString();
        const isMentee = session.mentorship.mentee.toString() === req.user._id.toString();
        
        if (!isMentor && !isMentee) {
            return res.status(403).json({ message: "Not authorized" });
        }
        
        // Set confirmation based on user role
        if (isMentor) {
            session.confirmedByMentor = true;
        } else {
            session.confirmedByMentee = true;
        }
        
        // If both parties confirmed, change status to scheduled
        if (session.confirmedByMentor && session.confirmedByMentee) {
            session.status = "scheduled";
            
            // Notify the creator that session is confirmed
            await Notification.create({
                recipient: session.createdBy,
                type: "sessionScheduled",
                relatedUser: req.user._id,
                relatedSession: session._id,
                relatedMentorship: session.mentorship._id,
            });
        }
        
        await session.save();
        
        const populatedSession = await MentorshipSession.findById(session._id)
            .populate({
                path: "mentorship",
                populate: [
                    { path: "mentor", select: "name username profilePicture headline" },
                    { path: "mentee", select: "name username profilePicture headline" },
                ],
            });
        
        res.status(200).json(populatedSession);
    } catch (error) {
        console.error("Error confirming session:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Cancel/Decline session
export const cancelSession = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const { reason } = req.body;
        
        const session = await MentorshipSession.findById(sessionId).populate({
            path: "mentorship",
            populate: [
                { path: "mentor", select: "_id name username" },
                { path: "mentee", select: "_id name username" }
            ]
        });
        
        if (!session) {
            return res.status(404).json({ message: "Session not found" });
        }
        
        const isMentor = session.mentorship.mentor._id.toString() === req.user._id.toString();
        const isMentee = session.mentorship.mentee._id.toString() === req.user._id.toString();
        
        if (!isMentor && !isMentee) {
            return res.status(403).json({ message: "Not authorized" });
        }
        
        // If session is pending (not yet confirmed by both), cancel directly
        if (session.status === "pending") {
            session.status = "cancelled";
            session.cancelRequestedBy = req.user._id;
            if (reason) {
                session.cancelReason = reason;
            }
            
            await session.save({ validateBeforeSave: false });
            
            // Notify the other party about cancellation
            const otherUserId = isMentor ? session.mentorship.mentee._id : session.mentorship.mentor._id;
            
            await Notification.create({
                recipient: otherUserId,
                type: "sessionScheduled",
                relatedUser: req.user._id,
                relatedSession: session._id,
                relatedMentorship: session.mentorship._id,
            });
            
            const populatedSession = await MentorshipSession.findById(session._id)
                .populate("mentorship")
                .populate("createdBy", "name username profilePicture")
                .populate("cancelRequestedBy", "name username profilePicture");
            
            return res.status(200).json(populatedSession);
        }
        
        // If session is scheduled (both confirmed)
        if (session.status === "scheduled") {
            // Mentors can cancel directly, mentees need approval
            if (isMentor) {
                // Mentor cancels directly
                session.status = "cancelled";
                session.cancelRequestedBy = req.user._id;
                if (reason) {
                    session.cancelReason = reason;
                }
                
                await session.save({ validateBeforeSave: false });
                
                // Notify mentee about cancellation
                await Notification.create({
                    recipient: session.mentorship.mentee._id,
                    type: "sessionScheduled",
                    relatedUser: req.user._id,
                    relatedSession: session._id,
                    relatedMentorship: session.mentorship._id,
                });
                
                const populatedSession = await MentorshipSession.findById(session._id)
                    .populate("mentorship")
                    .populate("createdBy", "name username profilePicture")
                    .populate("cancelRequestedBy", "name username profilePicture");
                
                return res.status(200).json(populatedSession);
            }
            
            // Mentee cancellation requires mentor approval
            if (session.cancelRequestedBy) {
                const requestedBy = session.cancelRequestedBy.toString();
                const currentUser = req.user._id.toString();
                
                // If mentor is approving the mentee's cancel request
                if (requestedBy !== currentUser && isMentor) {
                    session.status = "cancelled";
                    if (reason) {
                        session.cancelReason = (session.cancelReason ? session.cancelReason + " | " : "") + reason;
                    }
                    
                    await session.save({ validateBeforeSave: false });
                    
                    // Notify the mentee that cancellation is approved
                    await Notification.create({
                        recipient: requestedBy,
                        type: "sessionScheduled",
                        relatedUser: req.user._id,
                        relatedSession: session._id,
                        relatedMentorship: session.mentorship._id,
                    });
                    
                    const populatedSession = await MentorshipSession.findById(session._id)
                        .populate("mentorship")
                        .populate("createdBy", "name username profilePicture")
                        .populate("cancelRequestedBy", "name username profilePicture");
                    
                    return res.status(200).json(populatedSession);
                } else if (requestedBy === currentUser) {
                    return res.status(400).json({ message: "You already requested to cancel this session" });
                }
            } else {
                // Mentee's first cancel request - save the request
                session.cancelRequestedBy = req.user._id;
                if (reason) {
                    session.cancelReason = reason;
                }
                
                await session.save({ validateBeforeSave: false });
                
                // Notify mentor about cancel request
                await Notification.create({
                    recipient: session.mentorship.mentor._id,
                    type: "sessionScheduled",
                    relatedUser: req.user._id,
                    relatedSession: session._id,
                    relatedMentorship: session.mentorship._id,
                });
                
                const populatedSession = await MentorshipSession.findById(session._id)
                    .populate("mentorship")
                    .populate("createdBy", "name username profilePicture")
                    .populate("cancelRequestedBy", "name username profilePicture");
                
                return res.status(200).json(populatedSession);
            }
        }
        
        // For other statuses, allow direct cancel
        session.status = "cancelled";
        session.cancelRequestedBy = req.user._id;
        if (reason) {
            session.cancelReason = reason;
        }
        
        await session.save({ validateBeforeSave: false });
        
        // Notify the other party about cancellation
        const otherUserId = isMentor ? session.mentorship.mentee._id : session.mentorship.mentor._id;
        
        await Notification.create({
            recipient: otherUserId,
            type: "sessionScheduled",
            relatedUser: req.user._id,
            relatedSession: session._id,
            relatedMentorship: session.mentorship._id,
        });
        
        const populatedSession = await MentorshipSession.findById(session._id)
            .populate({
                path: "mentorship",
                populate: [
                    { path: "mentor", select: "name username profilePicture headline" },
                    { path: "mentee", select: "name username profilePicture headline" },
                ],
            });
        
        res.status(200).json(populatedSession);
    } catch (error) {
        console.error("Error cancelling session:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Add feedback to session
export const addSessionFeedback = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const { feedback, rating, role } = req.body; // role: "mentor" or "mentee"
        
        const session = await MentorshipSession.findById(sessionId).populate("mentorship");
        
        if (!session) {
            return res.status(404).json({ message: "Session not found" });
        }
        
        const isMentor = session.mentorship.mentor.toString() === req.user._id.toString();
        const isMentee = session.mentorship.mentee.toString() === req.user._id.toString();
        
        if ((role === "mentor" && !isMentor) || (role === "mentee" && !isMentee)) {
            return res.status(403).json({ message: "Not authorized" });
        }
        
        if (role === "mentor") {
            session.feedback.mentorFeedback = feedback;
        } else {
            session.feedback.menteeFeedback = feedback;
            if (rating) session.feedback.rating = rating;
        }
        
        await session.save();
        
        const populatedSession = await MentorshipSession.findById(session._id)
            .populate({
                path: "mentorship",
                populate: [
                    { path: "mentor", select: "name username profilePicture headline" },
                    { path: "mentee", select: "name username profilePicture headline" },
                ],
            });
        
        res.status(200).json(populatedSession);
    } catch (error) {
        console.error("Error adding session feedback:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Delete session feedback
export const deleteSessionFeedback = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const { role } = req.body; // role: "mentor" or "mentee"
        
        const session = await MentorshipSession.findById(sessionId).populate("mentorship");
        
        if (!session) {
            return res.status(404).json({ message: "Session not found" });
        }
        
        const isMentor = session.mentorship.mentor.toString() === req.user._id.toString();
        const isMentee = session.mentorship.mentee.toString() === req.user._id.toString();
        
        if ((role === "mentor" && !isMentor) || (role === "mentee" && !isMentee)) {
            return res.status(403).json({ message: "Not authorized" });
        }
        
        if (role === "mentor") {
            session.feedback.mentorFeedback = "";
        } else {
            session.feedback.menteeFeedback = "";
            session.feedback.rating = undefined;
        }
        
        await session.save();
        
        const populatedSession = await MentorshipSession.findById(session._id)
            .populate({
                path: "mentorship",
                populate: [
                    { path: "mentor", select: "name username profilePicture headline" },
                    { path: "mentee", select: "name username profilePicture headline" },
                ],
            });
        
        res.status(200).json(populatedSession);
    } catch (error) {
        console.error("Error deleting session feedback:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Delete session
export const deleteSession = async (req, res) => {
    try {
        const { sessionId } = req.params;
        
        const session = await MentorshipSession.findById(sessionId).populate("mentorship");
        
        if (!session) {
            return res.status(404).json({ message: "Session not found" });
        }
        
        // Check if user is part of this mentorship
        if (
            session.mentorship.mentor.toString() !== req.user._id.toString() &&
            session.mentorship.mentee.toString() !== req.user._id.toString()
        ) {
            return res.status(403).json({ message: "Not authorized" });
        }
        
        await MentorshipSession.findByIdAndDelete(sessionId);
        
        res.status(200).json({ message: "Session deleted successfully" });
    } catch (error) {
        console.error("Error deleting session:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Get mentorship progress/statistics
export const getMentorshipProgress = async (req, res) => {
    try {
        const { mentorshipId } = req.params;
        
        const mentorship = await Mentorship.findById(mentorshipId)
            .populate("mentor", "name username profilePicture headline")
            .populate("mentee", "name username profilePicture headline");
        
        if (!mentorship) {
            return res.status(404).json({ message: "Mentorship not found" });
        }
        
        // Check if user is part of this mentorship
        if (
            mentorship.mentor._id.toString() !== req.user._id.toString() &&
            mentorship.mentee._id.toString() !== req.user._id.toString()
        ) {
            return res.status(403).json({ message: "Not authorized" });
        }
        
        // Get all sessions for this mentorship
        const sessions = await MentorshipSession.find({ mentorship: mentorshipId })
            .sort({ scheduledDate: -1 });
        
        const totalSessions = sessions.length;
        const completedSessions = sessions.filter(s => s.status === "completed").length;
        const upcomingSessions = sessions.filter(s => 
            s.status === "scheduled" && new Date(s.scheduledDate) > new Date()
        ).length;
        
        // Calculate average rating
        const sessionsWithRatings = sessions.filter(s => s.feedback.rating);
        const averageRating = sessionsWithRatings.length > 0
            ? sessionsWithRatings.reduce((sum, s) => sum + s.feedback.rating, 0) / sessionsWithRatings.length
            : 0;
        
        // Get all action items
        const allActionItems = sessions.flatMap(s => s.actionItems);
        const completedActionItems = allActionItems.filter(item => item.completed).length;
        const totalActionItems = allActionItems.length;
        
        const progress = {
            mentorship,
            stats: {
                totalSessions,
                completedSessions,
                upcomingSessions,
                averageRating: averageRating.toFixed(1),
                actionItemsCompleted: completedActionItems,
                totalActionItems,
                completionRate: totalActionItems > 0 ? ((completedActionItems / totalActionItems) * 100).toFixed(1) : 0,
            },
            recentSessions: sessions.slice(0, 5),
        };
        
        res.status(200).json(progress);
    } catch (error) {
        console.error("Error fetching mentorship progress:", error);
        res.status(500).json({ message: "Server error" });
    }
};
