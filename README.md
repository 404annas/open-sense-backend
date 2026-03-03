# Open Sense Backend API

A comprehensive Node.js backend API for Open Sense, featuring project management, user authentication, and robust data handling capabilities.

## Table of Contents
- [Overview](#overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Installation](#installation)
- [Project Structure](#project-structure)
- [API Endpoints](#api-endpoints)
- [Database Schema](#database-schema)
- [Authentication](#authentication)
- [Authorization](#authorization)
- [File Upload](#file-upload)
- [Error Handling](#error-handling)
- [Environment Configuration](#environment-configuration)
- [Development](#development)
- [Deployment](#deployment)
- [Security](#security)
- [Performance](#performance)
- [Troubleshooting](#troubleshooting)

## Overview

Open Sense Backend is a Node.js/Express application that provides a RESTful API for managing projects, categories, and user authentication. The backend is designed to be scalable, secure, and efficient with comprehensive data validation and error handling.

## Features

- **RESTful API**: Standard REST API endpoints for all resources
- **Authentication**: JWT-based authentication system
- **Authorization**: Role-based access control (SuperAdmin)
- **File Upload**: Cloudinary integration for image management
- **Data Validation**: Comprehensive input validation
- **Search & Filter**: Advanced search and filtering capabilities
- **Pagination**: Efficient pagination for large datasets
- **Error Handling**: Comprehensive error handling and logging
- **Security**: Built-in security measures and best practices

## Technology Stack

- **Runtime**: Node.js (v18+)
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **File Upload**: Multer + Cloudinary
- **Validation**: Mongoose schema validation
- **Security**: bcrypt, helmet, express-rate-limit
- **Environment**: dotenv
- **Development**: nodemon, concurrently

## Installation

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (local or cloud instance)
- Cloudinary account (for image upload)

### Setup Steps

1. **Clone the repository**
```bash
git clone <repository-url>
cd Open Sense-backend/backend
```

2. **Install dependencies**
```bash
npm install
```

3. **Create environment file**
```bash
cp .env.example .env
```

4. **Update environment variables**
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/Open Sense
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRE=30d
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

5. **Start the server**
```bash
npm run dev
```

## Project Structure

```
backend/
├── config/               # Configuration files
│   └── db.js            # Database connection
├── controllers/          # Route controllers
│   ├── authController.js # Authentication logic
│   ├── projectController.js # Project management logic
│   └── userController.js # User management logic
├── middleware/           # Custom middleware
│   ├── authMiddleware.js # Authentication middleware
│   ├── imageUpload.js   # Image upload middleware
│   └── errorMiddleware.js # Error handling middleware
├── models/              # Mongoose models
│   ├── Project.js       # Project model
│   ├── User.js          # User model
│   └── Category.js      # Category model
├── routes/              # API routes
│   ├── authRoutes.js    # Authentication routes
│   ├── projectRoutes.js # Project routes
│   └── userRoutes.js    # User routes
├── utils/               # Utility functions
│   ├── cloudinary.js    # Cloudinary configuration
│   ├── deleteFromCloudinary.js # Image deletion utility
│   ├── generateToken.js # JWT token generation
│   └── multerConfig.js  # Multer configuration
├── .env                 # Environment variables
├── .env.example         # Environment variables template
├── server.js            # Main server file
└── package.json         # Project dependencies
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/profile` - Get user profile (requires authentication)

### Projects
- `GET /api/projects` - Get all projects (with pagination, search, filters)
- `GET /api/projects/:id` - Get project by ID
- `POST /api/projects` - Create new project (SuperAdmin only)
- `PUT /api/projects/:id` - Update project (SuperAdmin only)
- `DELETE /api/projects/:id` - Delete project (SuperAdmin only)

### Categories
- `GET /api/categories` - Get all categories
- `POST /api/categories` - Create category (SuperAdmin only)
- `PUT /api/categories/:id` - Update category (SuperAdmin only)
- `DELETE /api/categories/:id` - Delete category (SuperAdmin only)

### Users
- `GET /api/users` - Get all users (SuperAdmin only)
- `GET /api/users/:id` - Get user by ID (SuperAdmin only)
- `PUT /api/users/:id` - Update user (SuperAdmin only)
- `DELETE /api/users/:id` - Delete user (SuperAdmin only)

## Database Schema

### Project Schema
```javascript
{
  name: String,
  description: String,
  media: [
    {
      type: "image" | "iframe",
      src: String,
      alt: String
    }
  ],
  categories: [ObjectId],    // Array of references to Category model
  createdBy: ObjectId,       // Reference to User model
  createdAt: Date,          // Creation timestamp
  updatedAt: Date           // Update timestamp
}
```

### User Schema
```javascript
{
  name: String,             // User's full name
  email: String,            // User's email (unique)
  password: String,         // Hashed password
  role: {
    type: String,           // User role (user, admin, superadmin)
    default: 'user'
  },
  createdAt: Date,          // Creation timestamp
  updatedAt: Date           // Update timestamp
}
```

### Category Schema
```javascript
{
  name: String,             // English category name
  createdAt: Date,          // Creation timestamp
  updatedAt: Date           // Update timestamp
}
```

## Authentication

### JWT Implementation
- JSON Web Tokens for stateless authentication
- Token expiration (configurable via `JWT_EXPIRE`)
- Secure token storage and validation
- Refresh token functionality (if implemented)

### Authentication Flow
1. User sends credentials to `/api/auth/login`
2. Server validates credentials
3. Server generates JWT if credentials are valid
4. Client stores JWT (typically in localStorage or cookies)
5. Client includes JWT in Authorization header for protected routes
6. Server validates JWT on each protected request

### Token Validation
```javascript
const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
      next();
    } catch (error) {
      res.status(401).json({ status: false, message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    res.status(401).json({ status: false, message: 'Not authorized, no token' });
  }
});
```

## Authorization

### Role-Based Access Control
- **SuperAdmin**: Full access to all routes and operations
- **Admin**: Limited administrative access
- **User**: Basic access to public routes

### Authorization Middleware
- `protect` - Requires authentication
- `superAdmin` - Requires SuperAdmin role
- `admin` - Requires Admin role

### Authorization Flow
1. User authenticates and receives JWT
2. User makes request to protected endpoint
3. Authentication middleware validates JWT
4. Authorization middleware checks user role
5. Request proceeds if user has required permissions

## File Upload

### Cloudinary Integration
- Automatic image upload to Cloudinary
- Image optimization and transformation
- Secure image deletion
- Image URL management

### Upload Process
1. Client uploads image via multipart form data
2. Multer handles file upload to temporary storage
3. File is uploaded to Cloudinary
4. Cloudinary URL is stored in database
5. Temporary file is deleted from server

### Image Management
- Automatic image optimization
- Multiple format support (JPEG, PNG, WebP)
- Size validation and compression
- Duplicate detection and handling

## Error Handling

### Error Response Format
```javascript
{
  status: false,
  message: "Error description",
  data: {} // Optional error data
}
```

### Error Types
- **Validation Errors**: Input validation failures
- **Authentication Errors**: Failed authentication
- **Authorization Errors**: Insufficient permissions
- **Database Errors**: Database operation failures
- **Upload Errors**: File upload failures
- **Server Errors**: Internal server errors

### Error Logging
- Comprehensive error logging
- Stack trace capture
- Error categorization
- Performance monitoring integration

## Environment Configuration

### Required Environment Variables
```env
NODE_ENV=development              # Environment mode
PORT=5000                        # Server port
MONGODB_URI=mongodb://localhost:27017/Open Sense # Database connection string
JWT_SECRET=your_jwt_secret_here  # JWT secret key
JWT_EXPIRE=30d                   # JWT expiration time
CLOUDINARY_CLOUD_NAME=your_cloud_name # Cloudinary cloud name
CLOUDINARY_API_KEY=your_api_key  # Cloudinary API key
CLOUDINARY_API_SECRET=your_api_secret # Cloudinary API secret
```

### Environment-Specific Configurations
- **Development**: Detailed error messages, logging
- **Production**: Optimized performance, security headers
- **Testing**: Test database, mock services

## Development

### Available Scripts

- `npm run dev` - Start development server with auto-reload
- `npm start` - Start production server
- `npm test` - Run tests (if implemented)
- `npm run lint` - Run linter (if configured)

### Development Tools
- **Nodemon**: Auto-restart server on file changes
- **ESLint**: Code linting and formatting
- **Prettier**: Code formatting
- **Postman**: API testing

### Development Best Practices
- Use environment variables for configuration
- Implement comprehensive input validation
- Use asyncHandler for error handling
- Follow RESTful API conventions
- Implement proper logging
- Use consistent error response format

## Deployment

### Production Setup
```bash
npm install --production
npm start
```

### Environment Variables for Production
```env
NODE_ENV=production
PORT=5000
MONGODB_URI=your_production_mongodb_uri
JWT_SECRET=your_production_jwt_secret
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Deployment Platforms
- **Heroku**: Platform-as-a-Service
- **AWS**: Amazon Web Services
- **DigitalOcean**: Cloud hosting
- **Self-hosted**: Custom server deployment

### Production Security
- HTTPS enforcement
- Security headers (Helmet)
- Rate limiting
- Input sanitization
- SQL injection prevention

## Security

### Security Measures
- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt for secure password storage
- **Input Validation**: Comprehensive input validation
- **Rate Limiting**: Protection against brute force attacks
- **CORS**: Cross-origin resource sharing configuration
- **Helmet**: Security headers
- **SQL Injection Prevention**: Mongoose query sanitization

### Security Best Practices
- Never store sensitive data in plain text
- Use environment variables for secrets
- Implement proper access controls
- Regular security updates
- Secure file upload validation
- Regular security audits

## Performance

### Performance Optimizations
- **Database Indexing**: Proper indexing for queries
- **Caching**: Redis or in-memory caching (if implemented)
- **Pagination**: Efficient data retrieval
- **Image Optimization**: Cloudinary image optimization
- **Connection Pooling**: Database connection optimization
- **API Rate Limiting**: Prevent abuse

### Performance Monitoring
- Request/response time tracking
- Database query optimization
- Memory usage monitoring
- Error rate monitoring

## Troubleshooting

### Common Issues

1. **Database Connection Issues**
   - Verify MongoDB URI is correct
   - Check if MongoDB is running
   - Verify database credentials

2. **Authentication Issues**
   - Check JWT secret configuration
   - Verify token format in requests
   - Ensure proper Authorization header format

3. **File Upload Issues**
   - Verify Cloudinary credentials
   - Check file size limits
   - Ensure proper form data format

4. **Environment Variables Not Loading**
   - Verify `.env` file exists
   - Check variable names match expected format
   - Restart server after changing environment variables

### Debugging Tips
- Enable detailed logging in development
- Use Postman for API testing
- Monitor server logs for errors
- Check database connections
- Verify middleware execution order

## API Documentation

### Request Format
```javascript
// Headers
Content-Type: application/json
Authorization: Bearer <jwt_token> // For protected routes
```

### Response Format
```javascript
{
  status: true,           // Success status
  message: "Success message",
  data: {}               // Response data (optional)
}
```

### Error Response Format
```javascript
{
  status: false,
  message: "Error message",
  data: {}               // Error details (optional)
}
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes following coding standards
4. Add tests if applicable
5. Submit a pull request

## License

[Specify your license here]

## Support

For support, please contact [contact information].