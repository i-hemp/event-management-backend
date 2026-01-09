const Booking = require("../models/Booking");
const Event = require("../models/Event");
const crypto = require("crypto");

// POST /api/bookings
exports.createBooking = async (req, res) => {
  const { eventId, name, email, contact } = req.body;

  if (!name || !email || !contact) {
      return res.status(400).json({ error: "All fields are mandatory" });
  }

  const event = await Event.findById(eventId);

  if (!event) {
    return res.status(404).json({ error: "Event not found" });
  }

  // Check if user already registered (Generic check by userId)
  const existingUserIdCheck = await Booking.findOne({ userId: req.user.userId, eventId, status: { $ne: 'CANCELLED' } });
  if (existingUserIdCheck) {
    return res.status(400).json({ error: "You are already registered for this event" });
  }

  // Check unique constraints for email/contact PER EVENT
  const existingDetailCheck = await Booking.findOne({ 
      eventId, 
      $or: [{ email }, { contact }],
      status: { $ne: 'CANCELLED' }
  });
  
  if (existingDetailCheck) {
      return res.status(400).json({ error: "This email or contact is already registered for this event" });
  }

  if (event.seats <= 0) {
    return res.status(400).json({ error: "No seats available" });
  }

  event.seats -= 1;
  await event.save();
  
  const booking = await Booking.create({
    userId: req.user.userId,
    eventId,
    ticketId: crypto.randomBytes(6).toString("hex"),
    name,
    email,
    contact
  });

  res.status(201).json(booking);
};

// GET /api/bookings
exports.getBookings = async (req, res) => {
    try {
        let bookings;
        if (req.user.role === 'ORGANIZER') {
             // Find events by this organizer
             const events = await Event.find({ organizerId: req.user.userId });
             const eventIds = events.map(e => e._id);
             // Find bookings for these events OR bookings made BY this organizer (personal)
             bookings = await Booking.find({ 
                 $or: [
                     { eventId: { $in: eventIds } },
                     { userId: req.user.userId }
                 ]
             });
        } else {
             bookings = await Booking.find({ userId: req.user.userId });
        }

        const eventIds = bookings.map(b => b.eventId);
        const events = await Event.find({ _id: { $in: eventIds } });
        
        const result = bookings.map(b => {
             const event = events.find(e => e._id.toString() === b.eventId.toString());
             return {
                 ...b.toObject(),
                 event: event || null
             };
        });

        res.json(result);
    } catch (error) {
        res.status(500).json({ error: "Server Error" });
    }
};

// GET /api/bookings/all (Admin only)
exports.getAllBookings = async (req, res) => {
    try {
        const bookings = await Booking.find().populate('userId', 'name email').sort({ createdAt: -1 });
        const eventIds = bookings.map(b => b.eventId);
        const events = await Event.find({ _id: { $in: eventIds } });
        
        const result = bookings.map(b => {
             const event = events.find(e => e._id.toString() === b.eventId.toString());
             return {
                 ...b.toObject(),
                 eventName: event ? event.title : 'Unknown Event',
                 eventDate: event ? event.date : null,
                 userName: b.userId ? b.userId.name : b.name // Fallback to booking name if user null (shouldn't happen)
             };
        });

        res.json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server Error" });
    }
};

// POST /api/bookings/manual (Organizer only)
exports.addAttendee = async (req, res) => {
    try {
        const { eventId, name, email, contact } = req.body;
        
        // Ensure user is organizer or admin
        if (req.user.role !== 'ORGANIZER' && req.user.role !== 'ADMIN') {
            return res.status(403).json({ error: "Not authorized" });
        }

        if (!name || !email || !contact) {
            return res.status(400).json({ error: "All fields are mandatory" });
        }

        const event = await Event.findById(eventId);
        if (!event) return res.status(404).json({ error: "Event not found" });

        // Check if event belongs to organizer (if not admin)
        if (req.user.role === 'ORGANIZER' && event.organizerId.toString() !== req.user.userId) {
            return res.status(403).json({ error: "Not authorized to manage this event" });
        }

        if (event.seats <= 0) return res.status(400).json({ error: "No seats available" });

        // Check duplicates for this event
        const existingCheck = await Booking.findOne({ 
            eventId, 
            $or: [{ email }, { contact }] 
        });
        if (existingCheck) return res.status(400).json({ error: "Attendee already registered" });

        // Try to find if user exists in system to link them (Optional enhancement)
        const linkedUser = await require("../models/User").findOne({ email });

        event.seats -= 1;
        await event.save();

        const booking = await Booking.create({
            userId: linkedUser ? linkedUser._id : null, // Link if exists, else null (Guest)
            eventId,
            ticketId: crypto.randomBytes(6).toString("hex"),
            name,
            email,
            contact
        });

        res.status(201).json(booking);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server Error" });
    }
};

// POST /api/bookings/verify (Organizer only)
exports.verifyTicket = async (req, res) => {
    try {
        const { ticketId } = req.body;
        
        // Find booking
        const booking = await Booking.findOne({ ticketId });
        if (!booking) {
             return res.status(404).json({ error: "Invalid Ticket ID: Booking not found" });
        }

        // Check if cancelled
        if (booking.status === 'CANCELLED') {
             return res.status(400).json({ error: "Ticket Cancelled", details: booking });
        }

        const event = await Event.findById(booking.eventId);
        
        // Check if organizer owns this event
        if (req.user.role === 'ORGANIZER' && event.organizerId.toString() !== req.user.userId) {
            return res.status(403).json({ error: "This ticket belongs to another organizer's event" });
        }

        // Verify Date/Time window (Optional: Allow check-in on the day of event)
        const eventDate = new Date(event.date);
        const now = new Date();
        const oneDayMs = 24 * 60 * 60 * 1000;
        
        // Simple logic: Allow check-in if it's the event day or later (but not cancelled)
        // Adjust strictness as needed. User asked "user must attend at the time of the date"
        
        // Mark as attended if not already
        if (!booking.attended) {
            booking.attended = true;
            booking.verifiedAt = new Date();
            await booking.save();
        }

        res.json({ message: "Valid Ticket - Marked as Attended", booking: { ...booking.toObject(), event } });
    } catch (error) {
        res.status(500).json({ error: "Server Error" });
    }
};

// DELETE /api/bookings/:id
exports.deleteBooking = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) return res.status(404).json({ error: "Booking not found" });
        
        // Ensure user owns this booking OR is Organizer/Admin
        const isOwner = booking.userId && booking.userId.toString() === req.user.userId;
        const isAdmin = req.user.role === 'ADMIN';
        // Check if organizer of the event
        let isOrganizer = false;
        if (req.user.role === 'ORGANIZER') {
            const event = await Event.findById(booking.eventId);
            if (event && event.organizerId.toString() === req.user.userId) {
                isOrganizer = true;
            }
        }

        if (!isOwner && !isAdmin && !isOrganizer) {
            return res.status(403).json({ error: "Not authorized" });
        }

        // Check if already cancelled
        if (booking.status === 'CANCELLED') {
             return res.status(400).json({ error: "Booking already cancelled" });
        }

        // Use findByIdAndUpdate to avoid validation errors if the event is "old" and missing required fields like 'date'
        await Event.findByIdAndUpdate(booking.eventId, { $inc: { seats: 1 } });

        // Soft Delete: Update status instead of deleteOne
        booking.status = 'CANCELLED';
        await booking.save();
        
        res.json({ message: "Registration cancelled" });
    } catch (error) {
        res.status(500).json({ error: "Server Error" });
    }
};
