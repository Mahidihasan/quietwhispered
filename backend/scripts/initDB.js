#!/usr/bin/env node

/**
 * Database Initialization Script
 * Creates a default admin user in MongoDB Atlas
 * Usage: npm run init-db  OR  node scripts/initDB.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('../models/Admin');

// Color codes for terminal output
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m',
};

const log = {
    success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
    error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
    info: (msg) => console.log(`${colors.cyan}ℹ️  ${msg}${colors.reset}`),
    warn: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
    divider: () => console.log('═'.repeat(60)),
};

async function initializeDatabase() {
    try {
        log.divider();
        log.info('Starting database initialization...');
        log.divider();

        // Verify environment variables
        if (!process.env.MONGODB_URI) {
            throw new Error('MONGODB_URI not found in .env file');
        }

        if (!process.env.ADMIN_USERNAME || !process.env.ADMIN_INITIAL_PASSWORD) {
            throw new Error('ADMIN_USERNAME or ADMIN_INITIAL_PASSWORD not found in .env');
        }

        log.info('Connecting to MongoDB Atlas...');
        
        // Connect to MongoDB Atlas
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        log.success('Connected to MongoDB Atlas');

        // Check if admin user already exists
        const adminUsername = process.env.ADMIN_USERNAME;
        const existingAdmin = await Admin.findOne({ username: adminUsername });

        if (existingAdmin) {
            log.warn(`Admin user "${adminUsername}" already exists in database`);
            log.info('Skipping creation (preventing duplicates)');
            log.divider();
            process.exit(0);
            return;
        }

        // Create new admin user
        log.info(`Creating admin user "${adminUsername}"...`);

        const admin = new Admin({
            username: adminUsername,
            password: process.env.ADMIN_INITIAL_PASSWORD,
        });

        // Save admin (password will be auto-hashed by pre-save middleware)
        await admin.save();

        log.success('Admin user created successfully!');
        log.divider();
        log.info('Admin Login Credentials:');
        console.log(`  📝 Username: ${adminUsername}`);
        console.log(`  🔐 Password: ${process.env.ADMIN_INITIAL_PASSWORD}`);
        log.divider();
        log.warn('⚠️  IMPORTANT: Change this password immediately after first login!');
        log.divider();

    } catch (error) {
        log.error(`Database initialization failed: ${error.message}`);
        console.error('\nDetailed error:');
        console.error(error);
        process.exit(1);

    } finally {
        // Close MongoDB connection safely
        if (mongoose.connection.readyState === 1) {
            await mongoose.connection.close();
            log.info('MongoDB connection closed');
        }
        process.exit(0);
    }
}

// Run initialization
initializeDatabase();