const express = require("express");
const { getUsers, deleteUser, updateUser, getProfile } = require("../controllers/userController");
const { verifyToken: auth } = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");

const router = express.Router();

router.get("/profile", auth, getProfile);
router.get("/", auth, role("ADMIN"), getUsers);
router.put("/:id", auth, updateUser);
router.delete("/:id", auth, role("ADMIN"), deleteUser);

module.exports = router;
