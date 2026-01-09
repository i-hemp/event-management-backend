const User = require("../models/User");

// Get all users
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

// Update user (Admin or Self)
exports.updateUser = async (req, res) => {
  try {
    const { name, role, organizationName, address, bio } = req.body;
    
    // Check if admin or self
    if (req.user.role !== 'ADMIN' && req.user.userId !== req.params.id) {
        return res.status(403).json({ message: "Not authorized" });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (name) user.name = name;
    if (role && req.user.role === 'ADMIN') user.role = role; // Only admin changes role
    if (organizationName !== undefined) user.organizationName = organizationName;
    if (address !== undefined) user.address = address;
    if (bio !== undefined) user.bio = bio;
    // Email is explicitly NOT updated

    await user.save();
    res.json({ message: "User updated successfully", user: { 
        _id: user._id, 
        name: user.name, 
        email: user.email, 
        role: user.role,
        organizationName: user.organizationName,
        address: user.address,
        bio: user.bio
    }});
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

// Get current user profile
exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select("-password");
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
};

// Delete user
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await user.deleteOne();
    res.json({ message: "User removed" });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};
