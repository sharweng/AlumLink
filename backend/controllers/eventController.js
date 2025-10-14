import Event from "../models/Event.js";
import Notification from "../models/Notification.js";
import cloudinary from "../lib/cloudinary.js";
import { v4 as uuidv4 } from "uuid";

// Get all events with filters
export const getAllEvents = async (req, res) => {
    try {
        const { type, search, sort = 'upcoming', status = 'upcoming' } = req.query;
        
        let query = {};
        
        // Filter by type if provided
        if (type && type !== 'All') {
            query.type = type;
        }
        
        // Filter by status
        if (status && status !== 'all') {
            query.status = status;
        }
        
        // Search in title and description
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }
        
        // Determine sort order
        let sortOption = { eventDate: 1 }; // default: upcoming (soonest first)
        if (sort === 'latest') {
            sortOption = { createdAt: -1 }; // recently created
        } else if (sort === 'popular') {
            sortOption = { 'attendees': -1 }; // most attendees
        }
        
        const events = await Event.find(query)
            .populate("organizer", "name username profilePicture headline")
            .populate("attendees.user", "name username profilePicture")
            .sort(sortOption);

        res.status(200).json(events);
    } catch (error) {
        console.log("Error in getAllEvents:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Get single event by ID
export const getEventById = async (req, res) => {
    try {
        const eventId = req.params.id;
        
        const event = await Event.findById(eventId)
            .populate("organizer", "name username profilePicture headline")
            .populate("attendees.user", "name username profilePicture");

        if (!event) {
            return res.status(404).json({ message: "Event not found" });
        }

        res.status(200).json(event);
    } catch (error) {
        console.log("Error in getEventById:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Create new event
export const createEvent = async (req, res) => {
    try {
        const { title, description, type, eventDate, eventTime, location, isVirtual, virtualLink, capacity, requiresTicket, ticketPrice, images, tags } = req.body;

        if (!title || !description || !type || !eventDate || !eventTime || !location) {
            return res.status(400).json({ message: "All required fields must be provided" });
        }

        let uploadedImages = [];

        // Upload images to cloudinary
        if (images && Array.isArray(images)) {
            for (const image of images) {
                const imgResult = await cloudinary.uploader.upload(image);
                uploadedImages.push(imgResult.secure_url);
            }
        }

        const newEvent = new Event({
            organizer: req.user._id,
            title,
            description,
            type,
            eventDate,
            eventTime,
            location,
            isVirtual: isVirtual || false,
            virtualLink: isVirtual ? virtualLink : undefined,
            capacity: capacity || 0,
            requiresTicket: requiresTicket || false,
            ticketPrice: requiresTicket ? ticketPrice : 0,
            images: uploadedImages,
            tags: tags || [],
        });

        await newEvent.save();
        
        const populatedEvent = await Event.findById(newEvent._id)
            .populate("organizer", "name username profilePicture headline");
        
        res.status(201).json(populatedEvent);
    } catch (error) {
        console.log("Error in createEvent:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Update event
export const updateEvent = async (req, res) => {
    try {
        const eventId = req.params.id;
        const userId = req.user._id;
        const { title, description, type, eventDate, eventTime, location, isVirtual, virtualLink, capacity, requiresTicket, ticketPrice, tags, status, removedImages, newImages } = req.body;

        const event = await Event.findById(eventId);

        if (!event) {
            return res.status(404).json({ message: "Event not found" });
        }

        // Check if the current user is the organizer
        if (event.organizer.toString() !== userId.toString()) {
            return res.status(403).json({ message: "You are not authorized to edit this event" });
        }

        // Update fields
        if (title !== undefined) event.title = title;
        if (description !== undefined) event.description = description;
        if (type !== undefined) event.type = type;
        if (eventDate !== undefined) event.eventDate = eventDate;
        if (eventTime !== undefined) event.eventTime = eventTime;
        if (location !== undefined) event.location = location;
        if (isVirtual !== undefined) event.isVirtual = isVirtual;
        if (virtualLink !== undefined) event.virtualLink = virtualLink;
        if (capacity !== undefined) event.capacity = capacity;
        if (requiresTicket !== undefined) event.requiresTicket = requiresTicket;
        if (ticketPrice !== undefined) event.ticketPrice = ticketPrice;
        if (tags !== undefined) event.tags = tags;
        if (status !== undefined) event.status = status;

        // Handle removed images
        if (removedImages && Array.isArray(removedImages) && removedImages.length > 0) {
            for (const imageUrl of removedImages) {
                const publicId = imageUrl.split("/").pop().split(".")[0];
                await cloudinary.uploader.destroy(publicId);
                event.images = event.images.filter(img => img !== imageUrl);
            }
        }

        // Handle new images
        if (newImages && Array.isArray(newImages) && newImages.length > 0) {
            for (const image of newImages) {
                const imgResult = await cloudinary.uploader.upload(image);
                event.images.push(imgResult.secure_url);
            }
        }

        event.editedAt = new Date();
        await event.save();

        const updatedEvent = await Event.findById(eventId)
            .populate("organizer", "name username profilePicture headline")
            .populate("attendees.user", "name username profilePicture");

        res.status(200).json(updatedEvent);
    } catch (error) {
        console.log("Error in updateEvent:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Delete event
export const deleteEvent = async (req, res) => {
    try {
        const eventId = req.params.id;
        const userId = req.user._id;

        const event = await Event.findById(eventId);

        if (!event) {
            return res.status(404).json({ message: "Event not found" });
        }

        // Check if the current user is the organizer
        if (event.organizer.toString() !== userId.toString()) {
            return res.status(403).json({ message: "You are not authorized to delete this event" });
        }

        // Delete images from cloudinary
        for (const image of event.images) {
            const publicId = image.split("/").pop().split(".")[0];
            await cloudinary.uploader.destroy(publicId);
        }

        await Event.findByIdAndDelete(eventId);
        res.status(200).json({ message: "Event deleted successfully" });
    } catch (error) {
        console.log("Error in deleteEvent:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

// RSVP to event
export const rsvpToEvent = async (req, res) => {
    try {
        const eventId = req.params.id;
        const userId = req.user._id;
        const { rsvpStatus } = req.body; // 'going', 'interested', 'not_going'

        const event = await Event.findById(eventId);

        if (!event) {
            return res.status(404).json({ message: "Event not found" });
        }

        // Check if user already RSVP'd
        const existingRsvp = event.attendees.find(attendee => attendee.user.toString() === userId.toString());

        if (rsvpStatus === 'not_going') {
            // Remove RSVP
            event.attendees = event.attendees.filter(attendee => attendee.user.toString() !== userId.toString());
        } else {
            // Check capacity for 'going' status
            if (rsvpStatus === 'going' && event.capacity > 0) {
                const goingCount = event.attendees.filter(a => a.rsvpStatus === 'going').length;
                if (goingCount >= event.capacity && (!existingRsvp || existingRsvp.rsvpStatus !== 'going')) {
                    return res.status(400).json({ message: "Event is at full capacity" });
                }
            }

            if (existingRsvp) {
                // Update existing RSVP
                existingRsvp.rsvpStatus = rsvpStatus;
            } else {
                // Generate ticket ID if user is going and event requires ticket
                const ticketId = (rsvpStatus === 'going' && event.requiresTicket) ? `TICKET-${uuidv4()}` : undefined;
                
                // Create new RSVP
                event.attendees.push({
                    user: userId,
                    rsvpStatus,
                    ticketId,
                    rsvpDate: new Date()
                });

                // Create notification for organizer only if new RSVP and status is 'going'
                if (event.organizer.toString() !== userId.toString() && rsvpStatus === 'going') {
                    const newNotification = new Notification({
                        recipient: event.organizer,
                        type: 'eventRSVP',
                        relatedUser: userId,
                        relatedEvent: eventId,
                    });
                    await newNotification.save();
                }
            }
        }

        await event.save();

        const updatedEvent = await Event.findById(eventId)
            .populate("organizer", "name username profilePicture headline")
            .populate("attendees.user", "name username profilePicture");

        res.status(200).json(updatedEvent);
    } catch (error) {
        console.log("Error in rsvpToEvent:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Get user's ticket for an event
export const getUserTicket = async (req, res) => {
    try {
        const eventId = req.params.id;
        const userId = req.user._id;

        const event = await Event.findById(eventId)
            .populate("organizer", "name username profilePicture headline");

        if (!event) {
            return res.status(404).json({ message: "Event not found" });
        }

        const attendee = event.attendees.find(a => a.user.toString() === userId.toString());

        if (!attendee || attendee.rsvpStatus !== 'going') {
            return res.status(404).json({ message: "No ticket found" });
        }

        res.status(200).json({
            event: {
                title: event.title,
                type: event.type,
                eventDate: event.eventDate,
                eventTime: event.eventTime,
                location: event.location,
                isVirtual: event.isVirtual,
                virtualLink: event.virtualLink,
            },
            ticket: {
                ticketId: attendee.ticketId,
                rsvpDate: attendee.rsvpDate,
            }
        });
    } catch (error) {
        console.log("Error in getUserTicket:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};
