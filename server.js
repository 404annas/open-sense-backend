require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

// Import error handler
const handleMulterError = require('./middleware/uploadErrorHandler');

// Route Imports
const authRoutes = require('./routes/authRoutes');
const projectRoutes = require('./routes/projectRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

// Initialize App
const app = express();
const PORT = process.env.PORT || 5000;

// Enhanced error logging
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    process.exit(1);
});

// Database Connection
connectDB()
    .then(() => {
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`🚀 Server running at: http://0.0.0.0:${PORT}`);
            console.log(`Allowed origins:`, [
                'http://localhost:5173',
                'http://localhost:3000',
                "https://open-sense-dashboard.netlify.app",
                "https://www.opensenseproductions.com",
                "https://open-sense-ano.vercel.app",
                'http://localhost:5174',
                "https://open-senses.vercel.app",
                "https://open-sense-dashboard.vercel.app"
            ]);
        });
    })
    .catch(err => {
        console.error('Database connection failed:', err);
        process.exit(1);
    });


// Middleware
app.use(express.json({ limit: '30mb' })); // Body parser with increased limit for large files
app.use(express.urlencoded({ limit: '30mb', extended: true })); // For form data

// Increase timeout for large file uploads
app.use((req, res, next) => {
    req.setTimeout(300000, () => { // 5 minutes timeout for large uploads
        res.status(408).json({ status: false, message: 'Request timeout' });
    });
    next();
});
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    "https://open-sense-dashboard.netlify.app",
    "https://www.opensenseproductions.com",
    "https://opensenseproductions.com",
    "https://open-sense-xi.vercel.app",
    "https://open-sense-ano.vercel.app",
    'http://localhost:5174',
    "https://open-senses.vercel.app",
    "https://open-sense-dashboard.vercel.app"
];
app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
})); // Enable CORS

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Health Check
app.get('/', (req, res) => {
    res.send('API is running...');
});

// Multer Error Handler (should come before global error handler)
app.use(handleMulterError);

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('Global Error Handler:', {
        url: req.url,
        method: req.method,
        headers: req.headers,
        error: err.message,
        stack: err.stack,
        timestamp: new Date().toISOString()
    });

    res.status(500).json({
        status: false,
        message: 'Server Error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined,
        timestamp: new Date().toISOString()
    });
});


