import Event from "../models/Event.js";
import Notification from "../models/Notification.js";
import cloudinary from "../lib/cloudinary.js";
import { v4 as uuidv4 } from "uuid";

// Helper function to calculate event status based on current time
const calculateEventStatus = (eventDate, eventTime, eventDuration, currentStatus) => {
  // If event is cancelled, keep it cancelled
  if (currentStatus === 'cancelled') {
    return 'cancelled';
  }

  // Safety checks for required fields
  if (!eventDate || !eventTime) {
    console.log('Missing eventDate or eventTime, returning upcoming as default');
    return 'upcoming';
  }

  // Default duration to 2 hours if not provided (backward compatibility)
  const duration = eventDuration || 2;

  const now = new Date();
  
  try {
    // Parse event start time
    const [hours, minutes] = eventTime.split(':').map(Number);
    const eventStart = new Date(eventDate);
    eventStart.setHours(hours, minutes, 0, 0);
    
    // Calculate event end time by adding duration (in hours)
    const eventEnd = new Date(eventStart.getTime() + duration * 60 * 60 * 1000);

    // Determine status based on current time
    if (now < eventStart) {
      return 'upcoming';
    } else if (now >= eventStart && now <= eventEnd) {
      return 'ongoing';
    } else {
      return 'completed';
    }
  } catch (error) {
    console.log('Error calculating event status:', error.message);
    return 'upcoming'; // Default to upcoming if calculation fails
  }
};// Get all events with filters
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
        }
        
        let events = await Event.find(query)
            .populate("organizer", "name username profilePicture headline")
            .populate("attendees.user", "name username profilePicture")
            .sort(sortOption);

        // Update event statuses based on current time
        for (const event of events) {
            try {
                const calculatedStatus = calculateEventStatus(event.eventDate, event.eventTime, event.eventDuration, event.status);
                if (calculatedStatus !== event.status) {
                    event.status = calculatedStatus;
                    await event.save();
                }
            } catch (error) {
                console.log(`Error updating status for event ${event._id}:`, error.message);
                // Skip this event and continue with others
                continue;
            }
        }

        // Re-filter by status after updating
        if (status && status !== 'all') {
            events = events.filter(event => event.status === status);
        }

        // Filter out events with critical missing data to prevent frontend crashes
        events = events.filter(event => {
            if (!event.title || !event.eventDate || !event.eventTime) {
                console.log(`Filtering out event ${event._id} due to missing critical data`);
                return false;
            }
            return true;
        });

        // Custom sort for popular: going count > interested count > event date
        if (sort === 'popular') {
            events = events.sort((a, b) => {
                const aGoing = a.attendees.filter(att => att.rsvpStatus === 'going').length;
                const bGoing = b.attendees.filter(att => att.rsvpStatus === 'going').length;
                
                if (aGoing !== bGoing) {
                    return bGoing - aGoing; // More going first
                }
                
                const aInterested = a.attendees.filter(att => att.rsvpStatus === 'interested').length;
                const bInterested = b.attendees.filter(att => att.rsvpStatus === 'interested').length;
                
                if (aInterested !== bInterested) {
                    return bInterested - aInterested; // More interested first
                }
                
                // If both are equal, sort by event date (soonest first)
                return new Date(a.eventDate) - new Date(b.eventDate);
            });
        }

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
        const { title, description, type, eventDate, eventTime, eventDuration, location, isVirtual, virtualLink, capacity, requiresTicket, ticketPrice, images, tags } = req.body;

        if (!title || !description || !type || !eventDate || !eventTime || !eventDuration || !location) {
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

        // Calculate initial status
        const initialStatus = calculateEventStatus(eventDate, eventTime, eventDuration, 'upcoming');

        const newEvent = new Event({
            organizer: req.user._id,
            title,
            description,
            type,
            eventDate,
            eventTime,
            eventDuration,
            location,
            isVirtual: isVirtual || false,
            virtualLink: isVirtual ? virtualLink : undefined,
            capacity: capacity || 0,
            requiresTicket: requiresTicket || false,
            ticketPrice: requiresTicket ? ticketPrice : 0,
            status: initialStatus,
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
        const { title, description, type, eventDate, eventTime, eventDuration, location, isVirtual, virtualLink, capacity, requiresTicket, ticketPrice, tags, status, removedImages, newImages } = req.body;

        const event = await Event.findById(eventId);

        if (!event) {
            return res.status(404).json({ message: "Event not found" });
        }

        // Check if the current user is the organizer
        if (event.organizer.toString() !== userId.toString()) {
            return res.status(403).json({ message: "You are not authorized to edit this event" });
        }

        // Track if status is being changed to cancelled
        const wasCancelled = status === 'cancelled' && event.status !== 'cancelled';
        
        // Track if any important fields are being updated (for eventUpdate notification)
        const importantFieldsUpdated = 
            (title !== undefined && title !== event.title) ||
            (description !== undefined && description !== event.description) ||
            (eventDate !== undefined && eventDate !== event.eventDate) ||
            (eventTime !== undefined && eventTime !== event.eventTime) ||
            (eventDuration !== undefined && eventDuration !== event.eventDuration) ||
            (location !== undefined && location !== event.location) ||
            (isVirtual !== undefined && isVirtual !== event.isVirtual);

        // Update fields
        if (title !== undefined) event.title = title;
        if (description !== undefined) event.description = description;
        if (type !== undefined) event.type = type;
        if (eventDate !== undefined) event.eventDate = eventDate;
        if (eventTime !== undefined) event.eventTime = eventTime;
        if (eventDuration !== undefined) event.eventDuration = eventDuration;
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
                // Extract public_id from Cloudinary URL
                // URL format: https://res.cloudinary.com/<cloud_name>/image/upload/<version>/<public_id>.<format>
                const urlParts = imageUrl.split('/');
                const uploadIndex = urlParts.indexOf('upload');
                if (uploadIndex !== -1 && uploadIndex + 1 < urlParts.length) {
                    // Get everything after 'upload/' and before the file extension
                    const publicIdWithExt = urlParts.slice(uploadIndex + 1).join('/');
                    const publicId = publicIdWithExt.substring(0, publicIdWithExt.lastIndexOf('.'));
                    
                    try {
                        await cloudinary.uploader.destroy(publicId);
                    } catch (err) {
                        console.log("Error deleting image from Cloudinary:", err);
                    }
                }
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

        // Recalculate status based on date/time unless manually set to cancelled
        const calculatedStatus = calculateEventStatus(event.eventDate, event.eventTime, event.eventDuration, event.status);
        event.status = calculatedStatus;

        event.editedAt = new Date();
        await event.save();

        // Send notifications to attendees
        if (event.attendees && event.attendees.length > 0) {
            // Send cancelled notification
            if (wasCancelled) {
                for (const attendee of event.attendees) {
                    if (attendee.user.toString() !== userId.toString()) {
                        const notification = new Notification({
                            recipient: attendee.user,
                            type: 'eventCancelled',
                            relatedEvent: eventId,
                        });
                        await notification.save();
                    }
                }
            }
            // Send update notification (only if not cancelled, since cancelled has its own)
            else if (importantFieldsUpdated) {
                for (const attendee of event.attendees) {
                    if (attendee.user.toString() !== userId.toString()) {
                        const notification = new Notification({
                            recipient: attendee.user,
                            type: 'eventUpdate',
                            relatedEvent: eventId,
                        });
                        await notification.save();
                    }
                }
            }
        }

        const updatedEvent = await Event.findById(eventId)
            .populate("organizer", "name username profilePicture headline")
            .populate("attendees.user", "name username profilePicture");

        res.status(200).json(updatedEvent);
    } catch (error) {
        console.log("Error in updateEvent:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Cancel event
export const cancelEvent = async (req, res) => {
    try {
        const eventId = req.params.id;
        const userId = req.user._id;

        const event = await Event.findById(eventId);

        if (!event) {
            return res.status(404).json({ message: "Event not found" });
        }

        // Check if the current user is the organizer
        if (event.organizer.toString() !== userId.toString()) {
            return res.status(403).json({ message: "You are not authorized to cancel this event" });
        }

        // Update status to cancelled
        event.status = 'cancelled';
        await event.save();

        // Send cancellation notifications to all attendees
        if (event.attendees && event.attendees.length > 0) {
            for (const attendee of event.attendees) {
                if (attendee.user.toString() !== userId.toString()) {
                    const notification = new Notification({
                        recipient: attendee.user,
                        type: 'eventCancelled',
                        relatedEvent: eventId,
                    });
                    await notification.save();
                }
            }
        }

        const cancelledEvent = await Event.findById(eventId)
            .populate("organizer", "name username profilePicture headline")
            .populate("attendees.user", "name username profilePicture");

        res.status(200).json(cancelledEvent);
    } catch (error) {
        console.log("Error in cancelEvent:", error.message);
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
            // Send notification based on previous status before removing RSVP
            if (existingRsvp && event.organizer.toString() !== userId.toString()) {
                const notificationType = existingRsvp.rsvpStatus === 'going' ? 'eventRSVP' : 'eventInterested';
                const newNotification = new Notification({
                    recipient: event.organizer,
                    type: notificationType,
                    relatedUser: userId,
                    relatedEvent: eventId,
                    metadata: { action: 'removed' }, // Track that this is a removal
                });
                await newNotification.save();
            }
            
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
                // Check if status actually changed
                const statusChanged = existingRsvp.rsvpStatus !== rsvpStatus;
                const previousStatus = existingRsvp.rsvpStatus;
                
                // Update existing RSVP
                existingRsvp.rsvpStatus = rsvpStatus;
                
                // Create notification for organizer if status changed
                if (statusChanged && event.organizer.toString() !== userId.toString()) {
                    const notificationType = rsvpStatus === 'going' ? 'eventRSVP' : 'eventInterested';
                    const newNotification = new Notification({
                        recipient: event.organizer,
                        type: notificationType,
                        relatedUser: userId,
                        relatedEvent: eventId,
                        metadata: { action: 'changed' }, // Track that this is a status change
                    });
                    await newNotification.save();
                }
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

                // Create notification for organizer for new RSVP
                if (event.organizer.toString() !== userId.toString()) {
                    const notificationType = rsvpStatus === 'going' ? 'eventRSVP' : 'eventInterested';
                    const newNotification = new Notification({
                        recipient: event.organizer,
                        type: notificationType,
                        relatedUser: userId,
                        relatedEvent: eventId,
                        metadata: { action: 'added' }, // Track that this is a new RSVP
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
