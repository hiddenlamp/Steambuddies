const mongoose = require("mongoose");
const Project = require("../models/Project");
const ProjectAssignment = require("../models/ProjectAssignment");
const User = require("../models/User");

// ---------------- helpers ----------------
const cleanArr = (arr) =>
  Array.isArray(arr)
    ? arr.map((x) => String(x || "").trim()).filter(Boolean)
    : [];

function normalizeLang(v) {
  if (!v) return { en: "", hi: "" };

  if (typeof v === "object" && v !== null) {
    return {
      en: String(v.en || "").trim(),
      hi: String(v.hi || v.en || "").trim(),
    };
  }

  const s = String(v).trim();
  return { en: s, hi: s };
}

function pickUserId(req) {
  return (
    req.userIdObj ||
    req.userId ||
    req.auth?.userIdObj ||
    req.auth?.userId ||
    req.user?._id ||
    req.user?.id ||
    null
  );
}

function pickRole(req) {
  return req.user?.role || req.auth?.role || null;
}

function escapeRegex(text = "") {
  return String(text).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

function toObjectId(id) {
  return new mongoose.Types.ObjectId(String(id));
}

function normalizeClassLevel(value) {
  return String(value || "").trim();
}

// ---------------- create project ----------------
exports.createProject = async (req, res) => {
  try {
    const userIdObj = pickUserId(req);

    if (!userIdObj) {
      return res.status(401).json({
        ok: false,
        message: "Unauthorized",
      });
    }

    const body = req.body || {};
    const title = body.title;
    const category = String(body.category || "").trim();
    const videoUrl = String(body.videoUrl || "").trim();

    if (!title) {
      return res.status(400).json({
        ok: false,
        message: "title is required",
      });
    }

    if (!category) {
      return res.status(400).json({
        ok: false,
        message: "category is required",
      });
    }

    if (!videoUrl) {
      return res.status(400).json({
        ok: false,
        message: "videoUrl is required",
      });
    }

    const doc = await Project.create({
      title: normalizeLang(title),
      category,
      description: String(body.description || "").trim(),
      level: normalizeLang(body.level),
      duration: normalizeLang(body.duration),

      outcomes: cleanArr(body.outcomes),
      projects: cleanArr(body.projects),
      tags: cleanArr(body.tags),

      videoUrl,
      thumbUrl: String(body.thumbUrl || "").trim(),
      resourceUrl: String(body.resourceUrl || "").trim(),

      status: body.status === "draft" ? "draft" : "published",

      createdBy: userIdObj,
      educatorName: req.user?.fullName || req.user?.name || "",
    });

    return res.status(201).json({
      ok: true,
      data: doc,
    });
  } catch (e) {
    console.error("createProject error =>", e);
    return res.status(500).json({
      ok: false,
      message: "Failed to create project",
      error: e?.message,
    });
  }
};

// ---------------- optional public projects ----------------
exports.getPublicProjects = async (req, res) => {
  try {
    const category = req.query?.category
      ? String(req.query.category).trim()
      : "";

    const q = req.query?.q ? String(req.query.q).trim() : "";

    const filter = {
      status: "published",
    };

    if (category) {
      filter.category = category;
    }

    if (q) {
      const rx = new RegExp(escapeRegex(q), "i");
      filter.$or = [
        { "title.en": rx },
        { "title.hi": rx },
        { description: rx },
        { tags: { $in: [rx] } },
        { educatorName: rx },
      ];
    }

    const list = await Project.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    return res.json({
      ok: true,
      data: list,
    });
  } catch (e) {
    console.error("getPublicProjects error =>", e);
    return res.status(500).json({
      ok: false,
      message: "Failed to fetch projects",
      error: e?.message,
    });
  }
};

// ---------------- student assigned projects only ----------------
exports.getStudentProjects = async (req, res) => {
  try {
    const userIdObj = pickUserId(req);

    if (!userIdObj) {
      return res.status(401).json({
        ok: false,
        message: "Unauthorized",
      });
    }

    const category = req.query?.category
      ? String(req.query.category).trim()
      : "";

    const q = req.query?.q ? String(req.query.q).trim() : "";

    const studentUser = await User.findOne({
      _id: userIdObj,
      role: "student",
    }).lean();

    if (!studentUser) {
      return res.status(404).json({
        ok: false,
        message: "Student user not found",
      });
    }

    const schoolIdRaw =
      studentUser.schoolId ||
      studentUser.school ||
      studentUser.schoolRef ||
      "";

    const classLevelRaw =
      studentUser.classLevel ||
      studentUser.className ||
      studentUser.class ||
      studentUser.standard ||
      "";

    const schoolId = String(schoolIdRaw || "").trim();
    const classLevel = normalizeClassLevel(classLevelRaw);

    if (!schoolId || !classLevel) {
      return res.status(400).json({
        ok: false,
        message: "Student school/class not configured properly in User model",
      });
    }

    if (!isValidObjectId(schoolId)) {
      return res.status(400).json({
        ok: false,
        message: "Invalid schoolId in student user profile",
      });
    }

    const assignments = await ProjectAssignment.find({
      schoolId: toObjectId(schoolId),
      classLevel,
      status: "active",
    })
      .select("projectId")
      .lean();

    const projectIds = assignments
      .map((item) => item.projectId)
      .filter((id) => id && isValidObjectId(id));

    if (!projectIds.length) {
      return res.json({
        ok: true,
        data: [],
      });
    }

    const filter = {
      _id: { $in: projectIds.map((id) => toObjectId(id)) },
      status: "published",
    };

    if (category) {
      filter.category = category;
    }

    if (q) {
      const rx = new RegExp(escapeRegex(q), "i");
      filter.$or = [
        { "title.en": rx },
        { "title.hi": rx },
        { description: rx },
        { tags: { $in: [rx] } },
        { educatorName: rx },
      ];
    }

    const list = await Project.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    return res.json({
      ok: true,
      data: list,
    });
  } catch (e) {
    console.error("getStudentProjects error =>", e);
    return res.status(500).json({
      ok: false,
      message: "Failed to fetch student projects",
      error: e?.message,
    });
  }
};

// ---------------- educator my projects ----------------
exports.getMyProjects = async (req, res) => {
  try {
    const userIdObj = pickUserId(req);

    if (!userIdObj) {
      return res.status(401).json({
        ok: false,
        message: "Unauthorized",
      });
    }

    const list = await Project.find({ createdBy: userIdObj })
      .sort({ createdAt: -1 })
      .lean();

    return res.json({
      ok: true,
      data: list,
    });
  } catch (e) {
    console.error("getMyProjects error =>", e);
    return res.status(500).json({
      ok: false,
      message: "Failed to fetch my projects",
      error: e?.message,
    });
  }
};

// ---------------- single project ----------------
exports.getProjectById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        ok: false,
        message: "Invalid project id",
      });
    }

    const doc = await Project.findById(id).lean();

    if (!doc) {
      return res.status(404).json({
        ok: false,
        message: "Project not found",
      });
    }

    return res.json({
      ok: true,
      data: doc,
    });
  } catch (e) {
    console.error("getProjectById error =>", e);
    return res.status(500).json({
      ok: false,
      message: "Failed to fetch project",
      error: e?.message,
    });
  }
};

// ---------------- update project ----------------
exports.updateProject = async (req, res) => {
  try {
    const userIdObj = pickUserId(req);

    if (!userIdObj) {
      return res.status(401).json({
        ok: false,
        message: "Unauthorized",
      });
    }

    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        ok: false,
        message: "Invalid project id",
      });
    }

    const proj = await Project.findById(id);

    if (!proj) {
      return res.status(404).json({
        ok: false,
        message: "Project not found",
      });
    }

    const role = pickRole(req);
    const isAdmin = role === "admin";

    if (!isAdmin && String(proj.createdBy) !== String(userIdObj)) {
      return res.status(403).json({
        ok: false,
        message: "Not allowed",
      });
    }

    const body = req.body || {};

    if (body.title !== undefined) {
      proj.title = normalizeLang(body.title);
    }

    if (body.category !== undefined) {
      proj.category = String(body.category || "").trim();
    }

    if (body.description !== undefined) {
      proj.description = String(body.description || "").trim();
    }

    if (body.level !== undefined) {
      proj.level = normalizeLang(body.level);
    }

    if (body.duration !== undefined) {
      proj.duration = normalizeLang(body.duration);
    }

    if (body.outcomes !== undefined) {
      proj.outcomes = cleanArr(body.outcomes);
    }

    if (body.projects !== undefined) {
      proj.projects = cleanArr(body.projects);
    }

    if (body.tags !== undefined) {
      proj.tags = cleanArr(body.tags);
    }

    if (body.videoUrl !== undefined) {
      proj.videoUrl = String(body.videoUrl || "").trim();
    }

    if (body.thumbUrl !== undefined) {
      proj.thumbUrl = String(body.thumbUrl || "").trim();
    }

    if (body.resourceUrl !== undefined) {
      proj.resourceUrl = String(body.resourceUrl || "").trim();
    }

    if (body.status !== undefined) {
      proj.status = body.status === "draft" ? "draft" : "published";
    }

    await proj.save();

    return res.json({
      ok: true,
      data: proj,
    });
  } catch (e) {
    console.error("updateProject error =>", e);
    return res.status(500).json({
      ok: false,
      message: "Failed to update project",
      error: e?.message,
    });
  }
};

// ---------------- delete project ----------------
exports.deleteProject = async (req, res) => {
  try {
    const userIdObj = pickUserId(req);

    if (!userIdObj) {
      return res.status(401).json({
        ok: false,
        message: "Unauthorized",
      });
    }

    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        ok: false,
        message: "Invalid project id",
      });
    }

    const proj = await Project.findById(id);

    if (!proj) {
      return res.status(404).json({
        ok: false,
        message: "Project not found",
      });
    }

    const role = pickRole(req);
    const isAdmin = role === "admin";

    if (!isAdmin && String(proj.createdBy) !== String(userIdObj)) {
      return res.status(403).json({
        ok: false,
        message: "Not allowed",
      });
    }

    await ProjectAssignment.deleteMany({ projectId: proj._id });
    await Project.deleteOne({ _id: proj._id });

    return res.json({
      ok: true,
      data: { deleted: true },
    });
  } catch (e) {
    console.error("deleteProject error =>", e);
    return res.status(500).json({
      ok: false,
      message: "Failed to delete project",
      error: e?.message,
    });
  }
};