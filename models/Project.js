const mongoose = require('mongoose');

const MediaItemSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['image', 'iframe'],
        required: true,
    },
    src: {
        type: String,
        required: true,
    },
    alt: {
        type: String,
        required: true,
    },
});

const ProjectSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    media: [MediaItemSchema],
    categories: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
    }],
    displayOrder: {
        type: Number,
        default: 0,
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        index: true
    }
}, { timestamps: true });

// Compound indexes for common query patterns
ProjectSchema.index({ categories: 1, createdAt: -1 }); // For category + sort queries
ProjectSchema.index({ createdAt: -1 }); // For default sorting
ProjectSchema.index({ displayOrder: 1 }); // For manual ordering
ProjectSchema.index({ name: 'text', description: 'text' }); // Text search

module.exports = mongoose.model('Project', ProjectSchema);
