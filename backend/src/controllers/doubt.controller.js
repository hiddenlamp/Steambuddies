const Doubt = require("../models/Doubt");
const User = require("../models/User");
const Notification = require("../models/Notification");

exports.createDoubt = async (req, res) => {
  try {
    const { subject, initialMessage } = req.body;
    if (!initialMessage) return res.status(400).json({ ok: false, message: "Initial message required" });

    const doubt = new Doubt({
      studentId: req.user._id,
      schoolId: req.user.schoolId,
      classLevel: req.user.classLevel || req.user.className || "General",
      subject: subject || "General",
      status: "open",
      messages: [{
        senderId: req.user._id,
        senderModel: "User",
        senderName: req.user.fullName,
        text: initialMessage
      }]
    });

    await doubt.save();

    // Notify educators of this school
    const educators = await User.find({ role: "educator", assignedSchools: req.user.schoolId });
    const notifications = educators.map(edu => ({
      recipient: edu._id,
      title: { en: "New Doubt" },
      message: { en: `${req.user.fullName} asked a new doubt.` },
      type: "doubt",
      relatedId: doubt._id,
      sender: req.user._id
    }));
    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
      const io = req.app.get("io");
      if (io) io.emit("new_notification");
    }

    res.status(201).json({ ok: true, doubt });
  } catch (error) {
    console.error("Error creating doubt:", error);
    res.status(500).json({ ok: false, message: "Server error" });
  }
};

exports.getDoubts = async (req, res) => {
  try {
    if (req.user.role === "student") {
      const doubts = await Doubt.find({ studentId: req.user._id }).sort({ updatedAt: -1 });
      return res.json({ ok: true, doubts });
    }
    
    if (req.user.role === "educator") {
      // req.user.assignedSchools contains school names (Strings). We need to map them to School ObjectIds
      const School = require("../models/SchoolModel");
      const schools = await School.find({ name: { $in: req.user.assignedSchools } });
      const schoolIds = schools.map(s => s._id);

      const doubts = await Doubt.find({ schoolId: { $in: schoolIds } })
        .populate("studentId", "fullName email")
        .sort({ updatedAt: -1 });
      return res.json({ ok: true, doubts });
    }

    // Admin or other
    const doubts = await Doubt.find().sort({ updatedAt: -1 });
    res.json({ ok: true, doubts });
  } catch (error) {
    console.error("Error fetching doubts:", error);
    res.status(500).json({ ok: false, message: "Server error" });
  }
};

exports.getDoubtById = async (req, res) => {
  try {
    const doubt = await Doubt.findById(req.params.id).populate("studentId", "fullName email school className");
    if (!doubt) return res.status(404).json({ ok: false, message: "Doubt not found" });
    res.json({ ok: true, doubt });
  } catch (error) {
    console.error("Error fetching doubt:", error);
    res.status(500).json({ ok: false, message: "Server error" });
  }
};

exports.addMessage = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ ok: false, message: "Message text required" });

    const doubt = await Doubt.findById(req.params.id);
    if (!doubt) return res.status(404).json({ ok: false, message: "Doubt not found" });

    doubt.messages.push({
      senderId: req.user._id,
      senderModel: "User",
      senderName: req.user.fullName,
      text
    });
    
    doubt.status = "open"; // Reopen if they keep chatting
    await doubt.save();

    // Notify the other party
    if (req.user.role === "student") {
      const educators = await User.find({ role: "educator", assignedSchools: doubt.schoolId });
      const notifications = educators.map(edu => ({
        recipient: edu._id,
        title: { en: "New Reply in Doubt" },
        message: { en: `${req.user.fullName} replied to a doubt.` },
        type: "doubt",
        relatedId: doubt._id,
        sender: req.user._id
      }));
      if (notifications.length > 0) {
        await Notification.insertMany(notifications);
        const io = req.app.get("io");
        if (io) io.emit("new_notification");
      }
    } else {
      await Notification.create({
        recipient: doubt.studentId,
        title: { en: "Educator Reply" },
        message: { en: `${req.user.fullName} replied to your doubt.` },
        type: "doubt",
        relatedId: doubt._id,
        sender: req.user._id
      });
      const io = req.app.get("io");
      if (io) io.emit("new_notification");
    }

    res.json({ ok: true, doubt });
  } catch (error) {
    console.error("Error adding message:", error);
    res.status(500).json({ ok: false, message: "Server error" });
  }
};

exports.markResolved = async (req, res) => {
  try {
    const doubt = await Doubt.findById(req.params.id);
    if (!doubt) return res.status(404).json({ ok: false, message: "Doubt not found" });

    doubt.status = "resolved";
    await doubt.save();
    res.json({ ok: true, doubt });
  } catch (error) {
    console.error("Error resolving doubt:", error);
    res.status(500).json({ ok: false, message: "Server error" });
  }
};
