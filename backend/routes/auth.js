const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const { sendTokenResponse } = require('../middleware/auth');

// @desc    Login admin
// @route   POST /api/auth/login
// @access  Public
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        // Validate email & password
        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide username and password'
            });
        }

        // Check for admin
        const admin = await Admin.findOne({ username }).select('+password');
        if (!admin) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }
        
        // Check if password matches
        const isMatch = await admin.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }
        
        // Send token response
        sendTokenResponse(admin, 200, res);
        
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @desc    Logout admin / clear cookie
// @route   GET /api/auth/logout
// @access  Private
router.get('/logout', (req, res) => {
    res.cookie('token', 'none', {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true
    });
    
    res.status(200).json({
        success: true,
        message: 'Logged out successfully'
    });
});

// @desc    Get current logged in admin
// @route   GET /api/auth/me
// @access  Private
router.get('/me', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized'
            });
        }
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const admin = await Admin.findById(decoded.id);
        
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: 'Admin not found'
            });
        }
        
        res.status(200).json({
            success: true,
            data: admin
        });
    } catch (error) {
        res.status(401).json({
            success: false,
            message: 'Not authorized'
        });
    }
});

module.exports = router;