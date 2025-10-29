import Event from "../models/Event.js";
import Notification from "../models/Notification.js";
import DeletedReminder from "../models/DeletedReminder.js";
import ModerationLog from "../models/ModerationLog.js";
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
};

// Helper function to check if event is within 1 day (24 hours) and send reminders
const checkAndSendReminders = async (event, excludeUserId = null) => {
  try {
    if (!event.eventDate || !event.eventTime) {
      return;
    }

    const now = new Date();
    const [hours, minutes] = event.eventTime.split(':').map(Number);
    
    // Parse the event date (format: YYYY-MM-DD)
    const dateParts = event.eventDate.split('-');
    const eventStart = new Date(
      parseInt(dateParts[0]), // year
      parseInt(dateParts[1]) - 1, // month (0-indexed)
      parseInt(dateParts[2]), // day
      hours,
      minutes,
      0,
      0
    );

    // Calculate time difference in milliseconds and hours
    const timeDiffInMs = eventStart.getTime() - now.getTime();
    const timeDiffInHours = timeDiffInMs / (1000 * 60 * 60);
    const timeDiffInMinutes = timeDiffInMs / (1000 * 60);

    // Debug logging with more detail
    console.log(`\n[REMINDER CHECK] Event: ${event.title}`);
    console.log(`  Event Date: ${event.eventDate}, Time: ${event.eventTime}`);
    console.log(`  Current time: ${now.toISOString()} | Local: ${now.toLocaleString('en-PH', { timeZone: 'Asia/Manila' })}`);
    console.log(`  Event time: ${eventStart.toISOString()} | Local: ${eventStart.toLocaleString('en-PH', { timeZone: 'Asia/Manila' })}`);
    console.log(`  Time diff: ${timeDiffInHours.toFixed(4)} hours (${timeDiffInMinutes.toFixed(2)} minutes)`);
    console.log(`  Exact 24h threshold: ${timeDiffInHours <= 24}`);
    console.log(`  Event not started: ${timeDiffInHours > 0}`);
    console.log(`  Within reminder window: ${timeDiffInHours > 0 && timeDiffInHours <= 24}`);

    // Check if event is within 24 hours (1 day) and hasn't started yet
    if (timeDiffInHours > 0 && timeDiffInHours <= 24) {
      console.log(`  ✓ Event is within 24 hours! Checking attendees with reminders...`);
      
      // Calculate when the 24-hour window started for this event
      const reminderWindowStart = new Date(eventStart.getTime() - (24 * 60 * 60 * 1000));
      
      // Send reminders to all attendees with reminders enabled
      for (const attendee of event.attendees) {
        // Skip the excluded user (organizer when called from updateEvent)
        if (excludeUserId && attendee.user.toString() === excludeUserId.toString()) {
          console.log(`    Skipping organizer ${attendee.user} (excluded)`);
          continue;
        }

        // Only send reminder if user has it enabled AND is either going or interested
        const isGoingOrInterested = attendee.rsvpStatus === 'going' || attendee.rsvpStatus === 'interested';
        
        if (attendee.reminderEnabled && isGoingOrInterested) {
          console.log(`    Attendee ${attendee.user} has reminder enabled (${attendee.rsvpStatus})`);
          
          // Check if user deleted a reminder for this event in this window
          const deletedReminder = await DeletedReminder.findOne({
            user: attendee.user,
            event: event._id,
            reminderWindowStart: reminderWindowStart
          });

          if (deletedReminder) {
            console.log(`    ✗ User deleted reminder for this window - respecting their choice`);
            continue;
          }
          
          // Check if a reminder was already sent within this 24-hour window
          const existingReminder = await Notification.findOne({
            recipient: attendee.user,
            type: 'eventReminder',
            relatedEvent: event._id,
            createdAt: { $gte: reminderWindowStart } // Reminder sent after window opened
          });

          console.log(`    Existing reminder in this 24h window: ${existingReminder ? 'YES' : 'NO'}`);
          if (existingReminder) {
            console.log(`      Reminder sent at: ${existingReminder.createdAt}`);
            console.log(`      Window started at: ${reminderWindowStart}`);
          }

          // Only send reminder if we haven't sent one in this 24-hour window
          if (!existingReminder) {
            console.log(`    → Sending reminder to attendee ${attendee.user}`);

            // Create new reminder notification with RSVP status in metadata
            const reminderNotification = new Notification({
              recipient: attendee.user,
              type: 'eventReminder',
              relatedEvent: event._id,
              metadata: { 
                eventDate: event.eventDate,
                eventTime: event.eventTime,
                rsvpStatus: attendee.rsvpStatus // Store going or interested
              },
            });
            await reminderNotification.save();
            console.log(`    ✓ Reminder notification created for ${attendee.rsvpStatus} user`);
          } else {
            console.log(`    ✗ Reminder already sent in this 24-hour window`);
          }
        } else if (!attendee.reminderEnabled) {
          console.log(`    Attendee ${attendee.user} has reminder disabled`);
        } else {
          console.log(`    Attendee ${attendee.user} status is ${attendee.rsvpStatus} (not going/interested)`);
        }
      }
    } else if (timeDiffInHours <= 0) {
      console.log(`  ✗ Event has already started or passed`);
    } else {
      console.log(`  ✗ Event is more than 24 hours away (${timeDiffInHours.toFixed(2)}h remaining)`);
    }
  } catch (error) {
    console.log('Error in checkAndSendReminders:', error.message);
  }
};
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
        }
        
        let events = await Event.find(query)
            .populate("organizer", "name username profilePicture headline")
            .populate("attendees.user", "name username profilePicture")
                .where('organizer.banned').ne(true) // Exclude banned organizers
                // When populating organizer, include banned field
                .populate({ path: 'organizer', select: 'name avatar banned' })
            .sort(sortOption);

        // Update event statuses based on current time
        for (const event of events) {
            try {
                const calculatedStatus = calculateEventStatus(event.eventDate, event.eventTime, event.eventDuration, event.status);
                if (calculatedStatus !== event.status) {
                    event.status = calculatedStatus;
                    await event.save();
                }
                
                // Check and send reminders for events within 24 hours
                await checkAndSendReminders(event);
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

        // Check and send reminders if event is within 24 hours
        await checkAndSendReminders(event);

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
            // Check if event is within 1 day and send reminders to attendees (excluding organizer)
            await checkAndSendReminders(event, userId);

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
                console.log(`[UPDATE NOTIFICATION] Sending update notifications to ${event.attendees.length - 1} attendees`);
                for (const attendee of event.attendees) {
                    if (attendee.user.toString() !== userId.toString()) {
                        console.log(`  → Sending update notification to attendee ${attendee.user} (${attendee.rsvpStatus})`);
                        const notification = new Notification({
                            recipient: attendee.user,
                            type: 'eventUpdate',
                            relatedEvent: eventId,
                            metadata: {
                                rsvpStatus: attendee.rsvpStatus // Store going or interested
                            }
                        });
                        await notification.save();
                    }
                }
            } else {
                console.log(`[UPDATE NOTIFICATION] No important fields updated, skipping update notifications`);
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
                
                // Auto-enable reminder for "going" status
                if (rsvpStatus === 'going') {
                    existingRsvp.reminderEnabled = true;
                }
                
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
                    rsvpDate: new Date(),
                    reminderEnabled: rsvpStatus === 'going' // Auto-enable for "going"
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

        // Check if event is within 1 day and send reminder if user just enabled it
        await checkAndSendReminders(event);

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

// Get user's RSVP'd events
export const getMyEvents = async (req, res) => {
    try {
        const userId = req.user._id;

        // Find all events where the user is an attendee
        const events = await Event.find({
            'attendees.user': userId
        })
            .populate("organizer", "name username profilePicture headline")
            .populate("attendees.user", "name username profilePicture")
            .where('organizer.banned').ne(true) // Exclude banned organizers
            .sort({ eventDate: 1 }); // Sort by soonest first

        // Update event statuses and filter out invalid events
        const validEvents = [];
        for (const event of events) {
            // Skip events with missing critical data
            if (!event.title || !event.eventDate || !event.eventTime) {
                continue;
            }

            try {
                const calculatedStatus = calculateEventStatus(event.eventDate, event.eventTime, event.eventDuration, event.status);
                if (calculatedStatus !== event.status) {
                    event.status = calculatedStatus;
                    await event.save();
                }
                
                // Check and send reminders for events within 24 hours
                await checkAndSendReminders(event);
                
                validEvents.push(event);
            } catch (error) {
                console.log(`Error updating status for event ${event._id}:`, error.message);
                continue;
            }
        }

        res.status(200).json(validEvents);
    } catch (error) {
        console.log("Error in getMyEvents:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Ban an event (admin only)
export const banEvent = async (req, res) => {
    try {
        const eventId = req.params.id;
        const { reason } = req.body;

        const event = await Event.findById(eventId);
        if (!event) return res.status(404).json({ message: 'Event not found' });

        // Only admins can ban
    if (!['admin', 'superAdmin'].includes(req.user.permission)) return res.status(403).json({ message: 'Not authorized' });

        event.banned = true;
        await event.save();

        // create moderation log
        await ModerationLog.create({ action: 'ban', targetType: 'event', targetId: eventId, performedBy: req.user._id, reason });

        const populated = await Event.findById(eventId).populate('organizer', 'name username profilePicture');
        res.status(200).json(populated);
    } catch (error) {
        console.log('Error in banEvent:', error.message);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Unban an event (admin only)
export const unbanEvent = async (req, res) => {
    try {
        const eventId = req.params.id;

        const event = await Event.findById(eventId);
        if (!event) return res.status(404).json({ message: 'Event not found' });

    if (!['admin', 'superAdmin'].includes(req.user.permission)) return res.status(403).json({ message: 'Not authorized' });

        event.banned = false;
        await event.save();

        await ModerationLog.create({ action: 'unban', targetType: 'event', targetId: eventId, performedBy: req.user._id });

        const populated = await Event.findById(eventId).populate('organizer', 'name username profilePicture');
        res.status(200).json(populated);
    } catch (error) {
        console.log('Error in unbanEvent:', error.message);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Toggle event reminder
export const toggleEventReminder = async (req, res) => {
    try {
        const eventId = req.params.id;
        const userId = req.user._id;
        const { enable } = req.body;

        console.log(`[TOGGLE REMINDER] User ${userId} toggling reminder ${enable ? 'ON' : 'OFF'} for event ${eventId}`);

        const event = await Event.findById(eventId);

        if (!event) {
            return res.status(404).json({ message: "Event not found" });
        }

        // Find user's attendee record
        const attendee = event.attendees.find(att => att.user.toString() === userId.toString());

        if (!attendee) {
            return res.status(404).json({ message: "You are not registered for this event" });
        }

        // Update reminder status
        attendee.reminderEnabled = enable;
        await event.save();

        console.log(`[TOGGLE REMINDER] Reminder ${enable ? 'enabled' : 'disabled'} for user ${userId}`);

        // If reminder is being enabled, check if event is within 1 day and send notification
        if (enable) {
            console.log(`[TOGGLE REMINDER] Checking if reminder should be sent...`);
            await checkAndSendReminders(event);
        }

        res.status(200).json({ 
            message: enable ? "Reminder enabled" : "Reminder disabled",
            reminderEnabled: attendee.reminderEnabled 
        });
    } catch (error) {
        console.log("Error in toggleEventReminder:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Check and send reminders for all user's events
export const checkEventReminders = async (req, res) => {
    try {
        const userId = req.user._id;

        // Get all events where user is an attendee with reminders enabled
        const events = await Event.find({
            'attendees': {
                $elemMatch: {
                    user: userId,
                    reminderEnabled: true,
                    rsvpStatus: { $in: ['going', 'interested'] }
                }
            },
            status: { $in: ['upcoming', 'ongoing'] }
        });

        console.log(`\n[CHECK REMINDERS] Checking ${events.length} events for user ${userId}`);

        // Check each event for reminders
        for (const event of events) {
            await checkAndSendReminders(event);
        }

        res.status(200).json({ message: "Reminders checked", eventsChecked: events.length });
    } catch (error) {
        console.log("Error in checkEventReminders:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Validate ticket (for event organizers to scan QR codes)
export const validateTicket = async (req, res) => {
    try {
        const eventId = req.params.id;
        const { ticketId, scannedData } = req.body;

        console.log(`[VALIDATE TICKET] Validating ticket ${ticketId} for event ${eventId}`);

        const event = await Event.findById(eventId)
            .populate("attendees.user", "name username profilePicture email");

        if (!event) {
            return res.status(404).json({ valid: false, message: "Event not found" });
        }

        // Check if the current user is the organizer
        if (event.organizer.toString() !== req.user._id.toString()) {
            return res.status(403).json({ valid: false, message: "Only event organizers can validate tickets" });
        }

        // Find attendee with this ticket
        const attendee = event.attendees.find(a => a.ticketId === ticketId);

        if (!attendee) {
            console.log(`[VALIDATE TICKET] Ticket ${ticketId} not found`);
            return res.status(200).json({ 
                valid: false, 
                message: "Invalid ticket - Not found in attendee list" 
            });
        }

        if (attendee.rsvpStatus !== 'going') {
            console.log(`[VALIDATE TICKET] Ticket ${ticketId} - User not marked as going`);
            return res.status(200).json({ 
                valid: false, 
                message: "Invalid ticket - RSVP status is not 'going'" 
            });
        }

        // Optional: Verify scanned data matches event details
        if (scannedData) {
            if (scannedData.eventTitle !== event.title || 
                scannedData.eventDate !== event.eventDate ||
                scannedData.eventTime !== event.eventTime) {
                console.log(`[VALIDATE TICKET] Ticket data mismatch`);
                return res.status(200).json({ 
                    valid: false, 
                    message: "Invalid ticket - Event details don't match" 
                });
            }
        }

        console.log(`[VALIDATE TICKET] ✓ Valid ticket for ${attendee.user.name}`);

        // Ticket is valid
        res.status(200).json({ 
            valid: true, 
            message: "Valid ticket - Entry granted",
            attendee: {
                name: attendee.user.name,
                username: attendee.user.username,
                email: attendee.user.email,
                profilePicture: attendee.user.profilePicture,
                ticketId: attendee.ticketId,
                rsvpDate: attendee.rsvpDate,
                rsvpStatus: attendee.rsvpStatus
            }
        });
    } catch (error) {
        console.log("Error in validateTicket:", error.message);
        res.status(500).json({ valid: false, message: "Internal server error" });
    }
};
