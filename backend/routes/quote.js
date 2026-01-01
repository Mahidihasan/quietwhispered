const express = require('express');
const router = express.Router();
const Quote = require('../models/Quote');
const { protect } = require('../middleware/auth');

// @desc    Get site quote
// @route   GET /api/quote
// @access  Public
router.get('/', async (req, res) => {
    try {
        const quote = await Quote.getSiteQuote();
        
        // Set cache-control headers to prevent caching
        res.set({
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
            'Surrogate-Control': 'no-store'
        });
        
        res.json({ 
            success: true, 
            data: {
                text: quote.text,
                author: quote.author
            }
        });
    } catch (error) {
        console.error('Error fetching quote:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error' 
        });
    }
});

// @desc    Update site quote
// @route   PUT /api/quote
// @access  Private (admin only)
router.put('/', protect, async (req, res) => {
    try {
        const { text, author } = req.body;
        
        if (!text || !author) {
            return res.status(400).json({
                success: false,
                message: 'Please provide both text and author'
            });
        }
        
        const quote = await Quote.updateSiteQuote(text, author);
        
        res.json({ 
            success: true, 
            data: {
                text: quote.text,
                author: quote.author
            }
        });
    } catch (error) {
        console.error('Error updating quote:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error' 
        });
    }
});

module.exports = router;
