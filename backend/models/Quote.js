const mongoose = require('mongoose');

const quoteSchema = new mongoose.Schema({
    text: {
        type: String,
        required: true,
        trim: true
    },
    author: {
        type: String,
        required: true,
        trim: true
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Only one quote document should exist - use singleton pattern
quoteSchema.statics.getSiteQuote = async function() {
    let quote = await this.findOne();
    if (!quote) {
        // Create default quote if none exists
        quote = await this.create({
            text: "The pen is mightier than the sword.",
            author: "— Edward Bulwer-Lytton"
        });
    }
    return quote;
};

quoteSchema.statics.updateSiteQuote = async function(text, author) {
    let quote = await this.findOne();
    if (!quote) {
        quote = await this.create({ text, author });
    } else {
        quote.text = text;
        quote.author = author;
        quote.updatedAt = new Date();
        await quote.save();
    }
    return quote;
};

module.exports = mongoose.model('Quote', quoteSchema);
