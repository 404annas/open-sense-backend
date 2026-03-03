const { parser, compressImage } = require('../config/cloudinary');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');

// Middleware that handles image uploads only if files are present in the request
const handleConditionalImageUpload = (fieldName, maxCount) => async (req, res, next) => {
    // Check if the request is JSON (from frontend with Cloudinary URLs) or multipart/form-data (with files)
    const isJsonRequest = req.headers['content-type'] && req.headers['content-type'].includes('application/json');

    if (isJsonRequest) {
        // If it's a JSON request, it means the frontend sent Cloudinary URLs directly
        // Check if the body contains media as JSON string and parse it if needed
        if (req.body.media && typeof req.body.media === 'string') {
            try {
                req.body.media = JSON.parse(req.body.media);
            } catch (e) {
                // If parsing fails, leave it as is
            }
        }

        // Also parse categories if it's a string
        if (req.body.categories && typeof req.body.categories === 'string') {
            try {
                req.body.categories = JSON.parse(req.body.categories);
            } catch (e) {
                // If parsing fails, leave it as is
            }
        }

        return next();
    } else {
        // If it's a multipart request, process files as before (traditional upload)
        // First, parse the files using multer
        parser.array(fieldName, maxCount)(req, res, async (err) => {
            if (err) {
                return res.status(400).json({ message: err.message });
            }

            if (req.files && req.files.length > 0) {
                const processedImages = [];
                const compressionMessages = [];

                // Process each uploaded file
                for (const file of req.files) {
                    try {
                        // Check if the file is an image
                        if (file.mimetype.startsWith('image/')) {
                            // Compress the image if needed
                            const result = await compressImage(file.buffer);

                            if (result.wasCompressed) {
                                // Calculate compression percentage
                                const compressionPercentage = Math.round(((result.originalSize - result.compressedSize) / result.originalSize) * 100);

                                // Upload the compressed image to Cloudinary
                                const cloudinaryResult = await new Promise((resolve, reject) => {
                                    const uploadStream = cloudinary.uploader.upload_stream(
                                        {
                                            folder: 'opensense-projects',
                                            resource_type: 'image',
                                            public_id: `${Date.now()}_${file.originalname.replace(/\.[^/.]+$/, "")}`, // Unique public ID to avoid conflicts
                                            timeout: 120000 // 2 minute timeout for large uploads
                                        },
                                        (error, result) => {
                                            if (error) {
                                                reject(error);
                                            } else {
                                                resolve(result);
                                            }
                                        }
                                    );
                                    uploadStream.end(result.buffer);
                                });

                                processedImages.push({
                                    type: 'image',
                                    src: cloudinaryResult.secure_url,
                                    alt: file.originalname,
                                    originalSize: result.originalSize,
                                    compressedSize: result.compressedSize,
                                    compressionPercentage: compressionPercentage
                                });

                                // Log compression details to console
                                console.log(`Image compression details for "${file.originalname}":`);
                                console.log(`  - Original size: ${(result.originalSize / 1024 / 1024).toFixed(2)} MB`);
                                console.log(`  - Compressed size: ${(result.compressedSize / 1024 / 1024).toFixed(2)} MB`);
                                console.log(`  - Compression: ${compressionPercentage}%`);

                                compressionMessages.push(
                                    `Image "${file.originalname}" was successfully compressed by ${compressionPercentage}% to optimize loading speed.`
                                );
                            } else {
                                // Upload the original image to Cloudinary (no compression needed)
                                const cloudinaryResult = await new Promise((resolve, reject) => {
                                    const uploadStream = cloudinary.uploader.upload_stream(
                                        {
                                            folder: 'opensense-projects',
                                            resource_type: 'image',
                                            public_id: `${Date.now()}_${file.originalname.replace(/\.[^/.]+$/, "")}`, // Unique public ID to avoid conflicts
                                            timeout: 120000 // 2 minute timeout for large uploads
                                        },
                                        (error, result) => {
                                            if (error) {
                                                reject(error);
                                            } else {
                                                resolve(result);
                                            }
                                        }
                                    );
                                    uploadStream.end(file.buffer);
                                });

                                processedImages.push({
                                    type: 'image',
                                    src: cloudinaryResult.secure_url,
                                    alt: file.originalname,
                                    originalSize: result.originalSize,
                                    compressedSize: result.compressedSize,
                                    compressionPercentage: result.wasCompressed ?
                                        Math.round(((result.originalSize - result.compressedSize) / result.originalSize) * 100) : 0
                                });

                                // Log that no compression was needed
                                if (result.wasCompressed) {
                                    console.log(`Image compression details for "${file.originalname}":`);
                                    console.log(`  - Original size: ${(result.originalSize / 1024 / 1024).toFixed(2)} MB`);
                                    console.log(`  - Compressed size: ${(result.compressedSize / 1024 / 1024).toFixed(2)} MB`);
                                    console.log(`  - Compression: ${Math.round(((result.originalSize - result.compressedSize) / result.originalSize) * 100)}%`);
                                } else {
                                    console.log(`Image "${file.originalname}" did not require compression:`);
                                    console.log(`  - Size: ${(result.originalSize / 1024 / 1024).toFixed(2)} MB`);
                                    console.log(`  - Under threshold (< 1MB), so no compression applied.`);
                                }
                            }
                        } else {
                            // For non-image files, just store the original
                            const cloudinaryResult = await new Promise((resolve, reject) => {
                                const uploadStream = cloudinary.uploader.upload_stream(
                                    {
                                        folder: 'opensense-projects',
                                        resource_type: 'raw',
                                        public_id: `${Date.now()}_${file.originalname.replace(/\.[^/.]+$/, "")}`, // Unique public ID to avoid conflicts
                                        timeout: 120000 // 2 minute timeout for large uploads
                                    },
                                    (error, result) => {
                                        if (error) {
                                            reject(error);
                                        } else {
                                            resolve(result);
                                        }
                                    }
                                );
                                uploadStream.end(file.buffer);
                            });

                            processedImages.push({
                                type: 'file',
                                src: cloudinaryResult.secure_url,
                                alt: file.originalname
                            });
                        }
                    } catch (uploadError) {
                        console.error('Error uploading file to Cloudinary:', uploadError);
                        return res.status(500).json({ message: `Error uploading file: ${uploadError.message}` });
                    }
                }

                req.body.uploadedImages = processedImages;

                // Add compression messages to the request for later use in the response
                if (compressionMessages.length > 0) {
                    req.compressionMessages = compressionMessages;
                }
            }

            next();
        });
    }
};

module.exports = {
    handleConditionalImageUpload,
};