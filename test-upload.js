// Simple test script to verify Cloudinary and Multer integration
const cloudinary = require('./utils/cloudinary');

// Test Cloudinary configuration
console.log('Testing Cloudinary Configuration...');

// Check if Cloudinary is properly configured
if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    console.log('❌ Cloudinary environment variables are not set!');
    console.log('Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in your .env file');
} else {
    console.log('✅ Cloudinary environment variables are set');
    
    // Test connection by getting account info
    cloudinary.api.ping()
        .then(result => {
            console.log('✅ Successfully connected to Cloudinary:');
            console.log('- Cloud Name:', process.env.CLOUDINARY_CLOUD_NAME);
            console.log('- Ping Result:', result);
        })
        .catch(error => {
            console.log('❌ Error connecting to Cloudinary:', error.message);
        });
}

console.log('\nTo test the image upload functionality:');
console.log('1. Set up your Cloudinary credentials in the .env file');
console.log('2. Start your server with: npm run dev');
console.log('3. Use a tool like Postman to send a POST request to /api/projects');
console.log('4. Send the request as form-data with:');
console.log('   - Key: "media", Type: File, Value: [select an image file]');
console.log('   - Key: "name", Type: Text, Value: "Test Project"');
console.log('   - Key: "description", Type: Text, Value: "Test Description"');
console.log('   - Key: "categories", Type: Text, Value: \'["valid category ID"]\'');
console.log('   - Key: "media", Type: Text, Value: \'[{"type": "iframe", "src": "https://www.youtube.com/embed/qUFJs9glVoU?si=HXZqEEDZjm5bpUyZ", "alt": "Discos el Popular Video"}]\'');