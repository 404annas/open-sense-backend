const express = require('express');
const router = express.Router();
const { getCategories, createCategory, deleteCategory, updateCategory } = require('../controllers/categoryController');
const { protect, superAdmin } = require('../middleware/authMiddleware');

// Public route to fetch categories
router.get('/', getCategories);

// Protected Routes (Only SuperAdmin)
router.post('/', protect, superAdmin, createCategory);
router.delete('/:id', protect, superAdmin, deleteCategory);
router.put('/:id', protect, superAdmin, updateCategory);

module.exports = router;