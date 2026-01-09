const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: String,
    email: { type: String, unique: true },
    password: String,
    role: {
      type: String,
      enum: ["USER", "ORGANIZER", "ADMIN"],
      default: "USER",
    },
    organizationName: String,
    address: String,
    bio: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
