#!/usr/bin/env node

/**
 * Reset Admin User Script
 * Deletes existing admin and creates new one with credentials from .env
 * Usage: node scripts/resetAdmin.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('../models/Admin');

async function resetAdmin() {
    try {
        console.log('\n═══════════════════════════════════════════');
        console.log('🔄 Resetting Admin User');
        console.log('═══════════════════════════════════════════\n');

        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        // Delete all existing admins
        const deleteResult = await Admin.deleteMany({});
        console.log(`🗑️  Deleted ${deleteResult.deletedCount} existing admin(s)\n`);

        // Create new admin with .env credentials
        const admin = new Admin({
            username: process.env.ADMIN_USERNAME,
            password: process.env.ADMIN_INITIAL_PASSWORD
        });

        await admin.save();

        console.log('✅ New admin created successfully!\n');
        console.log('═══════════════════════════════════════════');
        console.log('📝 Login Credentials:');
        console.log(`   Username: ${process.env.ADMIN_USERNAME}`);
        console.log(`   Password: ${process.env.ADMIN_INITIAL_PASSWORD}`);
        console.log('═══════════════════════════════════════════\n');

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        process.exit(1);
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
}

resetAdmin();
