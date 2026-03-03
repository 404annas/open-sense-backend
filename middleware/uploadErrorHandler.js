const multer = require('multer');
const path = require('path');

// Multer error handler middleware
const handleMulterError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        // A Multer error occurred when uploading
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                status: false,
                message: 'File too large. Maximum size is 25MB.'
            });
        }
        
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
            return res.status(400).json({
                status: false,
                message: 'Unexpected field name for file upload.'
            });
        }
        
        if (err.code === 'LIMIT_PART_COUNT') {
            return res.status(400).json({
                status: false,
                message: 'Too many parts in the request.'
            });
        }
        
        if (err.code === 'LIMIT_FIELD_COUNT') {
            return res.status(400).json({
                status: false,
                message: 'Too many fields in the request.'
            });
        }
        
        if (err.code === 'LIMIT_FIELD_KEY_LENGTH') {
            return res.status(400).json({
                status: false,
                message: 'Field name too long.'
            });
        }
        
        if (err.code === 'LIMIT_FIELD_VALUE_LENGTH') {
            return res.status(400).json({
                status: false,
                message: 'Field value too long.'
            });
        }
    } else if (err) {
        // A non-Multer error occurred
        if (err.message.includes('Only image files are allowed')) {
            return res.status(400).json({
                status: false,
                message: err.message
            });
        }
        
        if (err.message.includes('No file provided')) {
            return res.status(400).json({
                status: false,
                message: err.message
            });
        }
        
        // Handle other errors
        console.error('Upload Error:', err);
        return res.status(500).json({
            status: false,
            message: 'An error occurred during file upload: ' + err.message
        });
    }
    
    // Pass error to next middleware if not handled
    next(err);
};

module.exports = handleMulterError;