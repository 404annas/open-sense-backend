const mongoose = require('mongoose');

const CategorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        index: true
    }
}, { timestamps: true });

// Text index for name search
CategorySchema.index({
    name: 'text',
});

module.exports = mongoose.model('Category', CategorySchema);