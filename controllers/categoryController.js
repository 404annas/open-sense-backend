const Category = require('../models/Category');

// @desc    Get all categories
const getCategories = async (req, res) => {
    try {
        const categories = await Category.find().sort({ createdAt: -1 });

        res.status(200).json({
            status: true,
            message: "Categories fetched successfully",
            data: categories
        });
    } catch (error) {
        res.status(500).json({ status: false, message: error.message });
    }
};

// @desc    Create a category
const createCategory = async (req, res) => {
    try {
        const { name } = req.body;

        if (!name) {
            return res.status(400).json({
                status: false,
                message: 'Please provide a name'
            });
        }

        const category = await Category.create({
            name
        });

        res.status(201).json({
            status: true,
            message: "Category created successfully",
            data: category
        });
    } catch (error) {
        res.status(500).json({ status: false, message: error.message });
    }
};

// @desc    Update a category
const updateCategory = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        if (!category) return res.status(404).json({ status: false, message: 'Category not found' });

        const { name } = req.body;

        if (!name) {
            return res.status(400).json({
                status: false,
                message: 'Please provide a name'
            });
        }

        const updatedCategory = await Category.findByIdAndUpdate(
            req.params.id, 
            { name }, 
            { new: true, runValidators: true }
        );

        res.status(200).json({ 
            status: true, 
            message: "Category updated successfully", 
            data: updatedCategory 
        });
    } catch (error) {
        res.status(500).json({ status: false, message: error.message });
    }
};

// @desc    Delete a category
const deleteCategory = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        if (!category) return res.status(404).json({ status: false, message: 'Category not found' });
        
        await Category.findByIdAndDelete(req.params.id);
        res.status(200).json({ status: true, message: 'Category removed' });
    } catch (error) {
        res.status(500).json({ status: false, message: error.message });
    }
};

module.exports = { getCategories, createCategory, deleteCategory, updateCategory };