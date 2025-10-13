import Notification from "../models/Notification.js"
import Discussion from "../models/Discussion.js"

export const getUserNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({ recipient: req.user._id }).sort({ createdAt: -1 })
        .populate("relatedUser", "name username profilePicture")
        .populate("relatedPost", "content image")
        .populate("relatedJobPost", "title company location")
        .populate("relatedDiscussion", "title category")

        // For discussion notifications with comments, add comment content
        const notificationsWithComments = await Promise.all(
            notifications.map(async (notification) => {
                const notifObj = notification.toObject();
                
                // If notification has a related comment, fetch the comment content
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
                        console.log("Error fetching comment content:", err.message);
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
        await Notification.findOneAndDelete({ _id: notificationId, recipient: req.user._id });

        res.json({ message: "Notification deleted successfully" })
    } catch (error) {
        console.log("Error in deleteNotification notificationController:", error.message)
        res.status(500).json({ message: "Internal server error" })
    }
}