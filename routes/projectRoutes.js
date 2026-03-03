const express = require('express');
const router = express.Router();
const { getProjects, getProjectById, createProject, deleteProject, updateProject } = require('../controllers/projectController');
const { protect, superAdmin } = require('../middleware/authMiddleware');
const { handleConditionalImageUpload } = require('../middleware/conditionalImageUpload');

// Public route to fetch projects
router.get('/', getProjects);

// Public route to fetch a single project by ID
router.get('/:id', getProjectById);

// Protected Routes (Only SuperAdmin)
router.post('/', protect, superAdmin, handleConditionalImageUpload('media', 10), createProject);
router.delete('/:id', protect, superAdmin, deleteProject);
router.put('/:id', protect, superAdmin, handleConditionalImageUpload('media', 10), updateProject);

module.exports = router;