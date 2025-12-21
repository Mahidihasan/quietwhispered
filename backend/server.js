const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fileUpload = require('express-fileupload');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Load environment variables FIRST, before any other code
dotenv.config();

// Verify MongoDB URI is loaded from .env
if (!process.env.MONGODB_URI) {
    console.error('❌ ERROR: MONGODB_URI not found in .env file');
    process.exit(1);
}

const app = express();

// Security: Helmet for security headers
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https://res.cloudinary.com"],
            mediaSrc: ["'self'", "https://res.cloudinary.com"],
            frameSrc: ["'self'", "https://www.youtube.com", "https://player.vimeo.com"],
            scriptSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"]
        }
    },
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    }
}));

// Security: Rate limiting for auth routes
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per window
    message: 'Too many login attempts, please try again after 15 minutes',
    standardHeaders: true,
    legacyHeaders: false
});

// Middleware
app.use(cors({
    origin: process.env.CORS_ORIGIN || process.env.FRONTEND_URL || '*',
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(fileUpload({
    limits: { fileSize: parseInt(process.env.MAX_FILE_UPLOAD || '10000000', 10) },
    useTempFiles: false,
    createParentPath: true
}));

// Database connection - NO FALLBACK TO LOCALHOST
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => {
    console.log('✅ Connected to MongoDB Atlas');
})
.catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
});

const db = mongoose.connection;
db.on('error', (err) => {
    console.error('❌ MongoDB connection error:', err.message);
});
db.once('open', () => {
    console.log('✅ Connected to MongoDB');
});

// Routes
const postRoutes = require('./routes/posts');
const authRoutes = require('./routes/auth');
const uploadRoutes = require('./routes/uploads');

// Apply rate limiter to auth routes BEFORE registering them
const rateLimitedAuthRoutes = express.Router();
rateLimitedAuthRoutes.use('/login', authLimiter);
rateLimitedAuthRoutes.use('/', authRoutes);

app.use('/api/posts', postRoutes);
app.use('/api/auth', rateLimitedAuthRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/uploads', express.static(path.join(__dirname, process.env.FILE_UPLOAD_PATH || 'uploads')));

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ success: true, message: 'Server is running' });
});

// Serve static files and frontend in production
if (process.env.NODE_ENV === 'production') {
    const frontendBuildPath = path.join(__dirname, '../frontend/build');
    
    // Serve static assets (JS, CSS, images, etc.)
    app.use(express.static(frontendBuildPath, {
        etag: false,
        index: false // Disable auto-serving index.html here, we handle it explicitly
    }));
    
    // Catch-all route: serve index.html for all non-API routes
    // This enables client-side routing for React Router
    app.get('*', (req, res) => {
        res.sendFile(path.join(frontendBuildPath, 'index.html'));
    });
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});