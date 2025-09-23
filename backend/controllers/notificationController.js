import Notification from "../models/Notification.js"

export const getUserNotifications = async (req, res) => {
    try {
        const notifications = (await Notification.find({ recipient: req.user._id })).sort({ createdAt: -1 })
        .populate("relatedUser", "name username profilePicture")
        .populate("relatedPost", "content image")

        res.status(200).json(notifications)
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
            { isRead: true },
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