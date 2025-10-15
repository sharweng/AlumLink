import Notification from "../models/Notification.js"
import Discussion from "../models/Discussion.js"
import Post from "../models/Post.js"
import DeletedReminder from "../models/DeletedReminder.js"
import Event from "../models/Event.js"

export const getUserNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({ recipient: req.user._id }).sort({ createdAt: -1 })
        .populate("relatedUser", "name username profilePicture")
        .populate("relatedPost", "content image")
        .populate("relatedJobPost", "title company location")
        .populate("relatedDiscussion", "title category")
        .populate("relatedEvent", "title eventDate eventTime location")

        // For discussion notifications with comments, add comment content
        const notificationsWithComments = await Promise.all(
            notifications.map(async (notification) => {
                const notifObj = notification.toObject();
                
                // If notification has a related comment for discussion, fetch the comment content
                if (notifObj.relatedDiscussion && notifObj.relatedComment) {
                    try {
                        const discussion = await Discussion.findById(notifObj.relatedDiscussion._id);
                        if (discussion) {
                            const comment = discussion.comments.id(notifObj.relatedComment);
                            if (comment) {
                                notifObj.commentContent = comment.content;
                                
                                // If it's a reply notification, get the reply content instead
                                if (notifObj.relatedReply) {
                                    const reply = comment.replies.id(notifObj.relatedReply);
                                    if (reply) {
                                        notifObj.commentContent = reply.content;
                                    }
                                }
                            }
                        }
                    } catch (err) {
                        // If error fetching comment, just continue without it
                        console.log("Error fetching discussion comment content:", err.message);
                    }
                }
                
                // If notification has a related comment for post, fetch the comment content
                if (notifObj.relatedPost && notifObj.relatedComment) {
                    try {
                        const post = await Post.findById(notifObj.relatedPost._id);
                        if (post) {
                            const comment = post.comments.id(notifObj.relatedComment);
                            if (comment) {
                                notifObj.commentContent = comment.content;
                                
                                // If it's a reply notification, get the reply content instead
                                if (notifObj.relatedReply) {
                                    const reply = comment.replies.id(notifObj.relatedReply);
                                    if (reply) {
                                        notifObj.commentContent = reply.content;
                                    }
                                }
                            }
                        }
                    } catch (err) {
                        // If error fetching comment, just continue without it
                        console.log("Error fetching post comment content:", err.message);
                    }
                }
                
                return notifObj;
            })
        );

        res.status(200).json(notificationsWithComments)
    } catch (error) {
        console.log("Error in getUserNotifications notificationController:", error.message)
        res.status(500).json({ message: "Internal server error" })
    }
}

export const markNotificationAsRead = async (req, res) => {
    try {
        const notificationId = req.params.id;
        const notification = await Notification.findByIdAndUpdate(
            { _id: notificationId, recipient: req.user._id },
            { read: true },
            { new: true }
        );

        res.json(notification)
    } catch (error) {
        console.log("Error in markNotificationAsRead notificationController:", error.message)
        res.status(500).json({ message: "Internal server error" })
    }
}

export const deleteNotification = async (req, res) => {
    try {
        const notificationId = req.params.id;
        const notification = await Notification.findOne({ _id: notificationId, recipient: req.user._id });
        
        if (!notification) {
            return res.status(404).json({ message: "Notification not found" });
        }

        // If it's an eventReminder notification, track that it was deleted
        if (notification.type === 'eventReminder' && notification.relatedEvent) {
            try {
                const event = await Event.findById(notification.relatedEvent);
                if (event && event.eventDate && event.eventTime) {
                    // Calculate when the 24-hour window started for this event
                    const [hours, minutes] = event.eventTime.split(':').map(Number);
                    const dateParts = event.eventDate.split('-');
                    const eventStart = new Date(
                        parseInt(dateParts[0]),
                        parseInt(dateParts[1]) - 1,
                        parseInt(dateParts[2]),
                        hours,
                        minutes,
                        0,
                        0
                    );
                    const reminderWindowStart = new Date(eventStart.getTime() - (24 * 60 * 60 * 1000));

                    // Create a record that this user deleted this reminder for this window
                    await DeletedReminder.create({
                        user: req.user._id,
                        event: notification.relatedEvent,
                        reminderWindowStart: reminderWindowStart,
                    });

                    console.log(`[DELETED REMINDER] User ${req.user._id} deleted reminder for event ${notification.relatedEvent} (window: ${reminderWindowStart})`);
                }
            } catch (err) {
                console.log("Error tracking deleted reminder:", err.message);
                // Continue with deletion even if tracking fails
            }
        }

        await Notification.findOneAndDelete({ _id: notificationId, recipient: req.user._id });

        res.json({ message: "Notification deleted successfully" })
    } catch (error) {
        console.log("Error in deleteNotification notificationController:", error.message)
        res.status(500).json({ message: "Internal server error" })
    }
}