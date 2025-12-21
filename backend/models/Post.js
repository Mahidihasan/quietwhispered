const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    content: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['story', 'memory', 'journey', 'image', 'video'],
        default: 'story'
    },
    media: {
        type: String, // URL to uploaded file
        default: null
    },
    tags: [{
        type: String,
        trim: true
    }],
    date: {
        type: Date,
        required: true
    },
    mood: {
        type: String,
        enum: ['happy', 'sad', 'excited', 'calm', 'reflective', 'adventurous', null],
        default: null
    },
    location: {
        type: String,
        trim: true
    },
    isPublished: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Post', postSchema);