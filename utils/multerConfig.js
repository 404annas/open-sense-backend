const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('./cloudinary');

// Configure Cloudinary storage
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'Open Sense-projects', // Folder in Cloudinary where images will be stored
        allowed_formats: ['jpeg', 'jpg', 'png', 'gif', 'webp', "svg"],
        transformation: [
            { quality: 'auto:good' }, // Optimize quality with good balance
            { fetch_format: 'auto' } // Auto format optimization
        ]
    },
});

// File filter to ensure only images are uploaded
const fileFilter = (req, res, cb) => {
    if (req.file) {
        if (req.file.mimetype.startsWith('image/')) {
            cb(null, true); // Accept the file
        } else {
            cb(new Error('Only image files are allowed!'), false); // Reject the file
        }
    } else {
        cb(new Error('No file provided!'), false);
    }
};


// Configure multer
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 25 * 1024 * 1024 // 25MB limit to accommodate 20MB files
    },
    fileFilter: fileFilter

});

module.exports = upload;