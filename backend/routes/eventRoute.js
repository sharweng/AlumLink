import express from "express";
import { protectRoute } from "../middleware/authMiddleware.js";
import {
    getAllEvents,
    getEventById,
    createEvent,
    updateEvent,
    cancelEvent,
    deleteEvent,
    rsvpToEvent,
    getUserTicket
} from "../controllers/eventController.js";

const router = express.Router();

router.get("/", protectRoute, getAllEvents);
router.get("/:id", protectRoute, getEventById);
router.post("/create", protectRoute, createEvent);
router.put("/:id", protectRoute, updateEvent);
router.put("/:id/cancel", protectRoute, cancelEvent);
router.delete("/:id", protectRoute, deleteEvent);
router.post("/:id/rsvp", protectRoute, rsvpToEvent);
router.get("/:id/ticket", protectRoute, getUserTicket);

export default router;
