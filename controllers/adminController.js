const User = require('../models/User');
const Event = require('../models/Event');
const Booking = require('../models/Booking');

// DELETE /api/admin/clear-events
// Clears ALL events and ALL bookings
exports.clearAllEvents = async (req, res) => {
    try {
        await Event.deleteMany({});
        await Booking.deleteMany({}); // Bookings depend on events, so clear them too
        res.json({ message: 'All EVENTS and BOOKINGS have been cleared.' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// DELETE /api/admin/clear-users
// Clears ALL users with role 'USER'
// Also deletes their bookings to maintain integrity
exports.clearAllUsers = async (req, res) => {
    try {
        // Find users to delete to get their IDs (for booking deletion)
        const usersToDelete = await User.find({ role: 'USER' });
        const userIds = usersToDelete.map(u => u._id);

        await User.deleteMany({ role: 'USER' });
        await Booking.deleteMany({ userId: { $in: userIds } });

        res.json({ message: `Cleared ${usersToDelete.length} Users and their bookings.` });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// DELETE /api/admin/clear-organizers
// Clears ALL users with role 'ORGANIZER'
// Also deletes their Events and associated Bookings
exports.clearAllOrganizers = async (req, res) => {
    try {
        const organizers = await User.find({ role: 'ORGANIZER' });
        const organizerIds = organizers.map(u => u._id);

        // Find events by these organizers
        const events = await Event.find({ organizerId: { $in: organizerIds } });
        const eventIds = events.map(e => e._id);

        // 1. Delete Bookings for these events
        await Booking.deleteMany({ eventId: { $in: eventIds } });
        
        // 2. Delete Events
        await Event.deleteMany({ _id: { $in: eventIds } });

        // 3. Delete Organizers
        await User.deleteMany({ role: 'ORGANIZER' });

        res.json({ message: `Cleared ${organizers.length} Organizers, ${events.length} Events, and associated Bookings.` });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
