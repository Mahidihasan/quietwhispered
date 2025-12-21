const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const { protect } = require('../middleware/auth');

// Get all published posts (for visitors)
router.get('/', async (req, res) => {
    try {
        const { sort = 'newest', type, tag, page = 1, limit = 10 } = req.query;
        
        let query = { isPublished: true };
        
        if (type) query.type = type;
        if (tag) query.tags = tag;
        
        let sortOption = {};
        switch(sort) {
            case 'oldest':
                sortOption.date = 1;
                break;
            case 'mood':
                sortOption.mood = 1;
                break;
            case 'type':
                sortOption.type = 1;
                break;
            default:
                sortOption.date = -1;
        }
        
        const posts = await Post.find(query)
            .sort(sortOption)
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .select('-__v');
            
        const total = await Post.countDocuments(query);
        
        res.json({
            success: true,
            posts,
            totalPages: Math.ceil(total / limit),
            currentPage: parseInt(page)
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: process.env.NODE_ENV === 'production' ? 'Server error' : error.message 
        });
    }
});

// Get single post (public)
router.get('/public/:id', async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post || !post.isPublished) {
            return res.status(404).json({ success: false, message: 'Post not found' });
        }
        res.json({ success: true, data: post });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: process.env.NODE_ENV === 'production' ? 'Server error' : error.message 
        });
    }
});

// Admin routes (protected)

// Get all posts (admin only)
router.get('/admin/all', protect, async (req, res) => {
    try {
        const posts = await Post.find().sort({ date: -1 });
        res.json({ success: true, data: posts });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: process.env.NODE_ENV === 'production' ? 'Server error' : error.message 
        });
    }
});

// Create post (admin only)
router.post('/', protect, async (req, res) => {
    try {
        const post = new Post({
            ...req.body,
            date: req.body.date || new Date()
        });
        await post.save();
        res.status(201).json({ success: true, data: post });
    } catch (error) {
        res.status(400).json({ 
            success: false, 
            message: process.env.NODE_ENV === 'production' ? 'Invalid request' : error.message 
        });
    }
});

// Update post (admin only)
router.put('/:id', protect, async (req, res) => {
    try {
        const post = await Post.findByIdAndUpdate(
            req.params.id,
            { ...req.body, updatedAt: new Date() },
            { new: true }
        );
        if (!post) {
            return res.status(404).json({ success: false, message: 'Post not found' });
        }
        res.json({ success: true, data: post });
    } catch (error) {
        res.status(400).json({ 
            success: false, 
            message: process.env.NODE_ENV === 'production' ? 'Invalid request' : error.message 
        });
    }
});

// Delete post (admin only)
router.delete('/:id', protect, async (req, res) => {
    try {
        const post = await Post.findByIdAndDelete(req.params.id);
        if (!post) {
            return res.status(404).json({ success: false, message: 'Post not found' });
        }
        res.json({ success: true, message: 'Post deleted successfully' });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: process.env.NODE_ENV === 'production' ? 'Server error' : error.message 
        });
    }
});

module.exports = router;