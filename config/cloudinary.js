const cloudinary = require('cloudinary').v2;
const multer = require('multer');

// Try to require sharp, but handle gracefully if unavailable
let sharp;
try {
  sharp = require('sharp');
} catch (error) {
  console.warn('Sharp library not available. Image compression will be disabled.');
  sharp = null;
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Function to compress image if it exceeds size threshold
const compressImage = async (buffer) => {
  const imageSizeThreshold = 2 * 1024 * 1024; // Reduced to 2MB threshold for better Vercel compatibility

  // Check if sharp is available and if the image buffer is larger than the threshold
  if (sharp && buffer.length > imageSizeThreshold) {
    try {
      // Compress the image to reduce file size
      const compressedBuffer = await sharp(buffer)
        .resize(1200, null, { // Reduced max width to 1200px for better Vercel compatibility
          fit: 'inside',
          withoutEnlargement: true
        })
        .jpeg({ quality: 75 }) // Reduced quality to 75% for better compression
        .toBuffer();

      return {
        buffer: compressedBuffer,
        wasCompressed: true,
        originalSize: buffer.length,
        compressedSize: compressedBuffer.length
      };
    } catch (compressionError) {
      console.error('Image compression failed:', compressionError.message);
      // If compression fails, return the original buffer
      return {
        buffer: buffer,
        wasCompressed: false,
        originalSize: buffer.length,
        compressedSize: buffer.length
      };
    }
  }

  // Even if the image is under the threshold, we might want to compress slightly to stay under Vercel limits
  if (sharp && buffer.length > 1.5 * 1024 * 1024) { // If over 1.5MB, compress slightly
    try {
      const compressedBuffer = await sharp(buffer)
        .resize(1500, null, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .jpeg({ quality: 80 })
        .toBuffer();

      return {
        buffer: compressedBuffer,
        wasCompressed: true,
        originalSize: buffer.length,
        compressedSize: compressedBuffer.length
      };
    } catch (compressionError) {
      console.error('Light image compression failed:', compressionError.message);
      return {
        buffer: buffer,
        wasCompressed: false,
        originalSize: buffer.length,
        compressedSize: buffer.length
      };
    }
  }

  return {
    buffer: buffer,
    wasCompressed: false,
    originalSize: buffer.length,
    compressedSize: buffer.length
  };
};

// Custom storage that stores files in memory to allow processing
const compressingStorage = multer.memoryStorage(); // Store in memory to allow processing

const parser = multer({
  storage: compressingStorage,
  limits: {
    fileSize: 25 * 1024 * 1024 // 25MB limit to accommodate 20MB files
  }
});

// Export both the parser and a function to handle compression
module.exports = { parser, compressImage };
