const Leave = require("../models/Leave");
const { sendLeaveEmailToAdmin } = require("../utils/mailer");

// Educator applies for leave
exports.applyLeave = async (req, res, next) => {
  try {
    const { startDate, endDate, reason } = req.body;

    if (!startDate || !endDate || !reason) {
      return res.status(400).json({ success: false, message: "Please provide start date, end date, and reason." });
    }

    const leave = await Leave.create({
      educator: req.user._id,
      startDate,
      endDate,
      reason,
      status: "Pending",
    });

    // Send email to admin
    try {
      await sendLeaveEmailToAdmin({
        educatorName: req.user.fullName,
        startDate,
        endDate,
        reason,
      });
    } catch (mailError) {
      console.error("Failed to send leave email to admin:", mailError);
    }

    res.status(201).json({ success: true, message: "Leave applied successfully.", data: leave });
  } catch (error) {
    next(error);
  }
};

// Educator gets their own leaves
exports.getMyLeaves = async (req, res, next) => {
  try {
    const leaves = await Leave.find({ educator: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: leaves });
  } catch (error) {
    next(error);
  }
};

// Admin gets all leaves
exports.getAllLeaves = async (req, res, next) => {
  try {
    const leaves = await Leave.find().populate("educator", "fullName email phone").sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: leaves });
  } catch (error) {
    next(error);
  }
};

// Admin updates leave status
exports.updateLeaveStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, adminRemark } = req.body;

    if (!["Pending", "Approved", "Rejected"].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status." });
    }

    const leave = await Leave.findByIdAndUpdate(
      id,
      { status, adminRemark },
      { new: true, runValidators: true }
    );

    if (!leave) {
      return res.status(404).json({ success: false, message: "Leave request not found." });
    }

    res.status(200).json({ success: true, message: `Leave ${status.toLowerCase()} successfully.`, data: leave });
  } catch (error) {
    next(error);
  }
};
