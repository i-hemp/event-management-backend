const express = require("express");
const { createBooking, getBookings, deleteBooking, getAllBookings, addAttendee, verifyTicket } = require("../controllers/bookingController");
const { verifyToken: auth } = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");

const router = express.Router();

router.post("/", auth, createBooking);
router.get("/", auth, getBookings);
router.delete("/:id", auth, deleteBooking);
router.post("/manual", auth, role("ORGANIZER", "ADMIN"), addAttendee);
router.post("/verify", auth, role("ORGANIZER", "ADMIN"), verifyTicket);
router.get("/all", auth, role("ADMIN"), getAllBookings);

module.exports = router;
