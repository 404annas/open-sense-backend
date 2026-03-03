const cloudinary = require('./cloudinary');

/**
 * Extract public ID from Cloudinary URL
 * @param {string} url - Cloudinary image URL
 * @returns {string|null} - Public ID or null if not found
 */
const extractPublicId = (url) => {
    if (!url || typeof url !== 'string') return null;
    
    // Cloudinary URLs typically follow the format:
    // https://res.cloudinary.com/<cloud_name>/image/upload/<folder>/<public_id>.<extension>
    // or variations of this
    
    try {
        const urlObj = new URL(url);
        const pathParts = urlObj.pathname.split('/');
        const uploadIndex = pathParts.indexOf('upload');
        
        if (uploadIndex !== -1) {
            // Everything after 'upload/' until the filename is part of the path
            const imagePath = pathParts.slice(uploadIndex + 1).join('/');
            // Remove the extension to get the public_id
            const publicId = imagePath.replace(/\.[^/.]+$/, "");
            return publicId;
        }
    } catch (error) {
        console.error('Error extracting public ID:', error);
        return null;
    }
    
    return null;
};

/**
 * Delete image from Cloudinary
 * @param {string} imageUrl - Cloudinary image URL
 * @returns {Promise<boolean>} - True if deletion successful
 */
const deleteImageFromCloudinary = async (imageUrl) => {
    try {
        const publicId = extractPublicId(imageUrl);
        
        if (!publicId) {
            console.warn('Could not extract public ID from image URL:', imageUrl);
            return false;
        }
        
        const result = await cloudinary.uploader.destroy(publicId);
        
        if (result.result === 'ok') {
            console.log('Image deleted successfully from Cloudinary:', publicId);
            return true;
        } else {
            console.error('Failed to delete image from Cloudinary:', result);
            return false;
        }
    } catch (error) {
        console.error('Error deleting image from Cloudinary:', error);
        return false;
    }
};

module.exports = { deleteImageFromCloudinary, extractPublicId };