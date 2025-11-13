import express from "express";
import { protectRoute } from "../middleware/authMiddleware.js";
import {
    getAllEvents,
    getEventById,
    createEvent,
    updateEvent,
    cancelEvent,
    banEvent,
    unbanEvent,
    deleteEvent,
    rsvpToEvent,
    getUserTicket,
    getMyEvents,
    getEventsCreatedByMe,
    toggleEventReminder,
    checkEventReminders,
    validateTicket
} from "../controllers/eventController.js";

const router = express.Router();

router.get("/", protectRoute, getAllEvents);
router.get("/check-reminders", protectRoute, checkEventReminders);
router.get("/my-events", protectRoute, getMyEvents);
router.get("/created-by-me", protectRoute, getEventsCreatedByMe);
router.get("/:id", protectRoute, getEventById);
router.post("/create", protectRoute, createEvent);
router.put("/:id", protectRoute, updateEvent);
router.put("/:id/cancel", protectRoute, cancelEvent);
router.put('/:id/ban', protectRoute, banEvent);
router.put('/:id/unban', protectRoute, unbanEvent);
router.delete("/:id", protectRoute, deleteEvent);
router.post("/:id/rsvp", protectRoute, rsvpToEvent);
router.post("/:id/reminder", protectRoute, toggleEventReminder);
router.post("/:id/validate-ticket", protectRoute, validateTicket);
router.get("/:id/ticket", protectRoute, getUserTicket);

export default router;
