import LinkRequest from "../models/LinkRequest.js";
import Notification from "../models/Notification.js";
import { sendLinkAcceptedEmail } from "../emails/nodemailerHandlers.js";

export const sendLinkRequest = async (req, res) => {
    try {
        const { userId } = req.params;
        const senderId = req.user._id;

        if (senderId.toString() === userId) {
            return res.status(400).json({ message: "You cannot send a link request to yourself" });
        }

        if (req.user.links.includes(userId)) {
            return res.status(400).json({ message: "You are already linked with this user" });
        }

        const existingRequest = await LinkRequest.findOne({
            sender: senderId,
            recipient: userId,
            status: "pending"
        });

        if (existingRequest) {
            return res.status(400).json({ message: "A pending link request already exists" });
        }

        const newRequest = new LinkRequest({
            sender: senderId,
            recipient: userId
        });

        await newRequest.save();
        res.status(201).json({ message: "Link request sent successfully" });
    } catch (error) {
        console.log("Error in sendLinkRequest linkController:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const acceptLinkRequest = async (req, res) => {
    try {
        const { requestId } = req.params;
        const userId = req.user._id;

        const request = await LinkRequest.findById(requestId)
        .populate("sender", "name username email")
        .populate("recipient", "name username");

        if (!request) {
            return res.status(404).json({ message: "Link request not found" });
        }

        // checks if the logged in user is the recipient of the request
        if (request.recipient._id.toString() !== userId.toString()) {
            return res.status(403).json({ message: "You are not authorized to accept this link request" });
        }

        if (request.status !== "pending") {
            return res.status(400).json({ message: `This link request has already been ${request.status}` });
        }

        request.status = "accepted";
        await request.save();

        // add each other to links array
        await User.findByIdAndUpdate(request.sender._id, { $addToSet: { links: userId} });
        await User.findByIdAndUpdate(userId, { $addToSet: { links: request.sender._id} });

        const notification = new Notification({
            recipient: request.sender._id,
            type: "linkAccepted",
            relatedUser: userId,
        })

        await notification.save();
        res.json({ message: "Link request accepted successfully" });

        const senderEmail = request.sender.email;
        const senderName = request.sender.name;
        const recipientName = request.recipient.name;
        const profileUrl = process.env.CLIENT_URL + "/profile/" + request.recipient.username;

        try {
            await sendLinkAcceptedEmail(senderEmail, senderName, recipientName, profileUrl);
        } catch (error) {
            
        }
    } catch (error) {
        console.log("Error in acceptLinkRequest linkController:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const rejectLinkRequest = async (req, res) => {
    try {
        const { requestId } = req.params;
        const userId = req.user._id;

        const request = await LinkRequest.findById(requestId);

        if (request.recipient.toString() !== userId.toString()) {
            return res.status(403).json({ message: "You are not authorized to reject this link request" });
        }

        if (request.status !== "pending") {
            return res.status(400).json({ message: `This link request has already been ${request.status}` });
        }

        request.status = "rejected";
        await request.save();

        res.json({ message: "Link request rejected successfully" });
    } catch (error) {
        console.log("Error in rejectLinkRequest linkController:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const getLinkRequests = async (req, res) => {
    try {
        const userId = req.user._id;

        const requests = await LinkRequest.find({ recipient: userId, status: "pending" })
        .populate("sender", "name username profilePicture headline links")

        res.json(requests);
    } catch (error) {
        console.log("Error in getLinkRequests linkController:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const getUserLinks = async (req, res) => {
    try {
        const userId = req.user._id;   

        const user = await User.findById(userId)
        .populate("links", "name username profilePicture headline links");

        res.json(user.links);
    } catch (error) {
        console.log("Error in getUserLinks linkController:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const removeLink = async (req, res) => {
    try {
        const myId = req.user._id;
        const { userId } = req.params;

        await User.findByIdAndUpdate(myId, { $pull: { links: userId } });
        await User.findByIdAndUpdate(userId, { $pull: { links: myId } });

        res.json({ message: "Link removed successfully" });
    } catch (error) {
        console.log("Error in removeLink linkController:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const getLinkStatus = async (req, res) => {
    try {
        const targetUserId = req.params.userId;
        const currentUserId = req.user._id;

        const currentUser = req.user
        if (currentUser.links.includes(targetUserId)) {
            return res.json({ status: "linked" });
        }

        const pendingRequest = await LinkRequest.findOne({
            $or: [
                { sender: currentUserId, recipient: targetUserId },
                { sender: targetUserId, recipient: currentUserId }
            ], status: "pending"
        });

        if (pendingRequest) {
            if (pendingRequest.sender.toString() === currentUserId.toString()) {
                return res.json({ status: "pending" });
            } else {
                return res.json({ status: "received", requestId: pendingRequest._id});
            }
        }

        // if no link or pending request exists
        res.json({ status: "not_linked" });
    } catch (error) {
        console.log("Error in getLinkStatus linkController:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
}