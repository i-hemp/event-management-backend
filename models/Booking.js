const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    userId: mongoose.Schema.Types.ObjectId,
    eventId: mongoose.Schema.Types.ObjectId,
    ticketId: String,
    name: { type: String, required: true },
    email: { type: String, required: true },
    contact: { type: String, required: true },
    status: { 
        type: String, 
        enum: ["BOOKED", "CANCELLED"], 
        default: "BOOKED" 
    },
    attended: { type: Boolean, default: false },
    verifiedAt: { type: Date }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Booking", bookingSchema);
