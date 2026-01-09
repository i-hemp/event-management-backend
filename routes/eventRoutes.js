const express = require("express");
const {
  getEvents,
  createEvent,
  getEventById,
  updateEvent,
  deleteEvent,
} = require("../controllers/eventController");

const { verifyToken: auth } = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");

const router = express.Router();

router.get("/", getEvents);
router.post("/", auth, role("ORGANIZER"), createEvent);
router.get("/:id", getEventById);
router.put("/:id", auth, role("ORGANIZER", "ADMIN"), updateEvent);
router.delete("/:id", auth, role("ORGANIZER", "ADMIN"), deleteEvent);

module.exports = router;
