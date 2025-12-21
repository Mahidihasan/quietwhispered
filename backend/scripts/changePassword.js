#!/usr/bin/env node

/**
 * Change Admin Password Script
 * Usage: node scripts/changePassword.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('../models/Admin');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function changePassword() {
    try {
        console.log('\n═══════════════════════════════════════════');
        console.log('🔐 Admin Password Change Tool');
        console.log('═══════════════════════════════════════════\n');

        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        // Get username
        const username = await question('Enter admin username: ');
        
        // Find admin
        const admin = await Admin.findOne({ username: username.trim() });
        
        if (!admin) {
            console.log('\n❌ Admin user not found!');
            process.exit(1);
        }

        // Get new password
        const newPassword = await question('Enter new password: ');
        const confirmPassword = await question('Confirm new password: ');

        if (newPassword !== confirmPassword) {
            console.log('\n❌ Passwords do not match!');
            process.exit(1);
        }

        if (newPassword.length < 6) {
            console.log('\n❌ Password must be at least 6 characters!');
            process.exit(1);
        }

        // Update password
        admin.password = newPassword;
        await admin.save();

        console.log('\n✅ Password changed successfully!');
        console.log('═══════════════════════════════════════════\n');

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        process.exit(1);
    } finally {
        await mongoose.connection.close();
        rl.close();
        process.exit(0);
    }
}

changePassword();
