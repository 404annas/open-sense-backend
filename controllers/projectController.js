const Project = require("../models/Project");
const { deleteImageFromCloudinary } = require("../utils/deleteFromCloudinary");

// @desc    Get all projects with pagination and search filters
const getProjects = async (req, res) => {
  try {
    let {
      page = 1,
      limit = 10,
      category,
      search,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    page = Number(page);
    limit = Number(limit);

    if (page < 1 || limit < 1 || limit > 100) {
      return res.status(400).json({
        status: false,
        message: "Invalid pagination parameters",
      });
    }

    // 🔹 FILTER
    const filter = {};

    // Apply category filter
    if (category) filter.categories = category;

    // Apply search filter - search across multiple fields using regex
    if (search) {
      const searchRegex = new RegExp(search, "i"); // 'i' flag for case-insensitive search
      filter.$or = [
        { name: { $regex: searchRegex } },
        { description: { $regex: searchRegex } },
      ];
    }

    const allowedSortFields = new Set([
      "createdAt",
      "updatedAt",
      "name",
      "displayOrder",
    ]);
    if (!allowedSortFields.has(sortBy)) {
      sortBy = "createdAt";
    }

    const normalizedSortOrder = sortOrder === "asc" ? 1 : -1;
    const sortConfig =
      sortBy === "displayOrder"
        ? { displayOrder: normalizedSortOrder, createdAt: -1 }
        : { [sortBy]: normalizedSortOrder };

    // 🔹 COUNT TOTAL
    const total = await Project.countDocuments(filter);

    // 🔹 QUERY
    const projects = await Project.find(filter)
      .populate("categories", "name")
      .sort(sortConfig)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(); // 🚀 performance boost

    res.status(200).json({
      status: true,
      message: "Projects fetched successfully",
      data: {
        projects,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalResults: total,
          resultsPerPage: limit,
          hasNextPage: page * limit < total,
          hasPrevPage: page > 1,
        },
      },
    });
  } catch (error) {
    console.error("Get Projects Error:", error);
    res.status(500).json({ status: false, message: error.message });
  }
};

// @desc    Create a project with image upload
const createProject = async (req, res) => {
  try {
    const { name, description, categories, media, displayOrder } = req.body;

    if (!name || !description) {
      return res.status(400).json({
        status: false,
        message:
          "Please provide all required fields: name, description, and categories",
      });
    }

    let parsedCategories = [];
    if (categories) {
      if (typeof categories === "string") {
        try {
          parsedCategories = JSON.parse(categories);
        } catch (e) {
          parsedCategories = categories.split(",").map((t) => t.trim());
        }
      } else {
        parsedCategories = categories;
      }
    }

    let parsedMedia = [];
    if (media) {
      if (typeof media === "string") {
        try {
          parsedMedia = JSON.parse(media);
        } catch (e) {
          // ignore if parsing fails
        }
      } else {
        parsedMedia = media;
      }
    }

    const uploadedImages = req.body.uploadedImages || [];
    const finalMedia = [...uploadedImages, ...parsedMedia];

    const parsedDisplayOrder =
      displayOrder !== undefined && displayOrder !== ""
        ? Number(displayOrder)
        : undefined;

    const project = await Project.create({
      name,
      description,
      categories: parsedCategories,
      media: finalMedia,
      displayOrder:
        Number.isNaN(parsedDisplayOrder) || parsedDisplayOrder === undefined
          ? undefined
          : parsedDisplayOrder,
      createdBy: req.user._id,
    });

    // Prepare response message
    let responseMessage = "Project created successfully";

    // Add compression messages if any
    if (req.compressionMessages && req.compressionMessages.length > 0) {
      responseMessage += `. ${req.compressionMessages.join(" ")}`;
    }

    res.status(201).json({
      status: true,
      message: responseMessage,
      data: project,
    });
  } catch (error) {
    console.error("Create Project Error:", error);
    res.status(500).json({ status: false, message: error.message });
  }
};

// @desc    Update a project with optional image upload
const updateProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res
        .status(404)
        .json({ status: false, message: "Project not found" });
    }

    // Delete old images from Cloudinary
    if (project.media && project.media.length > 0) {
      for (const mediaItem of project.media) {
        if (mediaItem.type === "image") {
          try {
            await deleteImageFromCloudinary(mediaItem.src);
          } catch (error) {
            console.error("Error deleting old image from Cloudinary:", error);
          }
        }
      }
    }

    const { name, description, categories, media, displayOrder } = req.body;

    let parsedCategories = project.categories;
    if (categories) {
      if (typeof categories === "string") {
        try {
          parsedCategories = JSON.parse(categories);
        } catch (e) {
          parsedCategories = categories.split(",").map((t) => t.trim());
        }
      } else {
        parsedCategories = categories;
      }
    }

    let parsedMedia = [];
    if (media) {
      if (typeof media === "string") {
        try {
          parsedMedia = JSON.parse(media);
        } catch (e) {
          // ignore if parsing fails
        }
      } else {
        parsedMedia = media;
      }
    }

    const uploadedImages = req.body.uploadedImages || [];
    const finalMedia = [...uploadedImages, ...parsedMedia];

    const parsedDisplayOrder =
      displayOrder !== undefined && displayOrder !== ""
        ? Number(displayOrder)
        : undefined;

    const updatedData = {
      name: name || project.name,
      description: description || project.description,
      categories: parsedCategories,
      media: finalMedia,
      displayOrder:
        Number.isNaN(parsedDisplayOrder) || parsedDisplayOrder === undefined
          ? project.displayOrder
          : parsedDisplayOrder,
    };

    const updatedProject = await Project.findByIdAndUpdate(
      req.params.id,
      updatedData,
      { new: true, runValidators: true },
    );

    // Prepare response message
    let responseMessage = "Project updated successfully";

    // Add compression messages if any
    if (req.compressionMessages && req.compressionMessages.length > 0) {
      responseMessage += `. ${req.compressionMessages.join(" ")}`;
    }

    res.status(200).json({
      status: true,
      message: responseMessage,
      data: updatedProject,
    });
  } catch (error) {
    console.error("Update Project Error:", error);
    res.status(500).json({ status: false, message: error.message });
  }
};

// @desc    Get a project by ID
const getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id).populate({
      path: "categories",
      select: "name",
    });

    if (!project) {
      return res.status(404).json({
        status: false,
        message: "Project not found",
      });
    }

    res.status(200).json({
      status: true,
      message: "Project fetched successfully",
      data: project,
    });
  } catch (error) {
    console.error("Get Project By ID Error:", error);
    res.status(500).json({ status: false, message: error.message });
  }
};

// @desc    Delete a project
const deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project)
      return res
        .status(404)
        .json({ status: false, message: "Project not found" });

    // Delete all images from Cloudinary
    if (project.media && project.media.length > 0) {
      for (const mediaItem of project.media) {
        if (mediaItem.type === "image") {
          try {
            await deleteImageFromCloudinary(mediaItem.src);
          } catch (error) {
            console.error("Error deleting image from Cloudinary:", error);
          }
        }
      }
    }

    await Project.findByIdAndDelete(req.params.id);
    res.status(200).json({ status: true, message: "Project removed" });
  } catch (error) {
    res.status(500).json({ status: false, message: error.message });
  }
};

// @desc    Reorder projects by displayOrder
const reorderProjects = async (req, res) => {
  try {
    const { updates } = req.body;

    if (!Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({
        status: false,
        message: "Updates array is required",
      });
    }

    const bulkUpdates = updates
      .filter(
        (update) =>
          update &&
          update.id &&
          typeof update.displayOrder === "number" &&
          !Number.isNaN(update.displayOrder),
      )
      .map((update) => ({
        updateOne: {
          filter: { _id: update.id },
          update: { $set: { displayOrder: update.displayOrder } },
        },
      }));

    if (bulkUpdates.length === 0) {
      return res.status(400).json({
        status: false,
        message: "No valid updates provided",
      });
    }

    await Project.bulkWrite(bulkUpdates);

    res.status(200).json({
      status: true,
      message: "Project order updated successfully",
    });
  } catch (error) {
    console.error("Reorder Projects Error:", error);
    res.status(500).json({ status: false, message: error.message });
  }
};

module.exports = {
  getProjects,
  getProjectById,
  createProject,
  deleteProject,
  updateProject,
  reorderProjects,
};
