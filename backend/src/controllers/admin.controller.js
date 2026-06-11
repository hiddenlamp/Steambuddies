// src/controllers/admin.controller.js
const User = require("../models/User");
const Course = require("../models/course.model");
const MockTest = require("../models/MockTest");
const Activity = require("../models/Activity");

exports.getMetrics = async (req, res, next) => {
  try {
    const studentCount = await User.countDocuments({ role: "student" });
    const educatorCount = await User.countDocuments({ role: "educator" });
    const courseCount = await Course.countDocuments();
    const mockTestCount = await MockTest.countDocuments();
    const activityCount = await Activity.countDocuments();

    return res.status(200).json({
      ok: true,
      data: {
        students: studentCount,
        educators: educatorCount,
        courses: courseCount,
        mockTests: mockTestCount,
        activities: activityCount,
      },
    });
  } catch (err) {
    return next(err);
  }
};

exports.getUsers = async (req, res, next) => {
  try {
    const { role, search, page = 1, limit = 50 } = req.query;
    
    const query = {};
    if (role) query.role = role;
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { school: { $regex: search, $options: "i" } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await User.countDocuments(query);

    return res.status(200).json({
      ok: true,
      data: users,
      meta: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    return next(err);
  }
};

exports.deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Prevent deleting oneself
    if (req.user && String(req.user._id) === id) {
      return res.status(400).json({ ok: false, message: "Cannot delete your own admin account." });
    }

    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return res.status(404).json({ ok: false, message: "User not found." });
    }

    return res.status(200).json({ ok: true, message: "User deleted successfully." });
  } catch (err) {
    return next(err);
  }
};

exports.createEducator = async (req, res, next) => {
  try {
    const { fullName, educatorId, password, assignedSchools } = req.body;
    
    if (!fullName || !educatorId || !password) {
       return res.status(400).json({ ok: false, message: "Name, Educator ID, and password are required." });
    }

    const email = `${educatorId}@steambuddies.com`.toLowerCase();
    
    const existingUser = await User.findOne({ $or: [{ email }, { educatorId }] });
    if (existingUser) {
       return res.status(400).json({ ok: false, message: "Educator ID already exists." });
    }

    const passwordHash = await User.hashPassword(password);
    
    const newUser = await User.create({
       role: "educator",
       fullName: fullName.trim(),
       email,
       educatorId: educatorId.trim(),
       passwordHash,
       assignedSchools: Array.isArray(assignedSchools) ? assignedSchools : []
    });

    return res.status(201).json({ ok: true, message: "Educator created successfully.", data: { id: newUser._id } });
  } catch(err) {
    return next(err);
  }
};

exports.updateEducator = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { assignedSchools, fullName, password } = req.body;
    
    const user = await User.findById(id);
    if (!user || user.role !== "educator") {
       return res.status(404).json({ ok: false, message: "Educator not found." });
    }

    if (Array.isArray(assignedSchools)) {
       user.assignedSchools = assignedSchools;
    }
    if (fullName) {
       user.fullName = fullName.trim();
    }
    if (password) {
       user.passwordHash = await User.hashPassword(password);
    }

    await user.save();
    return res.status(200).json({ ok: true, message: "Educator updated successfully." });
  } catch(err) {
    return next(err);
  }
};
