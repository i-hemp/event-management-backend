const Event = require("../models/Event");

// GET /api/events
exports.getEvents = async (req, res) => {
  const events = await Event.find().sort({ date: 1 });
  res.json(events);
};

// POST /api/events
exports.createEvent = async (req, res) => {
  const { title, description, date, location, seats } = req.body;

  const event = await Event.create({
    title,
    description,
    date,
    location,
    seats,
    organizerId: req.user.userId,
  });

  res.status(201).json(event);
};

// GET /api/events/:id
exports.getEventById = async (req, res) => {
  const event = await Event.findById(req.params.id);

  if (!event) {
    return res.status(404).json({ error: "Event not found" });
  }

  res.json(event);
};

// PUT /api/events/:id
exports.updateEvent = async (req, res) => {
  const event = await Event.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true }
  );

  if (!event) {
    return res.status(404).json({ error: "Event not found" });
  }

  res.json(event);
};

// DELETE /api/events/:id
exports.deleteEvent = async (req, res) => {
  const Booking = require('../models/Booking'); // Import Booking model locally if not global

  // Cascade delete bookings first
  await Booking.deleteMany({ eventId: req.params.id });

  const event = await Event.findByIdAndDelete(req.params.id);

  if (!event) {
    return res.status(404).json({ error: "Event not found" });
  }

  res.json({ message: "Event and associated bookings deleted" });
};
